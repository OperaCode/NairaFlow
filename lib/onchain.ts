import { ethers, EventLog } from 'ethers'

const ERC20_ABI = [
  'event Transfer(address indexed from, address indexed to, uint256 value)',
]

export interface OnchainTransferMatch {
  txHash: string
  logIndex: number
  blockNumber: number
  tokenAddress: string
  amountUsd: number
}

export async function extractUsdcTransferToAddress(
  txHash: string,
  recipientAddress: string,
  tokenAddress: string,
  rpcUrl: string
) {
  const provider = new ethers.JsonRpcProvider(rpcUrl)
  const receipt = await provider.getTransactionReceipt(txHash)
  if (!receipt || receipt.status !== 1) {
    throw new Error('Transaction not found or failed')
  }

  const iface = new ethers.Interface(ERC20_ABI)
  const normalizedRecipient = recipientAddress.toLowerCase()
  const normalizedToken = tokenAddress.toLowerCase()

  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== normalizedToken) continue
    try {
      const parsed = iface.parseLog({
        topics: log.topics,
        data: log.data,
      })
      if (!parsed || parsed.name !== 'Transfer') continue

      const to = String(parsed.args[1]).toLowerCase()
      if (to !== normalizedRecipient) continue

      const rawValue = parsed.args[2] as bigint
      const amountUsd = Number(ethers.formatUnits(rawValue, 6))
      if (!Number.isFinite(amountUsd) || amountUsd <= 0) {
        throw new Error('Invalid transfer amount')
      }

      return {
        amountUsd,
        blockNumber: receipt.blockNumber,
      }
    } catch {
      // ignore non-matching logs
    }
  }

  throw new Error('No USDC transfer to linked wallet found in this transaction')
}

export async function findTransfersToAddressInRange(
  recipientAddress: string,
  tokenAddress: string,
  rpcUrl: string,
  fromBlock: number,
  toBlock: number
): Promise<OnchainTransferMatch[]> {
  const provider = new ethers.JsonRpcProvider(rpcUrl)
  const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider)
  const normalizedRecipient = recipientAddress.toLowerCase()
  const filter = contract.filters.Transfer(null, normalizedRecipient)
  const events = await contract.queryFilter(filter, fromBlock, toBlock)

  return events
    .map((event) => {
      if (!(event instanceof EventLog)) return null
      const args = event.args as unknown as [string, string, bigint] | undefined
      if (!args) return null
      const rawValue = args[2]
      const amountUsd = Number(ethers.formatUnits(rawValue, 6))
      if (!Number.isFinite(amountUsd) || amountUsd <= 0) return null
      return {
        txHash: event.transactionHash,
        logIndex: Number(event.index ?? 0),
        blockNumber: event.blockNumber,
        tokenAddress: tokenAddress.toLowerCase(),
        amountUsd,
      } satisfies OnchainTransferMatch
    })
    .filter((e): e is OnchainTransferMatch => !!e)
}

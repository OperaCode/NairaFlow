const DEFAULT_USD_NGN_RATE = 1500
const CACHE_TTL_MS = 5 * 60 * 1000
const FX_TIMEOUT_MS = 5000

export interface FxQuote {
  base: 'USD'
  target: 'NGN'
  rate: number
  provider: 'env' | 'open-er-api' | 'fallback'
  asOf: number
  stale: boolean
}

let cachedQuote: FxQuote | null = null

function getEnvQuote(): FxQuote | null {
  const configuredRate = Number(process.env.NGN_PER_USD_RATE)
  if (!Number.isFinite(configuredRate) || configuredRate <= 0) {
    return null
  }

  return {
    base: 'USD',
    target: 'NGN',
    rate: configuredRate,
    provider: 'env',
    asOf: Date.now(),
    stale: false,
  }
}

function getFallbackQuote(): FxQuote {
  return {
    base: 'USD',
    target: 'NGN',
    rate: DEFAULT_USD_NGN_RATE,
    provider: 'fallback',
    asOf: Date.now(),
    stale: true,
  }
}

export async function getUsdNgnQuote(): Promise<FxQuote> {
  const envQuote = getEnvQuote()
  if (envQuote) {
    cachedQuote = envQuote
    return envQuote
  }

  if (cachedQuote && Date.now() - cachedQuote.asOf < CACHE_TTL_MS) {
    return cachedQuote
  }

  try {
    const response = await fetch('https://open.er-api.com/v6/latest/USD', {
      signal: AbortSignal.timeout(FX_TIMEOUT_MS),
      next: { revalidate: 300 },
    })

    if (!response.ok) {
      throw new Error(`FX provider returned ${response.status}`)
    }

    const data = await response.json()
    const rate = Number(data?.rates?.NGN)
    if (!Number.isFinite(rate) || rate <= 0) {
      throw new Error('FX provider returned invalid NGN rate')
    }

    cachedQuote = {
      base: 'USD',
      target: 'NGN',
      rate,
      provider: 'open-er-api',
      asOf: Date.now(),
      stale: false,
    }

    return cachedQuote
  } catch {
    cachedQuote = getFallbackQuote()
    return cachedQuote
  }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title NairaFlowVault
 * @dev On-chain "Piggy Bank" for Monad Blitz. 
 * Users lock their savings here to protect against lifestyle inflation.
 * Only the NairaFlow backend can "collect" the savings, but only after user approval.
 */

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract NairaFlowVault {
    struct SavingsAccount {
        uint256 balance;
        uint256 lockUntil;
        uint256 totalSaved;
    }

    address public owner;
    IERC20 public immutable usdc;
    mapping(address => SavingsAccount) public accounts;
    
    event Saved(address indexed user, uint256 amount, uint256 lockUntil);
    event Withdrawn(address indexed user, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only NairaFlow backend can call this");
        _;
    }

    constructor(address _usdc) {
        owner = msg.sender;
        usdc = IERC20(_usdc);
    }

    /**
     * @dev Backend collects the savings portion from the user's wallet.
     * User MUST have called usdc.approve(vaultAddress, amount) first.
     * @param user The user address to collect from.
     * @param amount The amount of USDC to save.
     */
    function collectSavings(address user, uint256 amount) external onlyOwner {
        require(amount > 0, "Cannot save zero");
        require(usdc.transferFrom(user, address(this), amount), "Transfer failed - check approval");

        SavingsAccount storage account = accounts[user];
        account.balance += amount;
        account.totalSaved += amount;
        
        // Lock savings for 30 days after every deposit to enforce discipline
        account.lockUntil = block.timestamp + 30 days;

        emit Saved(user, amount, account.lockUntil);
    }

    /**
     * @dev User withdraws their own funds only after the lock has expired.
     */
    function withdraw(uint256 amount) external {
        SavingsAccount storage account = accounts[msg.sender];
        require(block.timestamp >= account.lockUntil, "Vault is still locked! Savings discipline is key.");
        require(account.balance >= amount, "Insufficient vault balance");

        account.balance -= amount;
        require(usdc.transfer(msg.sender, amount), "Transfer failed");

        emit Withdrawn(msg.sender, amount);
    }

    function getAccount(address user) external view returns (uint256 balance, uint256 lockUntil, uint256 totalSaved) {
        SavingsAccount storage account = accounts[user];
        return (account.balance, account.lockUntil, account.totalSaved);
    }

    /**
     * @dev Transfer ownership to a new backend address if needed.
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid address");
        owner = newOwner;
    }
}

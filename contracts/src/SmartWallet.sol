// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title SmartWallet
 * @dev Smart contract for NairaFlow: auto-saves stablecoins and manages fund splitting
 * Handles deposit, withdrawal, and automatic fund splitting for protected savings
 */

interface IERC20 {
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
}

contract SmartWallet {
    // State variables
    address public owner;
    IERC20 public usdcToken;

    // User balances
    mapping(address => uint256) public userSavings;
    mapping(address => uint256) public userSpendable;
    mapping(address => uint256) public savingsPercentage;
    mapping(address => bool) public flexModeActive;
    mapping(address => uint256) public flexModeCooldownUntil;

    // Events
    event Deposit(
        address indexed user,
        uint256 amount,
        uint256 savingsAmount,
        uint256 spendableAmount,
        uint256 savingsPercent
    );
    
    event Withdrawal(
        address indexed user,
        uint256 amount,
        bool isSavings
    );
    
    event SavingsPercentageUpdated(
        address indexed user,
        uint256 newPercentage
    );
    
    event FlexModeActivated(
        address indexed user,
        uint256 cooldownUntil
    );

    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    constructor(address _usdc) {
        owner = msg.sender;
        usdcToken = IERC20(_usdc);
    }

    /**
     * @dev Initialize user with default savings percentage
     */
    function initializeUser(address user, uint256 _savingsPercentage) external {
        if (savingsPercentage[user] == 0) {
            savingsPercentage[user] = _savingsPercentage > 0 ? _savingsPercentage : 10; // Default 10%
        }
    }

    /**
     * @dev Smart fund splitting: splits incoming USDC into savings and spendable
     * @param user User address
     * @param amount Amount in USDC being received
     */
    function splitFunds(address user, uint256 amount) external {
        require(usdcToken.transferFrom(msg.sender, address(this), amount), "USDC transfer failed");

        // Ensure user has been initialized
        if (savingsPercentage[user] == 0) {
            savingsPercentage[user] = 10;
        }

        uint256 savings = amount;
        uint256 spendable = 0;
        bool flexUsed = false;

        // Check flex mode and cooldown
        if (flexModeActive[user] && flexModeCooldownUntil[user] == 0) {
            // Flex mode is active and not on cooldown - skip savings
            savings = 0;
            spendable = amount;
            flexUsed = true;
            
            // Set cooldown for 7 days
            flexModeCooldownUntil[user] = block.timestamp + 7 days;
            flexModeActive[user] = false;
        } else {
            // Normal split
            uint256 savingsPercent = savingsPercentage[user];
            if (savingsPercent < 10) savingsPercent = 10; // Minimum 10%
            
            savings = (amount * savingsPercent) / 100;
            spendable = amount - savings;
        }

        // Clear expired cooldown
        if (flexModeCooldownUntil[user] > 0 && flexModeCooldownUntil[user] < block.timestamp) {
            flexModeCooldownUntil[user] = 0;
        }

        // Update balances
        userSavings[user] += savings;
        userSpendable[user] += spendable;

        // Emit deposit event
        emit Deposit(
            user,
            amount,
            savings,
            spendable,
            savingsPercentage[user]
        );
    }

    /**
     * @dev Withdraw savings from vault
     * @param amount Amount to withdraw
     */
    function withdrawSavings(address user, uint256 amount) external {
        require(msg.sender == user, "Only user can withdraw");
        require(userSavings[user] >= amount, "Insufficient savings balance");
        
        userSavings[user] -= amount;
        require(usdcToken.transfer(user, amount), "USDC transfer failed");
        
        emit Withdrawal(user, amount, true);
    }

    /**
     * @dev Withdraw spendable balance
     * @param amount Amount to withdraw
     */
    function withdrawSpendable(address user, uint256 amount) external {
        require(msg.sender == user, "Only user can withdraw");
        require(userSpendable[user] >= amount, "Insufficient spendable balance");
        
        userSpendable[user] -= amount;
        require(usdcToken.transfer(user, amount), "USDC transfer failed");
        
        emit Withdrawal(user, amount, false);
    }

    /**
     * @dev Update savings percentage for a user
     * @param percentage New savings percentage (0-100)
     */
    function updateSavingsPercentage(address user, uint256 percentage) external {
        require(percentage >= 0 && percentage <= 100, "Invalid percentage");
        require(percentage >= 10, "Minimum savings is 10%");
        
        savingsPercentage[user] = percentage;
        
        emit SavingsPercentageUpdated(user, percentage);
    }

    /**
     * @dev Activate flex mode for next transfer
     */
    function activateFlexMode(address user) external {
        // Check if on cooldown
        if (flexModeCooldownUntil[user] > 0 && flexModeCooldownUntil[user] > block.timestamp) {
            revert("Flex mode is on cooldown");
        }

        flexModeActive[user] = true;
        
        emit FlexModeActivated(user, block.timestamp + 7 days);
    }

    /**
     * @dev Get user balances
     */
    function getUserBalances(address user) external view returns (
        uint256 savings,
        uint256 spendable,
        uint256 savings_percentage,
        bool flex_active,
        uint256 flex_cooldown
    ) {
        return (
            userSavings[user],
            userSpendable[user],
            savingsPercentage[user] > 0 ? savingsPercentage[user] : 10,
            flexModeActive[user],
            flexModeCooldownUntil[user]
        );
    }

    /**
     * @dev Check if flex mode is available
     */
    function isFlexModeAvailable(address user) external view returns (bool) {
        if (!flexModeActive[user]) return false;
        if (flexModeCooldownUntil[user] == 0) return true;
        return flexModeCooldownUntil[user] <= block.timestamp;
    }

    /**
     * @dev Emergency: only owner can withdraw contract USDC balance
     */
    function emergencyWithdraw(uint256 amount) external onlyOwner {
        require(amount <= usdcToken.balanceOf(address(this)), "Insufficient contract balance");
        usdcToken.transfer(owner, amount);
    }
}

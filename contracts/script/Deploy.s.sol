// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/MockUSDC.sol";
import "../src/SmartWallet.sol";

contract DeployScript is Script {
    MockUSDC public mockUSDC;
    SmartWallet public smartWallet;

    function setUp() public {}

    function run() public {
        // Start broadcasting transactions
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // Deploy MockUSDC first
        mockUSDC = new MockUSDC();
        console.log("MockUSDC deployed at:", address(mockUSDC));

        // Deploy SmartWallet with MockUSDC address
        smartWallet = new SmartWallet(address(mockUSDC));
        console.log("SmartWallet deployed at:", address(smartWallet));

        // Initialize some test balances
        mockUSDC.mint(msg.sender, 10000 * 10**6); // Mint 10,000 USDC

        vm.stopBroadcast();

        // Log deployment info
        console.log("========== DEPLOYMENT COMPLETE ==========");
        console.log("Network: Monad Testnet");
        console.log("MockUSDC Address:", address(mockUSDC));
        console.log("SmartWallet Address:", address(smartWallet));
        console.log("Deployer:", msg.sender);
        console.log("==========================================");
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockUSDC
 * @dev Mock USDC token for testing purposes
 */
contract MockUSDC is ERC20 {
    constructor() ERC20("Mock USDC", "mUSDC") {
        _mint(msg.sender, 1000000 * 10**18); // Mint 1M tokens to deployer
    }

    /**
     * @dev Mint tokens to any address (for testing)
     */
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    /**
     * @dev Decimals override - USDC uses 6 decimals
     */
    function decimals() public pure override returns (uint8) {
        return 6;
    }
}


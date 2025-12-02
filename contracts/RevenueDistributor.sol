// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title RevenueDistributor
 * @dev Automated revenue sharing for agent creators and stakers
 */
contract RevenueDistributor is Ownable, ReentrancyGuard {
    IERC20 public usdc;

    struct RevenueShare {
        uint256 creatorShare; // Basis points (e.g., 7000 = 70%)
        uint256 stakersShare; // Basis points
        uint256 protocolFee; // Basis points
    }

    RevenueShare public defaultShares = RevenueShare({
        creatorShare: 7000, // 70%
        stakersShare: 2000, // 20%
        protocolFee: 1000 // 10%
    });

    mapping(address => uint256) public pendingCreatorRevenue;
    mapping(address => uint256) public pendingStakerRevenue;
    mapping(address => mapping(address => uint256)) public stakerShares; // agent => staker => share

    event RevenueDistributed(
        address indexed agent,
        uint256 totalRevenue,
        uint256 creatorAmount,
        uint256 stakersAmount,
        uint256 protocolAmount
    );

    event RevenueClaimed(
        address indexed claimer,
        uint256 amount,
        bool isCreator
    );

    constructor(address _usdc) Ownable(msg.sender) {
        usdc = IERC20(_usdc);
    }

    /**
     * @dev Distribute revenue from agent transaction
     */
    function distributeRevenue(
        address _agentCreator,
        uint256 _totalRevenue
    ) external onlyOwner nonReentrant {
        require(_totalRevenue > 0, "Invalid revenue amount");

        uint256 creatorAmount = (_totalRevenue * defaultShares.creatorShare) / 10000;
        uint256 stakersAmount = (_totalRevenue * defaultShares.stakersShare) / 10000;
        uint256 protocolAmount = _totalRevenue - creatorAmount - stakersAmount;

        pendingCreatorRevenue[_agentCreator] += creatorAmount;
        pendingStakerRevenue[_agentCreator] += stakersAmount;

        // Protocol fee goes to contract owner
        usdc.transfer(owner(), protocolAmount);

        emit RevenueDistributed(
            _agentCreator,
            _totalRevenue,
            creatorAmount,
            stakersAmount,
            protocolAmount
        );
    }

    /**
     * @dev Claim pending creator revenue
     */
    function claimCreatorRevenue() external nonReentrant {
        uint256 pending = pendingCreatorRevenue[msg.sender];
        require(pending > 0, "No pending revenue");

        pendingCreatorRevenue[msg.sender] = 0;

        usdc.transfer(msg.sender, pending);

        emit RevenueClaimed(msg.sender, pending, true);
    }

    /**
     * @dev Update revenue share percentages
     */
    function updateRevenueShares(
        uint256 _creatorShare,
        uint256 _stakersShare,
        uint256 _protocolFee
    ) external onlyOwner {
        require(_creatorShare + _stakersShare + _protocolFee == 10000, "Shares must equal 100%");

        defaultShares = RevenueShare({
            creatorShare: _creatorShare,
            stakersShare: _stakersShare,
            protocolFee: _protocolFee
        });
    }
}


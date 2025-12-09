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
        require(_usdc != address(0), "Invalid USDC address");
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
        require(_agentCreator != address(0), "Invalid creator address");
        
        // Check contract has enough balance
        uint256 contractBalance = usdc.balanceOf(address(this));
        require(contractBalance >= _totalRevenue, "Insufficient contract balance");

        uint256 creatorAmount = (_totalRevenue * defaultShares.creatorShare) / 10000;
        uint256 stakersAmount = (_totalRevenue * defaultShares.stakersShare) / 10000;
        uint256 protocolAmount = _totalRevenue - creatorAmount - stakersAmount;

        // Ensure amounts add up correctly (handle rounding)
        require(
            creatorAmount + stakersAmount + protocolAmount == _totalRevenue,
            "Distribution mismatch"
        );

        pendingCreatorRevenue[_agentCreator] += creatorAmount;
        pendingStakerRevenue[_agentCreator] += stakersAmount;

        // Protocol fee goes to contract owner
        bool success = usdc.transfer(owner(), protocolAmount);
        require(success, "Protocol fee transfer failed");

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

        // Check contract has enough balance
        uint256 contractBalance = usdc.balanceOf(address(this));
        require(contractBalance >= pending, "Insufficient contract balance");

        pendingCreatorRevenue[msg.sender] = 0;

        bool success = usdc.transfer(msg.sender, pending);
        require(success, "Transfer failed");

        emit RevenueClaimed(msg.sender, pending, true);
    }

    /**
     * @dev Claim pending staker revenue for a specific agent
     */
    function claimStakerRevenue(address _agent) external nonReentrant {
        uint256 pending = pendingStakerRevenue[_agent];
        require(pending > 0, "No pending staker revenue");

        // Check contract has enough balance
        uint256 contractBalance = usdc.balanceOf(address(this));
        require(contractBalance >= pending, "Insufficient contract balance");

        pendingStakerRevenue[_agent] = 0;

        bool success = usdc.transfer(msg.sender, pending);
        require(success, "Transfer failed");

        emit RevenueClaimed(msg.sender, pending, false);
    }

    /**
     * @dev Get total pending revenue for a creator
     */
    function getPendingCreatorRevenue(address _creator) external view returns (uint256) {
        return pendingCreatorRevenue[_creator];
    }

    /**
     * @dev Get total pending staker revenue for an agent
     */
    function getPendingStakerRevenue(address _agent) external view returns (uint256) {
        return pendingStakerRevenue[_agent];
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


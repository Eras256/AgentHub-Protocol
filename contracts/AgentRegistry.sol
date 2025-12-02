// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title AgentRegistry
 * @dev ERC-8004 compliant registry for AI agents with identity and reputation
 */
contract AgentRegistry is Ownable, ReentrancyGuard {
    struct AgentProfile {
        bytes32 agentId;
        address owner;
        string metadataIPFS; // Off-chain data pointer
        uint256 trustScore; // 0-10000 (basis points)
        uint256 totalTransactions;
        uint256 successfulTransactions;
        uint256 stakedAmount;
        bool isActive;
        uint256 createdAt;
    }

    struct ReputationUpdate {
        uint256 timestamp;
        bool successful;
        uint256 transactionValue;
        string serviceType;
    }

    mapping(address => AgentProfile) public agents;
    mapping(address => ReputationUpdate[]) public reputationHistory;
    mapping(bytes32 => address) public agentIdToAddress;

    uint256 public totalAgents;
    uint256 public constant MIN_STAKE = 1 ether; // 1 AVAX minimum
    uint256 public constant REPUTATION_DECAY_PERIOD = 30 days;

    event AgentRegistered(
        address indexed agentAddress,
        bytes32 indexed agentId,
        string metadataIPFS,
        uint256 timestamp
    );

    event ReputationUpdated(
        address indexed agentAddress,
        uint256 newTrustScore,
        bool successful,
        uint256 transactionValue
    );

    event AgentStaked(
        address indexed agentAddress,
        uint256 amount,
        uint256 newTotalStake
    );

    event AgentUnstaked(
        address indexed agentAddress,
        uint256 amount,
        uint256 remainingStake
    );

    /**
     * @dev Register new AI agent with staking requirement
     */
    function registerAgent(
        bytes32 _agentId,
        string calldata _metadataIPFS
    ) external payable nonReentrant {
        require(msg.value >= MIN_STAKE, "Insufficient stake");
        require(agents[msg.sender].owner == address(0), "Agent already registered");
        require(agentIdToAddress[_agentId] == address(0), "Agent ID taken");

        agents[msg.sender] = AgentProfile({
            agentId: _agentId,
            owner: msg.sender,
            metadataIPFS: _metadataIPFS,
            trustScore: 5000, // Start at 50%
            totalTransactions: 0,
            successfulTransactions: 0,
            stakedAmount: msg.value,
            isActive: true,
            createdAt: block.timestamp
        });

        agentIdToAddress[_agentId] = msg.sender;
        totalAgents++;

        emit AgentRegistered(msg.sender, _agentId, _metadataIPFS, block.timestamp);
    }

    /**
     * @dev Update agent reputation based on transaction outcome
     */
    function updateReputation(
        address _agent,
        bool _successful,
        uint256 _transactionValue,
        string calldata _serviceType
    ) external onlyOwner {
        AgentProfile storage agent = agents[_agent];
        require(agent.isActive, "Agent not active");

        agent.totalTransactions++;
        if (_successful) {
            agent.successfulTransactions++;
        }

        // Calculate new trust score using exponential moving average
        uint256 successRate = (agent.successfulTransactions * 10000) / agent.totalTransactions;
        uint256 decayFactor = _calculateDecayFactor(agent.createdAt);
        agent.trustScore = (successRate * decayFactor) / 10000;

        // Store reputation history
        reputationHistory[_agent].push(ReputationUpdate({
            timestamp: block.timestamp,
            successful: _successful,
            transactionValue: _transactionValue,
            serviceType: _serviceType
        }));

        emit ReputationUpdated(_agent, agent.trustScore, _successful, _transactionValue);
    }

    /**
     * @dev Add stake to existing agent
     */
    function addStake() external payable nonReentrant {
        AgentProfile storage agent = agents[msg.sender];
        require(agent.isActive, "Agent not registered");
        require(msg.value > 0, "Must stake positive amount");

        agent.stakedAmount += msg.value;

        emit AgentStaked(msg.sender, msg.value, agent.stakedAmount);
    }

    /**
     * @dev Withdraw stake (partial or full)
     */
    function withdrawStake(uint256 _amount) external nonReentrant {
        AgentProfile storage agent = agents[msg.sender];
        require(agent.isActive, "Agent not registered");
        require(_amount <= agent.stakedAmount, "Insufficient stake");
        require(agent.stakedAmount - _amount >= MIN_STAKE, "Must maintain minimum stake");

        agent.stakedAmount -= _amount;

        (bool success, ) = payable(msg.sender).call{value: _amount}("");
        require(success, "Transfer failed");

        emit AgentUnstaked(msg.sender, _amount, agent.stakedAmount);
    }

    /**
     * @dev Calculate reputation decay factor based on agent age
     */
    function _calculateDecayFactor(uint256 _createdAt) internal view returns (uint256) {
        uint256 age = block.timestamp - _createdAt;
        if (age >= REPUTATION_DECAY_PERIOD) {
            return 9000; // 90% weight for aged agents
        }
        return 10000 - ((age * 1000) / REPUTATION_DECAY_PERIOD);
    }

    /**
     * @dev Get agent profile
     */
    function getAgent(address _agent) external view returns (AgentProfile memory) {
        return agents[_agent];
    }

    /**
     * @dev Get agent reputation history
     */
    function getReputationHistory(address _agent) external view returns (ReputationUpdate[] memory) {
        return reputationHistory[_agent];
    }
}


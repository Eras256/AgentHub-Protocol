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
    constructor(uint256 _minStake) Ownable(msg.sender) {
        require(_minStake > 0, "Min stake must be greater than 0");
        minStake = _minStake;
    }

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
        bytes32 kitePoAIHash; // Stores the latest AI decision proof (Kite PoAI)
    }

    struct ReputationUpdate {
        uint256 timestamp;
        bool successful;
        uint256 transactionValue;
        string serviceType;
    }

    mapping(bytes32 => AgentProfile) public agents; // Changed: agentId => AgentProfile
    mapping(bytes32 => ReputationUpdate[]) public reputationHistory; // Changed: agentId => ReputationUpdate[]
    mapping(bytes32 => address) public agentIdToAddress; // agentId => owner address
    mapping(address => bytes32[]) public ownerAgents; // owner => array of agentIds

    uint256 public totalAgents;
    uint256 public minStake; // Configurable minimum stake (set in constructor, can be updated by owner)
    uint256 public constant REPUTATION_DECAY_PERIOD = 30 days;
    
    event MinStakeUpdated(uint256 oldMinStake, uint256 newMinStake);

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

    event KitePoAIRecorded(
        address indexed agentAddress,
        bytes32 indexed kiteProofHash,
        uint256 timestamp
    );

    /**
     * @dev Register new AI agent with staking requirement
     * @notice Now allows multiple agents per address
     */
    function registerAgent(
        bytes32 _agentId,
        string calldata _metadataIPFS
    ) external payable nonReentrant {
        require(msg.value >= minStake, "Insufficient stake");
        require(agents[_agentId].owner == address(0), "Agent ID already registered");
        require(agentIdToAddress[_agentId] == address(0), "Agent ID taken");
        require(_agentId != bytes32(0), "Invalid agent ID");
        require(bytes(_metadataIPFS).length > 0, "Metadata required");

        agents[_agentId] = AgentProfile({
            agentId: _agentId,
            owner: msg.sender,
            metadataIPFS: _metadataIPFS,
            trustScore: 5000, // Start at 50%
            totalTransactions: 0,
            successfulTransactions: 0,
            stakedAmount: msg.value,
            isActive: true,
            createdAt: block.timestamp,
            kitePoAIHash: bytes32(0) // Initialize as empty
        });

        agentIdToAddress[_agentId] = msg.sender;
        ownerAgents[msg.sender].push(_agentId);
        totalAgents++;

        emit AgentRegistered(msg.sender, _agentId, _metadataIPFS, block.timestamp);
    }

    /**
     * @dev Update agent reputation based on transaction outcome
     * @param _agentId - The agent ID to update reputation for
     */
    function updateReputation(
        bytes32 _agentId,
        bool _successful,
        uint256 _transactionValue,
        string calldata _serviceType
    ) external onlyOwner {
        AgentProfile storage agent = agents[_agentId];
        require(agent.isActive, "Agent not active");
        require(agent.owner != address(0), "Agent not found");

        agent.totalTransactions++;
        if (_successful) {
            agent.successfulTransactions++;
        }

        // Calculate new trust score using exponential moving average
        // Prevent division by zero
        require(agent.totalTransactions > 0, "No transactions");
        uint256 successRate = (agent.successfulTransactions * 10000) / agent.totalTransactions;
        uint256 decayFactor = _calculateDecayFactor(agent.createdAt);
        agent.trustScore = (successRate * decayFactor) / 10000;

        // Ensure trust score doesn't exceed 10000 (100%)
        if (agent.trustScore > 10000) {
            agent.trustScore = 10000;
        }

        // Store reputation history
        reputationHistory[_agentId].push(ReputationUpdate({
            timestamp: block.timestamp,
            successful: _successful,
            transactionValue: _transactionValue,
            serviceType: _serviceType
        }));

        emit ReputationUpdated(agent.owner, agent.trustScore, _successful, _transactionValue);
    }

    /**
     * @dev Add stake to existing agent
     * @param _agentId - The agent ID to add stake to
     */
    function addStake(bytes32 _agentId) external payable nonReentrant {
        AgentProfile storage agent = agents[_agentId];
        require(agent.owner == msg.sender, "Not agent owner");
        require(agent.isActive, "Agent not registered");
        require(msg.value > 0, "Must stake positive amount");

        agent.stakedAmount += msg.value;

        emit AgentStaked(agent.owner, msg.value, agent.stakedAmount);
    }

    /**
     * @dev Withdraw stake (partial or full)
     * @param _agentId - The agent ID to withdraw stake from
     * @param _amount - Amount to withdraw
     */
    function withdrawStake(bytes32 _agentId, uint256 _amount) external nonReentrant {
        AgentProfile storage agent = agents[_agentId];
        require(agent.owner == msg.sender, "Not agent owner");
        require(agent.isActive, "Agent not registered");
        require(_amount <= agent.stakedAmount, "Insufficient stake");
        require(agent.stakedAmount - _amount >= minStake, "Must maintain minimum stake");

        agent.stakedAmount -= _amount;

        (bool success, ) = payable(msg.sender).call{value: _amount}("");
        require(success, "Transfer failed");

        emit AgentUnstaked(agent.owner, _amount, agent.stakedAmount);
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
     * @dev Get agent profile by agent ID
     */
    function getAgent(bytes32 _agentId) external view returns (AgentProfile memory) {
        return agents[_agentId];
    }

    /**
     * @dev Get agent profile by address (returns first agent if multiple exist)
     * @notice Deprecated: Use getAgentByOwnerAndIndex or getAllAgentsByOwner instead
     */
    function getAgentByAddress(address _owner) external view returns (AgentProfile memory) {
        require(ownerAgents[_owner].length > 0, "No agents found");
        return agents[ownerAgents[_owner][0]];
    }

    /**
     * @dev Get all agent IDs owned by an address
     */
    function getAllAgentsByOwner(address _owner) external view returns (bytes32[] memory) {
        return ownerAgents[_owner];
    }

    /**
     * @dev Get agent by owner and index
     */
    function getAgentByOwnerAndIndex(address _owner, uint256 _index) external view returns (AgentProfile memory) {
        require(_index < ownerAgents[_owner].length, "Index out of bounds");
        return agents[ownerAgents[_owner][_index]];
    }

    /**
     * @dev Get agent reputation history
     */
    function getReputationHistory(bytes32 _agentId) external view returns (ReputationUpdate[] memory) {
        return reputationHistory[_agentId];
    }

    /**
     * @dev Record Kite PoAI proof for an agent
     * @param _agentId - The agent ID to record proof for
     * @param _kiteProofHash - Hash of the PoAI proof (generated off-chain)
     */
    function recordKiteProof(bytes32 _agentId, bytes32 _kiteProofHash) external {
        AgentProfile storage agent = agents[_agentId];
        require(agent.owner == msg.sender, "Not agent owner");
        require(agent.isActive, "Agent not registered");
        require(_kiteProofHash != bytes32(0), "Invalid proof hash");

        agent.kitePoAIHash = _kiteProofHash;

        emit KitePoAIRecorded(agent.owner, _kiteProofHash, block.timestamp);
    }

    /**
     * @dev Register agent with optional initial PoAI hash
     * @param _agentId - Unique agent identifier
     * @param _metadataIPFS - IPFS hash of agent metadata
     * @param _kitePoAIHash - Optional initial PoAI hash (can be bytes32(0))
     * @notice Now allows multiple agents per address
     */
    function registerAgentWithPoAI(
        bytes32 _agentId,
        string calldata _metadataIPFS,
        bytes32 _kitePoAIHash
    ) external payable nonReentrant {
        require(msg.value >= minStake, "Insufficient stake");
        require(agents[_agentId].owner == address(0), "Agent ID already registered");
        require(agentIdToAddress[_agentId] == address(0), "Agent ID taken");
        require(_agentId != bytes32(0), "Invalid agent ID");
        require(bytes(_metadataIPFS).length > 0, "Metadata required");

        agents[_agentId] = AgentProfile({
            agentId: _agentId,
            owner: msg.sender,
            metadataIPFS: _metadataIPFS,
            trustScore: 5000, // Start at 50%
            totalTransactions: 0,
            successfulTransactions: 0,
            stakedAmount: msg.value,
            isActive: true,
            createdAt: block.timestamp,
            kitePoAIHash: _kitePoAIHash
        });

        agentIdToAddress[_agentId] = msg.sender;
        ownerAgents[msg.sender].push(_agentId);
        totalAgents++;

        emit AgentRegistered(msg.sender, _agentId, _metadataIPFS, block.timestamp);

        // Emit PoAI event if provided
        if (_kitePoAIHash != bytes32(0)) {
            emit KitePoAIRecorded(msg.sender, _kitePoAIHash, block.timestamp);
        }
    }

    /**
     * @dev Deactivate an agent (only owner or agent owner)
     * @param _agentId - The agent ID to deactivate
     */
    function deactivateAgent(bytes32 _agentId) external {
        AgentProfile storage agent = agents[_agentId];
        require(
            msg.sender == owner() || msg.sender == agent.owner,
            "Not authorized"
        );
        require(agent.isActive, "Agent not active");
        agent.isActive = false;
    }

    /**
     * @dev Update minimum stake requirement (only owner)
     * @param _newMinStake New minimum stake amount
     */
    function setMinStake(uint256 _newMinStake) external onlyOwner {
        require(_newMinStake > 0, "Min stake must be greater than 0");
        uint256 oldMinStake = minStake;
        minStake = _newMinStake;
        emit MinStakeUpdated(oldMinStake, _newMinStake);
    }

    /**
     * @dev Reactivate a deactivated agent
     * @param _agentId - The agent ID to reactivate
     */
    function reactivateAgent(bytes32 _agentId) external {
        AgentProfile storage agent = agents[_agentId];
        require(agent.owner == msg.sender, "Not agent owner");
        require(agent.owner != address(0), "Agent not registered");
        require(!agent.isActive, "Agent already active");
        require(agent.stakedAmount >= minStake, "Insufficient stake");
        agent.isActive = true;
    }

    /**
     * @dev Get agent by ID (alias for getAgent)
     */
    function getAgentById(bytes32 _agentId) external view returns (AgentProfile memory) {
        return agents[_agentId];
    }

    /**
     * @dev Check if agent ID is registered
     */
    function isAgentRegistered(bytes32 _agentId) external view returns (bool) {
        return agents[_agentId].owner != address(0);
    }

    /**
     * @dev Get count of agents owned by an address
     */
    function getAgentCountByOwner(address _owner) external view returns (uint256) {
        return ownerAgents[_owner].length;
    }
}


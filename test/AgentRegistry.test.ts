import { expect } from "chai";
import { ethers } from "hardhat";
import { AgentRegistry } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("AgentRegistry", function () {
  let agentRegistry: AgentRegistry;
  let owner: SignerWithAddress;
  let agent1: SignerWithAddress;
  let agent2: SignerWithAddress;

  const MIN_STAKE = ethers.parseEther("1");
  const AGENT_ID_1 = ethers.id("agent-001");
  const METADATA_IPFS_1 = "ipfs://QmTest123...";

  beforeEach(async function () {
    [owner, agent1, agent2] = await ethers.getSigners();

    const AgentRegistryFactory = await ethers.getContractFactory("AgentRegistry");
    agentRegistry = await AgentRegistryFactory.deploy();
    await agentRegistry.waitForDeployment();
  });

  describe("Agent Registration", function () {
    it("Should register new agent with minimum stake", async function () {
      await expect(
        agentRegistry.connect(agent1).registerAgent(AGENT_ID_1, METADATA_IPFS_1, {
          value: MIN_STAKE,
        })
      )
        .to.emit(agentRegistry, "AgentRegistered")
        .withArgs(agent1.address, AGENT_ID_1, METADATA_IPFS_1, await ethers.provider.getBlock('latest').then(b => b!.timestamp + 1));

      const profile = await agentRegistry.getAgent(agent1.address);
      expect(profile.owner).to.equal(agent1.address);
      expect(profile.agentId).to.equal(AGENT_ID_1);
      expect(profile.trustScore).to.equal(5000);
      expect(profile.isActive).to.be.true;
    });

    it("Should fail registration with insufficient stake", async function () {
      await expect(
        agentRegistry.connect(agent1).registerAgent(AGENT_ID_1, METADATA_IPFS_1, {
          value: ethers.parseEther("0.5"),
        })
      ).to.be.revertedWith("Insufficient stake");
    });

    it("Should fail duplicate registration", async function () {
      await agentRegistry.connect(agent1).registerAgent(AGENT_ID_1, METADATA_IPFS_1, {
        value: MIN_STAKE,
      });

      await expect(
        agentRegistry.connect(agent1).registerAgent(AGENT_ID_1, METADATA_IPFS_1, {
          value: MIN_STAKE,
        })
      ).to.be.revertedWith("Agent already registered");
    });
  });

  describe("Reputation System", function () {
    beforeEach(async function () {
      await agentRegistry.connect(agent1).registerAgent(AGENT_ID_1, METADATA_IPFS_1, {
        value: MIN_STAKE,
      });
    });

    it("Should update reputation on successful transaction", async function () {
      await agentRegistry.updateReputation(
        agent1.address,
        true,
        ethers.parseUnits("10", 6),
        "api-call"
      );

      const profile = await agentRegistry.getAgent(agent1.address);
      expect(profile.totalTransactions).to.equal(1);
      expect(profile.successfulTransactions).to.equal(1);
    });

    it("Should calculate trust score correctly", async function () {
      // 3 successful, 1 failed
      await agentRegistry.updateReputation(agent1.address, true, ethers.parseUnits("10", 6), "api-call");
      await agentRegistry.updateReputation(agent1.address, true, ethers.parseUnits("10", 6), "api-call");
      await agentRegistry.updateReputation(agent1.address, true, ethers.parseUnits("10", 6), "api-call");
      await agentRegistry.updateReputation(agent1.address, false, ethers.parseUnits("10", 6), "api-call");

      const profile = await agentRegistry.getAgent(agent1.address);
      // 75% success rate = 7500 trust score (with decay)
      expect(profile.trustScore).to.be.closeTo(7500, 500);
    });
  });

  describe("Staking", function () {
    beforeEach(async function () {
      await agentRegistry.connect(agent1).registerAgent(AGENT_ID_1, METADATA_IPFS_1, {
        value: MIN_STAKE,
      });
    });

    it("Should allow adding stake", async function () {
      const additionalStake = ethers.parseEther("2");
      await agentRegistry.connect(agent1).addStake({ value: additionalStake });

      const profile = await agentRegistry.getAgent(agent1.address);
      expect(profile.stakedAmount).to.equal(MIN_STAKE + additionalStake);
    });

    it("Should allow partial withdrawal", async function () {
      const additionalStake = ethers.parseEther("2");
      await agentRegistry.connect(agent1).addStake({ value: additionalStake });

      await agentRegistry.connect(agent1).withdrawStake(ethers.parseEther("1"));

      const profile = await agentRegistry.getAgent(agent1.address);
      expect(profile.stakedAmount).to.equal(ethers.parseEther("2"));
    });

    it("Should prevent withdrawal below minimum stake", async function () {
      await expect(
        agentRegistry.connect(agent1).withdrawStake(ethers.parseEther("0.5"))
      ).to.be.revertedWith("Must maintain minimum stake");
    });
  });
});


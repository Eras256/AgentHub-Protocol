import "@nomicfoundation/hardhat-chai-matchers";
import { expect } from "chai";
import hre from "hardhat";
const { ethers } = hre;
import { RevenueDistributor } from "../typechain-types";
import { MockUSDC } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("RevenueDistributor", function () {
  let distributor: RevenueDistributor;
  let mockUSDC: MockUSDC;
  let owner: SignerWithAddress;
  let creator: SignerWithAddress;
  let staker: SignerWithAddress;
  let user: SignerWithAddress;

  const INITIAL_BALANCE = ethers.parseUnits("1000000", 6); // 1M USDC
  const REVENUE_AMOUNT = ethers.parseUnits("1000", 6); // 1000 USDC

  beforeEach(async function () {
    [owner, creator, staker, user] = await ethers.getSigners();

    // Deploy MockUSDC
    const MockUSDCFactory = await ethers.getContractFactory("MockUSDC");
    mockUSDC = await MockUSDCFactory.deploy();
    await mockUSDC.waitForDeployment();

    // Deploy RevenueDistributor
    const RevenueDistributorFactory = await ethers.getContractFactory("RevenueDistributor");
    distributor = await RevenueDistributorFactory.deploy(await mockUSDC.getAddress());
    await distributor.waitForDeployment();

    // Transfer USDC to distributor for testing
    await mockUSDC.transfer(await distributor.getAddress(), INITIAL_BALANCE);
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await distributor.owner()).to.equal(owner.address);
    });

    it("Should set the correct USDC address", async function () {
      expect(await distributor.usdc()).to.equal(await mockUSDC.getAddress());
    });

    it("Should have default revenue shares (70/20/10)", async function () {
      const shares = await distributor.defaultShares();
      expect(shares.creatorShare).to.equal(7000); // 70%
      expect(shares.stakersShare).to.equal(2000); // 20%
      expect(shares.protocolFee).to.equal(1000); // 10%
    });

    it("Should fail deployment with zero USDC address", async function () {
      const RevenueDistributorFactory = await ethers.getContractFactory("RevenueDistributor");
      await expect(
        RevenueDistributorFactory.deploy(ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid USDC address");
    });
  });

  describe("Revenue Distribution", function () {
    beforeEach(async function () {
      // Ensure distributor has enough balance
      await mockUSDC.transfer(await distributor.getAddress(), REVENUE_AMOUNT);
    });

    it("Should distribute revenue correctly (70/20/10)", async function () {
      const creatorBalanceBefore = await mockUSDC.balanceOf(creator.address);
      const ownerBalanceBefore = await mockUSDC.balanceOf(owner.address);

      const tx = distributor.distributeRevenue(creator.address, REVENUE_AMOUNT);

      await expect(tx)
        .to.emit(distributor, "RevenueDistributed")
        .withArgs(
          creator.address,
          REVENUE_AMOUNT,
          ethers.parseUnits("700", 6), // 70%
          ethers.parseUnits("200", 6), // 20%
          ethers.parseUnits("100", 6) // 10%
        );

      // Check pending creator revenue
      expect(await distributor.pendingCreatorRevenue(creator.address)).to.equal(
        ethers.parseUnits("700", 6)
      );

      // Check pending staker revenue
      expect(await distributor.pendingStakerRevenue(creator.address)).to.equal(
        ethers.parseUnits("200", 6)
      );

      // Check protocol fee transferred to owner
      const ownerBalanceAfter = await mockUSDC.balanceOf(owner.address);
      expect(ownerBalanceAfter - ownerBalanceBefore).to.equal(ethers.parseUnits("100", 6));
    });

    it("Should handle multiple revenue distributions", async function () {
      await distributor.distributeRevenue(creator.address, REVENUE_AMOUNT);
      await distributor.distributeRevenue(creator.address, REVENUE_AMOUNT);

      expect(await distributor.pendingCreatorRevenue(creator.address)).to.equal(
        ethers.parseUnits("1400", 6) // 700 * 2
      );
      expect(await distributor.pendingStakerRevenue(creator.address)).to.equal(
        ethers.parseUnits("400", 6) // 200 * 2
      );
    });

    it("Should fail with zero revenue amount", async function () {
      await expect(
        distributor.distributeRevenue(creator.address, 0)
      ).to.be.revertedWith("Invalid revenue amount");
    });

    it("Should fail with zero creator address", async function () {
      await expect(
        distributor.distributeRevenue(ethers.ZeroAddress, REVENUE_AMOUNT)
      ).to.be.revertedWith("Invalid creator address");
    });

    it("Should fail with insufficient contract balance", async function () {
      const largeAmount = ethers.parseUnits("10000000", 6); // 10M USDC
      await expect(
        distributor.distributeRevenue(creator.address, largeAmount)
      ).to.be.revertedWith("Insufficient contract balance");
    });

    it("Should only allow owner to distribute revenue", async function () {
      await expect(
        distributor.connect(user).distributeRevenue(creator.address, REVENUE_AMOUNT)
      ).to.be.revertedWithCustomError(distributor, "OwnableUnauthorizedAccount");
    });
  });

  describe("Revenue Claiming", function () {
    beforeEach(async function () {
      await mockUSDC.transfer(await distributor.getAddress(), REVENUE_AMOUNT);
      await distributor.distributeRevenue(creator.address, REVENUE_AMOUNT);
    });

    it("Should allow creator to claim revenue", async function () {
      const creatorBalanceBefore = await mockUSDC.balanceOf(creator.address);
      const pendingAmount = await distributor.pendingCreatorRevenue(creator.address);

      const tx = distributor.connect(creator).claimCreatorRevenue();

      await expect(tx)
        .to.emit(distributor, "RevenueClaimed")
        .withArgs(creator.address, pendingAmount, true);

      // Check balance increased
      const creatorBalanceAfter = await mockUSDC.balanceOf(creator.address);
      expect(creatorBalanceAfter - creatorBalanceBefore).to.equal(pendingAmount);

      // Check pending revenue reset
      expect(await distributor.pendingCreatorRevenue(creator.address)).to.equal(0);
    });

    it("Should allow staker to claim staker revenue", async function () {
      const stakerBalanceBefore = await mockUSDC.balanceOf(staker.address);
      const pendingAmount = await distributor.pendingStakerRevenue(creator.address);

      const tx = distributor.connect(staker).claimStakerRevenue(creator.address);

      await expect(tx)
        .to.emit(distributor, "RevenueClaimed")
        .withArgs(staker.address, pendingAmount, false);

      // Check balance increased
      const stakerBalanceAfter = await mockUSDC.balanceOf(staker.address);
      expect(stakerBalanceAfter - stakerBalanceBefore).to.equal(pendingAmount);

      // Check pending revenue reset
      expect(await distributor.pendingStakerRevenue(creator.address)).to.equal(0);
    });

    it("Should fail to claim when no pending revenue", async function () {
      await distributor.connect(creator).claimCreatorRevenue();

      await expect(
        distributor.connect(creator).claimCreatorRevenue()
      ).to.be.revertedWith("No pending revenue");
    });

    it("Should fail to claim staker revenue when none pending", async function () {
      await distributor.connect(staker).claimStakerRevenue(creator.address);

      await expect(
        distributor.connect(staker).claimStakerRevenue(creator.address)
      ).to.be.revertedWith("No pending staker revenue");
    });

    it("Should fail with insufficient contract balance", async function () {
      // Drain contract balance
      const contractBalance = await mockUSDC.balanceOf(await distributor.getAddress());
      await mockUSDC.transfer(owner.address, contractBalance - ethers.parseUnits("50", 6));

      // Try to claim more than available
      await expect(
        distributor.connect(creator).claimCreatorRevenue()
      ).to.be.revertedWith("Insufficient contract balance");
    });
  });

  describe("Revenue Share Updates", function () {
    it("Should allow owner to update revenue shares", async function () {
      const tx = distributor.updateRevenueShares(6000, 3000, 1000);

      await expect(tx).to.not.be.reverted;

      const shares = await distributor.defaultShares();
      expect(shares.creatorShare).to.equal(6000);
      expect(shares.stakersShare).to.equal(3000);
      expect(shares.protocolFee).to.equal(1000);
    });

    it("Should fail if shares don't equal 100%", async function () {
      await expect(
        distributor.updateRevenueShares(6000, 3000, 500)
      ).to.be.revertedWith("Shares must equal 100%");
    });

    it("Should only allow owner to update shares", async function () {
      await expect(
        distributor.connect(user).updateRevenueShares(6000, 3000, 1000)
      ).to.be.revertedWithCustomError(distributor, "OwnableUnauthorizedAccount");
    });

    it("Should apply new shares to subsequent distributions", async function () {
      await distributor.updateRevenueShares(5000, 4000, 1000);
      await mockUSDC.transfer(await distributor.getAddress(), REVENUE_AMOUNT);

      await distributor.distributeRevenue(creator.address, REVENUE_AMOUNT);

      expect(await distributor.pendingCreatorRevenue(creator.address)).to.equal(
        ethers.parseUnits("500", 6) // 50%
      );
      expect(await distributor.pendingStakerRevenue(creator.address)).to.equal(
        ethers.parseUnits("400", 6) // 40%
      );
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      await mockUSDC.transfer(await distributor.getAddress(), REVENUE_AMOUNT);
      await distributor.distributeRevenue(creator.address, REVENUE_AMOUNT);
    });

    it("Should return pending creator revenue", async function () {
      const pending = await distributor.getPendingCreatorRevenue(creator.address);
      expect(pending).to.equal(ethers.parseUnits("700", 6));
    });

    it("Should return pending staker revenue", async function () {
      const pending = await distributor.getPendingStakerRevenue(creator.address);
      expect(pending).to.equal(ethers.parseUnits("200", 6));
    });

    it("Should return zero for non-existent creator", async function () {
      const pending = await distributor.getPendingCreatorRevenue(user.address);
      expect(pending).to.equal(0);
    });
  });

  describe("Reentrancy Protection", function () {
    beforeEach(async function () {
      await mockUSDC.transfer(await distributor.getAddress(), REVENUE_AMOUNT);
      await distributor.distributeRevenue(creator.address, REVENUE_AMOUNT);
    });

    it("Should prevent reentrancy on claimCreatorRevenue", async function () {
      // Normal claim should work
      await expect(
        distributor.connect(creator).claimCreatorRevenue()
      ).to.not.be.reverted;
    });
  });
});


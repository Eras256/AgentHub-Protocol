import { expect } from "chai";
import { ethers } from "hardhat";
import { RevenueDistributor } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("RevenueDistributor", function () {
  let distributor: RevenueDistributor;
  let owner: SignerWithAddress;
  let creator: SignerWithAddress;
  let usdc: any;

  const USDC_FUJI = "0x5425890298aed601595a70AB815c96711a31Bc65";

  beforeEach(async function () {
    [owner, creator] = await ethers.getSigners();

    const RevenueDistributorFactory = await ethers.getContractFactory(
      "RevenueDistributor"
    );
    distributor = await RevenueDistributorFactory.deploy(USDC_FUJI);
    await distributor.waitForDeployment();
  });

  describe("Revenue Distribution", function () {
    it("Should distribute revenue correctly", async function () {
      const totalRevenue = ethers.parseUnits("100", 18);
      // Mock USDC transfer needed
      // This is a placeholder test structure
    });

    it("Should update revenue shares", async function () {
      await distributor.updateRevenueShares(6000, 3000, 1000);
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
  });
});


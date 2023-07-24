import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers"
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs"
import { expect } from "chai"
import { ethers, upgrades } from "hardhat"

import type { VwTips } from "../typechain-types"

const { NODE_ENV, PRICE_FEED_SEPOLIA, PRICE_FEED_MAINNET } = process.env

const priceFeedAddress =
  NODE_ENV === "production" ? PRICE_FEED_MAINNET : PRICE_FEED_SEPOLIA

describe("VwTips", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployTipsFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners()

    const Tips = await ethers.getContractFactory("VwTips")
    const tips = (await upgrades.deployProxy(Tips, [
      priceFeedAddress,
    ])) as unknown as VwTips
    const DEFAULT_ADMIN_ROLE = await tips.DEFAULT_ADMIN_ROLE()

    return { tips, priceFeedAddress, owner, otherAccount, DEFAULT_ADMIN_ROLE }
  }

  describe("Deployment", function () {
    it("Should set the right feed address", async function () {
      const { tips, priceFeedAddress } = await loadFixture(deployTipsFixture)

      expect(await tips.getPriceFeedAddress()).to.equal(priceFeedAddress)
    })

    it("Should set the right fee rate", async function () {
      const { tips } = await loadFixture(deployTipsFixture)

      expect(ethers.toNumber(await tips.getFeeRate())).to.equal(10)
    })
  })

  describe("Transfer", function () {
    it("Should transfer tips to receiver", async function () {
      const { tips, owner, otherAccount, DEFAULT_ADMIN_ROLE } =
        await loadFixture(deployTipsFixture)

      const receiver = await otherAccount.getAddress()
    })
  })

  describe("Withdrawal", function () {
    it("Should revert if called from another account", async function () {
      const { tips, otherAccount, DEFAULT_ADMIN_ROLE } = await loadFixture(
        deployTipsFixture
      )

      await expect(
        tips.connect(otherAccount).withdraw(otherAccount.address)
      ).to.be.revertedWith(
        `AccessControl: account ${otherAccount.address.toLowerCase()} is missing role ${DEFAULT_ADMIN_ROLE}`
      )
    })

    // it("Should emit an event on withdrawal", async function () {
    //   const { tips, owner } = await loadFixture(deployTipsFixture)

    //   await expect(tips.connect().withdraw(owner.address))
    //     .to.emit(tips, "Withdrawal")
    //     .withArgs(anyValue, anyValue)
    // })
  })
})

import { ethers, upgrades } from "hardhat"
import path from "path"
import fs from "fs/promises"

const { NODE_ENV, PRICE_FEED_SEPOLIA, PRICE_FEED_MAINNET } = process.env

const priceFeedAddress =
  NODE_ENV === "production" ? PRICE_FEED_MAINNET : PRICE_FEED_SEPOLIA

async function main() {
  const Tips = await ethers.getContractFactory("VwTips")
  const tips = await upgrades.deployProxy(Tips, [priceFeedAddress])

  await tips.waitForDeployment()

  console.log("VWTips deployed to:", await tips.getAddress())

  // Pull the address and ABI out, since they will be used for interacting with the smart contract later.
  const data = {
    address: await tips.getAddress(),
    abi: JSON.parse(tips.interface.formatJson()),
  }

  await fs.writeFile(
    path.join(
      __dirname,
      "..",
      NODE_ENV === "production"
        ? "/abi/mainnet/Tips.json"
        : NODE_ENV === "testnet"
        ? "/abi/testnet/Tips.json"
        : "/abi/localhost/Tips.json"
    ),
    JSON.stringify(data)
  )
}

main().catch((error) => {
  console.error("error: ", error)
  process.exitCode = 1
})

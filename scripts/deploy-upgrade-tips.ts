import { ethers, upgrades } from "hardhat"
import path from "path"
import fs from "fs/promises"

import TipContract from "../abi/testnet/Tips.json"

const { NODE_ENV } = process.env

async function main() {
  const TipsV1 = await ethers.getContractFactory("VwTips")
  const tipsV1 = await upgrades.upgradeProxy(TipContract.address, TipsV1)

  await tipsV1.waitForDeployment()

  console.log("VWTips V1 deployed to:", await tipsV1.getAddress())

  // Pull the address and ABI out, since they will be used for interacting with the smart contract later.
  const data = {
    address: await tipsV1.getAddress(),
    abi: JSON.parse(tipsV1.interface.formatJson()),
  }

  await fs.writeFile(
    path.join(
      __dirname,
      "..",
      NODE_ENV === "production"
        ? "/abi/mainnet/Tips.json"
        : NODE_ENV === "test"
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

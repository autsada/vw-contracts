import path from "path"
import dotenv from "dotenv"
dotenv.config({ path: path.join(__dirname, ".env") })
import { HardhatUserConfig } from "hardhat/config"
import "@nomicfoundation/hardhat-toolbox"
import "@openzeppelin/hardhat-upgrades"

const {
  SEPOLIA_URL,
  PRIVATE_KEY_LOCAL,
  PRIVATE_KEY_TESTNET,
  ETHERSCAN_API_KEY,
} = process.env

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: "0.8.19",
        settings: {
          optimizer: {
            enabled: true,
            runs: 1000,
          },
        },
      },
    ],
  },
  networks: {
    hardhat: {
      chainId: 1337,
    },
    sepolia: {
      url: SEPOLIA_URL || "",
      accounts: PRIVATE_KEY_TESTNET !== undefined ? [PRIVATE_KEY_TESTNET] : [],
    },
    localhost: {
      allowUnlimitedContractSize: true,
      chainId: 1337,
      accounts: PRIVATE_KEY_LOCAL !== undefined ? [PRIVATE_KEY_LOCAL] : [],
    },
  },
  paths: {
    artifacts: "./artifacts",
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
  },
  typechain: {
    outDir: "./typechain-types",
  },
}

export default config

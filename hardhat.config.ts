import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import { task } from "hardhat/config";
import fs from "fs";
import path from "path";
import * as dotenv from "dotenv";
dotenv.config();

// Custom task to clean generated files
task("clean", "Cleans the cache and deletes all artifacts", async (_, hre) => {
  const pathsToDelete = [
    hre.config.paths.cache,
    hre.config.paths.artifacts,
    path.join(hre.config.paths.root, "typechain-types"),
  ];

  for (const p of pathsToDelete) {
    if (fs.existsSync(p)) {
      fs.rmdirSync(p, { recursive: true });
      console.log(`Deleted: ${p}`);
    }
  }
});

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.27",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
        details: {
          yul: true,
        },
      },
      viaIR: true,
      evmVersion: "berlin",
    },
  },
  networks: {
    localhost: {
      url: "http://localhost:8545",
      accounts: process.env.PRIVATE_KEY ? [`0x${process.env.PRIVATE_KEY}`] : [],
    },
    besu: {
      url: process.env.BESU_NETWORK_URL || "",
      accounts: process.env.PRIVATE_KEY ? [`0x${process.env.PRIVATE_KEY}`] : [],
    },
  },
  ignition: {
    blockPollingInterval: 1_000,
    requiredConfirmations: 1,
  },
};

export default config;

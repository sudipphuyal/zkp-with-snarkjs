const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  const ContractFactory = await ethers.getContractFactory("Registries");
  const contract = await ContractFactory.deploy();

  console.log("Contract deployed to address:", contract.target);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

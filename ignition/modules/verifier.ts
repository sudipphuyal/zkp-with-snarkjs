import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { ethers } from "hardhat";

const deployVerifierModule = buildModule("deployVerifierModule", (m) => {
  const utilsAddress = process.env.UTILS_ADDRESS;
  if (!utilsAddress) {
    throw new Error(
      "Please provide the address of the Utils contract using the 'UTILS_ADDRESS' environment variable."
    );
  }

  const registriesAddress = process.env.REGISTRIES_ADDRESS;
  if (!registriesAddress) {
    throw new Error(
      "Please provide the address of the Registries contract using the 'REGISTRIES_ADDRESS' environment variable."
    );
  }

  const deployer = m.deployer; // Get the deployer account
  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy the VerifierImplementation contract
  const Verifier = m.contract("VerifierImplementation", [
    utilsAddress,
    registriesAddress,
  ]);
  console.log("Verifier contract deployed at:", Verifier.address);

  return {
    Verifier,
  };
});

export default deployVerifierModule;

import { ethers } from "hardhat";
import { abi } from "../artifacts/contracts/Registries.sol/Registries.json";

// Define your contract details
const CONTRACT_ADDRESS = process.env.REGISTRIES_ADDRESS ?? "";
const RPC_URL = process.env.BESU_NETWORK_URL;
const ADDRESS_TO_CHECK = "0xeB834748297D2dC988D356E5F4eeeD9274171149";

// Define the ABI for your contract
const CONTRACT_ABI = abi;

async function main() {
  // Connect to the Ethereum node
  const provider = new ethers.JsonRpcProvider(RPC_URL);

  // Create a signer from the private key
  const signer = new ethers.Wallet(`0x${process.env.PRIVATE_KEY}`, provider);

  // Create a new contract instance
  const contract = new ethers.Contract(
    CONTRACT_ADDRESS,
    CONTRACT_ABI,
    provider
  );

  const signerWallet: any = contract.connect(signer);

  try {
    // const randomWallet = ethers.Wallet.createRandom();

    // const tx = await signerWallet.addHealthAuthority(randomWallet.address);

    // // Wait for the transaction to be mined
    // const receipt = await tx.wait();
    // console.log(`Transaction successful! Hash: ${receipt.hash}`);

    // Call the isHealthAuthority function
    // const result = await contract.isHealthAuthority(randomWallet.address);

    const result = await contract.isHealthAuthority(ADDRESS_TO_CHECK);
    console.log(`Is Health Authority: ${result}`);
  } catch (error) {
    console.error("Error calling isHealthAuthority:", error);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

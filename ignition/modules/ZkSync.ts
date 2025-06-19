import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const zkSyncVerificationModule = buildModule(
  "ZkSyncVerificationModule",
  (m) => {
    const verifierAddress = process.env.VERIFIER_ADDRESS;
    if (!verifierAddress) {
      throw new Error(
        "Please provide the address of the verifier contract using the 'VERIFIER_ADDRESS' environment variable."
      );
    }

    // Deploy the DsaAgreementVerifier contract with the verifier address
    const zkSyncVerificationContract = m.contract("DsaAgreementVerifier", [
      verifierAddress,
    ]);

    // Log the deployed contract address
    console.log(
      `ZkSyncVerification contract deployed at address: ${zkSyncVerificationContract.from}`
    );

    return { zkSyncVerificationContract };
  }
);

export default zkSyncVerificationModule;

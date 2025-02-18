import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const dsaEnumeratorModule = buildModule("DsaEnumeratorModule", (m) => {
  const utilsAddress = process.env.UTILS_ADDRESS;
  if (!utilsAddress) {
    throw new Error(
      "Please provide the address of the Utils contract using the 'UTILS_ADDRESS' environment variable."
    );
  }

  const dsaAddress = process.env.DSA_ADDRESS;
  if (!dsaAddress) {
    throw new Error(
      "Please provide the address of the RSA contract using the 'DSA_ADDRESS' environment variable."
    );
  }

  const dsaEnumerator = m.contract("DsaEnumerator", [utilsAddress, dsaAddress]);

  // Log the deployed contract address
  console.log(
    `DsaEnumerator contract deployed at address: ${dsaEnumerator.from}`
  );

  return { dsaEnumerator };
});

export default dsaEnumeratorModule;

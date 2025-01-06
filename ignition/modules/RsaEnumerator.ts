import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const rsaEnumeratorModule = buildModule("RsaEnumeratorModule", (m) => {
  const utilsAddress = process.env.RSA_UTILS_ADDRESS;
  if (!utilsAddress) {
    throw new Error(
      "Please provide the address of the RsaUtils contract using the 'RSA_UTILS_ADDRESS' environment variable."
    );
  }

  const rsaAddress = process.env.RSA_ADDRESS;
  if (!rsaAddress) {
    throw new Error(
      "Please provide the address of the RSA contract using the 'RSA_ADDRESS' environment variable."
    );
  }

  const rsaEnumerator = m.contract("RsaEnumerator", [utilsAddress, rsaAddress]);

  // Log the deployed contract address
  console.log(
    `RsaEnumerator contract deployed at address: ${rsaEnumerator.from}`
  );

  return { rsaEnumerator };
});

export default rsaEnumeratorModule;

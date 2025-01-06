import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const resourceCertificationModule = buildModule(
  "ResourceCertificationModule",
  (m) => {
    // Expect the registries contract address to be provided as an argument
    const registriesAddress = process.env.REGISTRIES_ADDRESS;
    if (!registriesAddress) {
      throw new Error(
        "Please provide the address of the Registries contract using the 'REGISTRIES_ADDRESS' environment variable."
      );
    }

    // Deploy the ResourceCertification contract with the provided Registries address
    const resourceCertification = m.contract("ResourceCertification", [
      registriesAddress,
    ]);

    // Log the deployed contract address
    console.log(
      `ResourceCertification contract deployed at address: ${resourceCertification.from}`
    );

    return { resourceCertification };
  }
);

export default resourceCertificationModule;

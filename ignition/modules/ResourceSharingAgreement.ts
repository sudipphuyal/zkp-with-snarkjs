import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const resourcesSharingAgreementModule = buildModule(
  "ResourcesSharingAgreementModule",
  (m) => {
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

    const resourceCertificationAddress =
      process.env.RESOURCE_CERTIFICATION_ADDRESS;
    if (!resourceCertificationAddress) {
      throw new Error(
        "Please provide the address of the Resource Certification contract using the 'RESOURCE_CERTIFICATION_ADDRESS' environment variable."
      );
    }

    const resourcesSharingAgreement = m.contract("ResourcesSharingAgreement", [
      utilsAddress,
      registriesAddress,
      resourceCertificationAddress,
    ]);

    // Log the deployed contract address
    console.log(
      `ResourcesSharingAgreement contract deployed at address: ${resourcesSharingAgreement.from}`
    );

    return { resourcesSharingAgreement };
  }
);

export default resourcesSharingAgreementModule;

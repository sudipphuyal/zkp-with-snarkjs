import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const dataSharingAgreementModule = buildModule(
  "DataSharingAgreementModule",
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

    const dataSharingAgreement = m.contract("DataSharingAgreement", [
      utilsAddress,
      registriesAddress,
    ]);

    // Log the deployed contract address
    console.log(
      `DataSharingAgreement contract deployed at address: ${dataSharingAgreement.from}`
    );

    return { dataSharingAgreement };
  }
);

export default dataSharingAgreementModule;

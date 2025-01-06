import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const registriesModule = buildModule("RegistriesModule", (m) => {
  const registries = m.contract("Registries");

  return { registries };
});

export default registriesModule;

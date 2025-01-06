import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const rsaUtilsModule = buildModule("RsaUtilsModule", (m) => {
  const rsaUtils = m.contract("RsaUtils");

  return { rsaUtils };
});

export default rsaUtilsModule;

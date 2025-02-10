import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const utilsModule = buildModule("UtilsModule", (m) => {
  const utils = m.contract("Utils");

  return { utils };
});

export default utilsModule;

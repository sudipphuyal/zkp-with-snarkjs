import { expect } from "chai";
import { ethers } from "hardhat";
import { Signer } from "ethers";
import {
  DsaEnumerator,
  DataSharingAgreement,
  Utils,
  Registries,
} from "../typechain-types";

describe("DsaEnumerator", function () {
  let registries: Registries;
  let dsaEnumerator: DsaEnumerator;
  let dataSharingAgreement: DataSharingAgreement;
  let utils: Utils;
  let provider: Signer, recipient: Signer, otherAccount: Signer;

  beforeEach(async function () {
    [provider, recipient, otherAccount] = await ethers.getSigners();

    // Deploy the Registries contract
    const RegistriesFactory = await ethers.getContractFactory("Registries");
    registries = await RegistriesFactory.deploy();

    // Deploy Utils mock contract
    const utilsFactory = await ethers.getContractFactory("Utils");
    utils = await utilsFactory.deploy();

    // Deploy DataSharingAgreement mock contract
    const dataSharingAgreementFactory = await ethers.getContractFactory(
      "DataSharingAgreement"
    );
    dataSharingAgreement = await dataSharingAgreementFactory.deploy(
      utils.getAddress(),
      registries.getAddress()
    );

    // Deploy DsaEnumerator contract
    const dsaEnumeratorFactory = await ethers.getContractFactory(
      "DsaEnumerator"
    );
    dsaEnumerator = await dsaEnumeratorFactory.deploy(
      utils.getAddress(),
      dataSharingAgreement.getAddress()
    );
  });

  it("Should deploy correctly", async function () {
    expect(await dsaEnumerator.utils()).to.equal(await utils.getAddress());
  });

  it("Should correctly count DSAs by provider", async function () {
    const count = await dsaEnumerator.getProviderDsaCount(
      await provider.getAddress(),
      "ALL"
    );
    expect(count).to.equal(0);
  });

  it("Should correctly count DSAs by recipient", async function () {
    const count = await dsaEnumerator.getRecipientDsaCount(
      await recipient.getAddress(),
      "ALL"
    );
    expect(count).to.equal(0);
  });

  it("Should revert on invalid state filter", async function () {
    await expect(
      dsaEnumerator.getProviderDsaCount(await provider.getAddress(), "INVALID")
    ).to.be.revertedWith("Invalid state filter");
  });

  it("Should retrieve DSAs for a provider with pagination", async function () {
    const dsas = await dsaEnumerator.getDsasByProvider(
      await provider.getAddress(),
      "ALL",
      0,
      10
    );
    expect(dsas.length).to.equal(0);
  });

  it("Should retrieve DSAs for a recipient with pagination", async function () {
    const dsas = await dsaEnumerator.getDsasByRecipient(
      await recipient.getAddress(),
      "ALL",
      0,
      10
    );
    expect(dsas.length).to.equal(0);
  });
});

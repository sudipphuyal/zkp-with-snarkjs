import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { DataSharingAgreement, Utils, Registries } from "../typechain-types";

describe("DataSharingAgreement", function () {
  let registries: Registries;
  let dataSharingAgreement: DataSharingAgreement;
  let utils: Utils;
  let owner: SignerWithAddress,
    provider: SignerWithAddress,
    recipient: SignerWithAddress,
    otherAccount: SignerWithAddress,
    healthOrg: SignerWithAddress,
    trustedApp: SignerWithAddress;

  beforeEach(async function () {
    [owner, provider, recipient, otherAccount, trustedApp, healthOrg] =
      await ethers.getSigners();

    // Deploy the Registries contract
    const RegistriesFactory = await ethers.getContractFactory("Registries");
    registries = await RegistriesFactory.deploy();

    // Deploy Utils mock contract
    const utilsFactory = await ethers.getContractFactory("Utils");
    utils = await utilsFactory.deploy();

    // Deploy DataSharingAgreement contract
    const dataSharingAgreementFactory = await ethers.getContractFactory(
      "DataSharingAgreement"
    );
    dataSharingAgreement = await dataSharingAgreementFactory.deploy(
      utils.getAddress(),
      registries.getAddress()
    );

    // Add owner as a health authority (this allows adding trusted entities)
    await registries.addHealthAuthority(owner.address);

    // Add `trustedApp` as a trusted application
    await registries.connect(owner).addTrustedApplication(trustedApp.address);

    // Add `healthOrg` as a healthcare organization
    await registries
      .connect(owner)
      .addHealthcareOrganization(healthOrg.address);
  });

  it("Should deploy correctly", async function () {
    expect(await dataSharingAgreement.utils()).to.equal(
      await utils.getAddress()
    );
    expect(await dataSharingAgreement.registriesContract()).to.equal(
      await registries.getAddress()
    );
  });

  it("Should allow a patient to create a DSA", async function () {
    await registries.connect(trustedApp).addPatient(provider.address);
    await registries
      .connect(healthOrg)
      .addHealthcareProfessional(recipient.address);

    const tx = await dataSharingAgreement
      .connect(provider)
      .createDsa(recipient.address, "1 month", "Medical data");
    await tx.wait();

    const dsaId = await utils.generateDsaId(
      provider.address,
      recipient.address
    );
    const dsa = await dataSharingAgreement.dsas(dsaId);

    expect(dsa.provider).to.equal(provider.address);
    expect(dsa.recipient).to.equal(recipient.address);
    expect(dsa.state).to.equal(0); // Pending
  });

  it("Should prevent non-patients from creating a DSA", async function () {
    await expect(
      dataSharingAgreement
        .connect(otherAccount)
        .createDsa(recipient.address, "1 month", "Medical data")
    ).to.be.revertedWith("Only patients can create DSAs");
  });

  it("Should allow a healthcare professional to accept a DSA", async function () {
    await registries.connect(trustedApp).addPatient(provider.address);
    await registries
      .connect(healthOrg)
      .addHealthcareProfessional(recipient.address);

    await dataSharingAgreement
      .connect(provider)
      .createDsa(recipient.address, "1 month", "Medical data");

    const dsaId = await utils.generateDsaId(
      provider.address,
      recipient.address
    );
    await dataSharingAgreement.connect(recipient).acceptDsa(dsaId);

    const dsa = await dataSharingAgreement.dsas(dsaId);
    expect(dsa.state).to.equal(1); // Active
  });

  it("Should prevent non-recipients from accepting a DSA", async function () {
    await registries.connect(trustedApp).addPatient(provider.address);
    await registries
      .connect(healthOrg)
      .addHealthcareProfessional(recipient.address);
    await registries
      .connect(healthOrg)
      .addHealthcareProfessional(otherAccount.address);

    await dataSharingAgreement
      .connect(provider)
      .createDsa(recipient.address, "1 month", "Medical data");

    const dsaId = await utils.generateDsaId(
      provider.address,
      recipient.address
    );
    await expect(
      dataSharingAgreement.connect(otherAccount).acceptDsa(dsaId)
    ).to.be.revertedWith("Not the recipient");
  });

  it("Should allow the provider to cancel a DSA", async function () {
    await registries.connect(trustedApp).addPatient(provider.address);
    await registries
      .connect(healthOrg)
      .addHealthcareProfessional(recipient.address);

    await dataSharingAgreement
      .connect(provider)
      .createDsa(recipient.address, "1 month", "Medical data");

    const dsaId = await utils.generateDsaId(
      provider.address,
      recipient.address
    );
    await dataSharingAgreement.connect(provider).cancelDsa(dsaId);

    await expect(dataSharingAgreement.getDsaState(dsaId)).to.be.revertedWith(
      "DSA not found"
    );
  });

  it("Should allow the recipient to reject a DSA", async function () {
    await registries.connect(trustedApp).addPatient(provider.address);
    await registries
      .connect(healthOrg)
      .addHealthcareProfessional(recipient.address);

    await dataSharingAgreement
      .connect(provider)
      .createDsa(recipient.address, "1 month", "Medical data");

    const dsaId = await utils.generateDsaId(
      provider.address,
      recipient.address
    );
    await dataSharingAgreement.connect(recipient).rejectDsa(dsaId);

    await expect(dataSharingAgreement.getDsaState(dsaId)).to.be.revertedWith(
      "DSA not found"
    );
  });
});

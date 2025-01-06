import { expect } from "chai";
import hre from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { Registries, Registries__factory } from "../typechain-types";

describe("Registries Contract", function () {
  let registries: Registries;
  let owner: HardhatEthersSigner;
  let healthAuthority: HardhatEthersSigner;
  let trustedIssuer: HardhatEthersSigner;
  let healthcareOrganization: HardhatEthersSigner;
  let trustedApp: HardhatEthersSigner;
  let trustedApp2: HardhatEthersSigner;
  let patient: HardhatEthersSigner;
  let healthcareProfessional: HardhatEthersSigner;

  // Deploy the contract before each test
  beforeEach(async function () {
    const RegistriesFactory = (await hre.ethers.getContractFactory(
      "Registries"
    )) as Registries__factory;
    [
      owner,
      healthAuthority,
      trustedIssuer,
      healthcareOrganization,
      healthcareProfessional,
      patient,
      trustedApp,
      trustedApp2,
    ] = await hre.ethers.getSigners();
    registries = await RegistriesFactory.deploy();
  });

  it("Should set the owner as the first health authority", async function () {
    expect(await registries.isHealthAuthority(owner.address)).to.equal(true);
  });

  it("Should not be a health authority", async function () {
    expect(await registries.isHealthAuthority(trustedApp.address)).to.equal(
      false
    );
  });

  it("Should allow owner to add and remove health authorities", async function () {
    await registries.addHealthAuthority(healthAuthority.address);
    expect(
      await registries.isHealthAuthority(healthAuthority.address)
    ).to.equal(true);

    await registries.removeHealthAuthority(healthAuthority.address);
    expect(
      await registries.isHealthAuthority(healthAuthority.address)
    ).to.equal(false);
  });

  it("Should allow health authorities to add and remove trusted issuers", async function () {
    await registries.addTrustedIssuer(trustedIssuer.address);
    expect(await registries.isTrustedIssuer(trustedIssuer.address)).to.equal(
      true
    );

    await registries.removeTrustedIssuer(trustedIssuer.address);
    expect(await registries.isTrustedIssuer(trustedIssuer.address)).to.equal(
      false
    );
  });

  it("Should allow health authorities to add healthcare organizations", async function () {
    await registries.addHealthcareOrganization(healthcareOrganization.address);
    expect(
      await registries.isHealthcareOrganization(healthcareOrganization.address)
    ).to.equal(true);
  });

  it("Should allow healthcare organizations to add healthcare professionals", async function () {
    await registries.addHealthcareOrganization(healthcareOrganization.address);
    await registries
      .connect(healthcareOrganization)
      .addHealthcareProfessional(healthcareProfessional.address);
    expect(
      await registries.isHealthcareProfessional(healthcareProfessional.address)
    ).to.equal(true);
  });

  it("Should allow trusted applications to add and remove patients", async function () {
    await registries.addTrustedApplication(trustedApp.address);
    await registries.connect(trustedApp).addPatient(patient.address);
    expect(await registries.isPatient(patient.address)).to.equal(true);

    await registries.connect(trustedApp).removePatient(patient.address);
    expect(await registries.isPatient(patient.address)).to.equal(false);
  });

  it("Should not allow removing entities that weren't added by the caller", async function () {
    await registries.addTrustedApplication(trustedApp.address);
    await registries.connect(trustedApp).addPatient(patient.address);

    await registries.addTrustedApplication(trustedApp2.address);

    // trustedApp2 tries to remove a patient added by trustedApp, which should fail
    await expect(
      registries.connect(trustedApp2).removePatient(patient.address)
    ).to.be.revertedWith("You can only remove patients added by you.");
  });
});

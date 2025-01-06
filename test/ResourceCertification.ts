import { expect } from "chai";
import hre from "hardhat";
import { Registries, ResourceCertification } from "../typechain-types";

describe("ResourceCertification", function () {
  let registries: Registries;
  let resourceCertification: ResourceCertification;
  let owner: any;
  let trustedIssuer: any;
  let nonIssuer: any;
  let notTrustedIssuer: any;

  beforeEach(async function () {
    // Deploy the Registries contract and set up accounts
    [owner, trustedIssuer, nonIssuer, notTrustedIssuer] =
      await hre.ethers.getSigners();

    const RegistriesFactory = await hre.ethers.getContractFactory("Registries");
    registries = await RegistriesFactory.deploy();

    // Add the owner as a health authority (which should have permission to add trusted issuers)
    await registries.addHealthAuthority(owner.address);
    await registries.addTrustedIssuer(trustedIssuer.address);

    // Deploy the ResourceCertification contract with the address of the Registries contract
    const ResourceCertificationFactory = await hre.ethers.getContractFactory(
      "ResourceCertification"
    );
    resourceCertification = await ResourceCertificationFactory.deploy(
      registries.getAddress()
    );
  });

  it("Should allow a trusted issuer to certify a resource", async function () {
    // Call certifyResource with the trusted issuer
    await resourceCertification
      .connect(trustedIssuer)
      .certifyResource("resource-1", owner.address);

    // Verify the resource
    const certificate = await resourceCertification.verifyResource(
      "resource-1"
    );
    expect(certificate.resourceId).to.equal("resource-1");
    expect(certificate.subject).to.equal(owner.address);
    expect(certificate.issuer).to.equal(trustedIssuer.address);
  });

  it("Should not allow a non-trusted issuer to certify a resource", async function () {
    // Attempt to certify a resource with a non-trusted issuer
    await expect(
      resourceCertification
        .connect(nonIssuer)
        .certifyResource("resource-2", nonIssuer.address)
    ).to.be.revertedWith("Caller is not a trusted issuer");
  });

  it("Should allow a trusted issuer to remove their own certificate", async function () {
    // Certify a resource with a trusted issuer
    await resourceCertification
      .connect(trustedIssuer)
      .certifyResource("resource-3", owner.address);

    // Remove the certificate
    await resourceCertification
      .connect(trustedIssuer)
      .removeCertificate("resource-3");

    // Attempt to verify the removed certificate
    await expect(resourceCertification.verifyResource("resource-3")).to.be
      .reverted;
  });

  it("Should not allow a trusted issuer to remove another issuer's certificate", async function () {
    // Add another trusted issuer
    await registries.addTrustedIssuer(notTrustedIssuer.address);

    // Certify a resource with the first trusted issuer
    await resourceCertification
      .connect(trustedIssuer)
      .certifyResource("resource-4", owner.address);

    // Attempt to remove the certificate with a different trusted issuer
    await expect(
      resourceCertification
        .connect(notTrustedIssuer)
        .removeCertificate("resource-4")
    ).to.be.revertedWith("Caller did not issue this certificate");
  });
});

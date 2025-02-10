import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { ContractTransactionResponse } from "ethers";
import {
  Registries,
  ResourceCertification,
  ResourcesSharingAgreement,
  RsaEnumerator,
  Utils,
} from "../typechain-types";

describe("ResourcesSharingAgreement", function () {
  let registries: Registries;
  let resourceSharingAgreement: ResourcesSharingAgreement;
  let rsaEnumerator: RsaEnumerator;
  let resourceCertification: ResourceCertification;
  let owner: SignerWithAddress;
  let trustedApp: SignerWithAddress;
  let healthOrg: SignerWithAddress;
  let provider: SignerWithAddress;
  let recipient: SignerWithAddress;
  let observer: SignerWithAddress;
  let randomAccount: SignerWithAddress;

  beforeEach(async function () {
    // Get signers
    [
      owner,
      trustedApp,
      healthOrg,
      provider,
      recipient,
      observer,
      randomAccount,
    ] = await ethers.getSigners();

    // Deploy the Registries contract
    const RegistriesFactory = await ethers.getContractFactory("Registries");
    registries = await RegistriesFactory.deploy();

    // Add owner as a health authority (this allows adding trusted entities)
    await registries.addHealthAuthority(owner.address);

    // Add `trustedApp` as a trusted application
    await registries.connect(owner).addTrustedApplication(trustedApp.address);

    // Add `healthOrg` as a healthcare organization
    await registries
      .connect(owner)
      .addHealthcareOrganization(healthOrg.address);

    // Add `healthOrg` as a trusted issuer
    await registries.connect(owner).addTrustedIssuer(healthOrg.address);

    // Deploy the ResourceCertification contract
    const ResourceCertificationFactory = await ethers.getContractFactory(
      "ResourceCertification"
    );
    resourceCertification = await ResourceCertificationFactory.deploy(
      registries.getAddress()
    );

    const utilsFactory = await ethers.getContractFactory("Utils");
    const utils = await utilsFactory.deploy();

    // Deploy the ResourceSharingAgreement contract
    const RSAFactory = await ethers.getContractFactory(
      "ResourcesSharingAgreement"
    );
    resourceSharingAgreement = await RSAFactory.deploy(
      utils.getAddress(),
      registries.getAddress(),
      resourceCertification.getAddress()
    );

    const RsaEnumeratorFactory = await ethers.getContractFactory(
      "RsaEnumerator"
    );
    rsaEnumerator = await RsaEnumeratorFactory.deploy(
      utils.getAddress(),
      resourceSharingAgreement.getAddress()
    );

    // Add the provider and recipient to their respective roles in Registries
    await registries.connect(trustedApp).addPatient(provider.address);
    await registries.connect(trustedApp).addPatient(provider.address);
    await registries
      .connect(healthOrg)
      .addHealthcareProfessional(recipient.address);
    await registries
      .connect(healthOrg)
      .addHealthcareProfessional(recipient.address);
    await registries
      .connect(healthOrg)
      .addHealthcareProfessional(observer.address);
  });

  // Helper function to certify resources
  async function certifyResources(
    providerLocal: SignerWithAddress,
    resources: string[]
  ): Promise<void> {
    for (const resourceId of resources) {
      await resourceCertification
        .connect(healthOrg)
        .certifyResource(resourceId, providerLocal.address);
    }
  }

  it("should create an RSA successfully with a recipient address", async function () {
    const sharedResources = ["resource1", "resource2"];
    const duration = "1 month";
    const secondOpinion = true;

    // Certify resources before creating RSA
    await certifyResources(provider, sharedResources);

    // Create RSA
    const tx: ContractTransactionResponse = await resourceSharingAgreement
      .connect(provider)
      .createRsa(
        recipient.address, // Recipient address
        "", // No email
        duration,
        secondOpinion,
        sharedResources
      );

    const receipt = await tx.wait();

    // Ensure the receipt is defined
    expect(receipt).to.be.not.null;
    expect(receipt).to.be.not.undefined;

    // Decode logs to extract the `RsaCreated` event
    const rsaCreatedEvent = receipt!.logs
      .map((log) => {
        try {
          return resourceSharingAgreement.interface.decodeEventLog(
            "RsaCreated",
            log.data,
            log.topics
          );
        } catch (error) {
          return null;
        }
      })
      .filter((log) => log !== null)[0];

    expect(rsaCreatedEvent).to.not.be.null;
    expect(rsaCreatedEvent).to.not.be.undefined;
    const rsaId = rsaCreatedEvent!.rsaId;

    // Check the created RSA
    const rsa = await resourceSharingAgreement.getRsaById(rsaId);
    expect(rsa.provider).to.equal(provider.address);
    expect(rsa.recipient).to.equal(recipient.address);
    expect(rsa.duration).to.equal(duration);
    expect(rsa.state).to.equal(0); // Pending state
  });

  it("should allow recipient to accept the RSA", async function () {
    const sharedResources = ["resource1"];
    const duration = "1 month";
    const secondOpinion = false;

    // Certify resources before creating RSA
    await certifyResources(provider, sharedResources);

    // Create RSA
    const tx: ContractTransactionResponse = await resourceSharingAgreement
      .connect(provider)
      .createRsa(
        recipient.address,
        "",
        duration,
        secondOpinion,
        sharedResources
      );

    const receipt = await tx.wait();

    // Ensure the receipt is defined
    expect(receipt).to.be.not.null;
    expect(receipt).to.be.not.undefined;

    // Decode logs to extract the `RsaCreated` event
    const rsaCreatedEvent = receipt!.logs
      .map((log) => {
        try {
          return resourceSharingAgreement.interface.decodeEventLog(
            "RsaCreated",
            log.data,
            log.topics
          );
        } catch (error) {
          return null;
        }
      })
      .filter((log) => log !== null)[0];

    expect(rsaCreatedEvent).to.not.be.null;
    expect(rsaCreatedEvent).to.not.be.undefined;
    const rsaId = rsaCreatedEvent!.rsaId;

    // Accept the RSA
    const acceptTx = await resourceSharingAgreement
      .connect(recipient)
      .acceptRsa(rsaId);
    await acceptTx.wait();

    // Verify the RSA state is now active
    const rsa = await resourceSharingAgreement.getRsaById(rsaId);
    expect(rsa.state).to.equal(1); // Active state

    //# Test access to resource
    await resourceSharingAgreement
      .connect(healthOrg)
      .authorizeAndLogAccess(rsaId, "resource1", recipient.address, "");
  });

  it("should allow recipient to reject the RSA", async function () {
    const sharedResources = ["resource1"];
    const duration = "1 month";
    const secondOpinion = false;

    // Certify resources before creating RSA
    await certifyResources(provider, sharedResources);

    // Create RSA
    const tx: ContractTransactionResponse = await resourceSharingAgreement
      .connect(provider)
      .createRsa(
        recipient.address,
        "",
        duration,
        secondOpinion,
        sharedResources
      );

    const receipt = await tx.wait();

    // Ensure the receipt is defined
    expect(receipt).to.be.not.null;
    expect(receipt).to.be.not.undefined;

    // Decode logs to extract the `RsaCreated` event
    const rsaCreatedEvent = receipt!.logs
      .map((log) => {
        try {
          return resourceSharingAgreement.interface.decodeEventLog(
            "RsaCreated",
            log.data,
            log.topics
          );
        } catch (error) {
          return null;
        }
      })
      .filter((log) => log !== null)[0];

    expect(rsaCreatedEvent).to.not.be.null;
    expect(rsaCreatedEvent).to.not.be.undefined;
    const rsaId = rsaCreatedEvent!.rsaId;

    // Reject the RSA
    const rejectTx = await resourceSharingAgreement
      .connect(recipient)
      .rejectRsa(rsaId);
    await rejectTx.wait();

    const rsa = await resourceSharingAgreement.getRsaById(rsaId);
    expect(rsa.provider).to.equal(ethers.ZeroAddress); // Expect provider to be zero address
    expect(rsa.recipient).to.equal(ethers.ZeroAddress); // Expect recipient to be zero address
  });

  it("should allow provider to cancel a pending RSA", async function () {
    const sharedResources = ["resource1"];
    const duration = "1 month";
    const secondOpinion = false;

    // Certify resources before creating RSA
    await certifyResources(provider, sharedResources);

    // Create RSA
    const tx: ContractTransactionResponse = await resourceSharingAgreement
      .connect(provider)
      .createRsa(
        recipient.address,
        "",
        duration,
        secondOpinion,
        sharedResources
      );

    const receipt = await tx.wait();

    // Ensure the receipt is defined
    expect(receipt).to.be.not.null;
    expect(receipt).to.be.not.undefined;

    // Decode logs to extract the `RsaCreated` event
    const rsaCreatedEvent = receipt!.logs
      .map((log) => {
        try {
          return resourceSharingAgreement.interface.decodeEventLog(
            "RsaCreated",
            log.data,
            log.topics
          );
        } catch (error) {
          return null;
        }
      })
      .filter((log) => log !== null)[0];

    expect(rsaCreatedEvent).to.not.be.null;
    expect(rsaCreatedEvent).to.not.be.undefined;
    const rsaId = rsaCreatedEvent!.rsaId;

    // Cancel the RSA
    const cancelTx = await resourceSharingAgreement
      .connect(provider)
      .cancelRsa(rsaId);
    await cancelTx.wait();

    const rsa = await resourceSharingAgreement.getRsaById(rsaId);
    expect(rsa.provider).to.equal(ethers.ZeroAddress); // Expect provider to be zero address
    expect(rsa.recipient).to.equal(ethers.ZeroAddress); // Expect recipient to be zero address
  });

  it("should allow either provider or recipient to revoke an active RSA", async function () {
    const sharedResources = ["resource1"];
    const duration = "1 month";
    const secondOpinion = false;

    // Certify resources before creating RSA
    await certifyResources(provider, sharedResources);

    // Create RSA
    const tx: ContractTransactionResponse = await resourceSharingAgreement
      .connect(provider)
      .createRsa(
        recipient.address,
        "",
        duration,
        secondOpinion,
        sharedResources
      );

    const receipt = await tx.wait();

    // Ensure the receipt is defined
    expect(receipt).to.be.not.null;
    expect(receipt).to.be.not.undefined;

    // Decode logs to extract the `RsaCreated` event
    const rsaCreatedEvent = receipt!.logs
      .map((log) => {
        try {
          return resourceSharingAgreement.interface.decodeEventLog(
            "RsaCreated",
            log.data,
            log.topics
          );
        } catch (error) {
          return null;
        }
      })
      .filter((log) => log !== null)[0];

    expect(rsaCreatedEvent).to.not.be.null;
    expect(rsaCreatedEvent).to.not.be.undefined;
    const rsaId = rsaCreatedEvent!.rsaId;

    // Accept the RSA
    await resourceSharingAgreement.connect(recipient).acceptRsa(rsaId);

    // Now revoke the RSA
    const revokeTx = await resourceSharingAgreement
      .connect(provider)
      .revokeRsa(rsaId);
    await revokeTx.wait();

    const rsa = await resourceSharingAgreement.getRsaById(rsaId);
    expect(rsa.provider).to.equal(ethers.ZeroAddress); // Expect provider to be zero address
    expect(rsa.recipient).to.equal(ethers.ZeroAddress); // Expect recipient to be zero address
  });

  it("should allow recipient to add an observer if secondOpinion is enabled", async function () {
    const sharedResources = [
      "864e6c3f1fdf20bb4370d6ba5ad8bb01e299cab7e6b07ccd43873235de276ac2",
    ];
    const duration = "1 month";
    const secondOpinion = true;

    await certifyResources(provider, ["1"]);
    await certifyResources(provider, ["2"]);
    await certifyResources(provider, ["3"]);
    // Certify resources before creating RSA
    await certifyResources(provider, sharedResources);

    // Create RSA
    const tx: ContractTransactionResponse = await resourceSharingAgreement
      .connect(provider)
      .createRsa(
        recipient.address,
        "",
        duration,
        secondOpinion,
        sharedResources
      );

    const receipt = await tx.wait();

    // Ensure the receipt is defined
    expect(receipt).to.be.not.null;
    expect(receipt).to.be.not.undefined;

    // Decode logs to extract the `RsaCreated` event
    const rsaCreatedEvent = receipt!.logs
      .map((log) => {
        try {
          return resourceSharingAgreement.interface.decodeEventLog(
            "RsaCreated",
            log.data,
            log.topics
          );
        } catch (error) {
          return null;
        }
      })
      .filter((log) => log !== null)[0];

    expect(rsaCreatedEvent).to.not.be.null;
    expect(rsaCreatedEvent).to.not.be.undefined;
    const rsaId = rsaCreatedEvent!.rsaId;

    // Accept the RSA
    await resourceSharingAgreement.connect(recipient).acceptRsa(rsaId);

    const addObserverTx = await resourceSharingAgreement
      .connect(recipient)
      .createObserverAssignment(rsaId, observer.address, "");
    await addObserverTx.wait();

    // Check if observer was added
    const rsa = await resourceSharingAgreement.getRsaById(rsaId);
    const observerInRsa = rsa.observersAssignments.find(
      (o) => o.observerAddress === observer.address
    );
    expect(observerInRsa).to.not.be.undefined;
    expect(observerInRsa?.accepted).to.equal(false);
  });

  it("should remove observer by address correctly", async function () {
    const sharedResources = ["resource1"];
    const duration = "1 month";
    const secondOpinion = true;

    // Certify resources before creating RSA
    await certifyResources(provider, sharedResources);

    // Create RSA
    const tx: ContractTransactionResponse = await resourceSharingAgreement
      .connect(provider)
      .createRsa(
        recipient.address,
        "",
        duration,
        secondOpinion,
        sharedResources
      );

    const receipt = await tx.wait();

    // Ensure the receipt is defined
    expect(receipt).to.be.not.null;
    expect(receipt).to.be.not.undefined;

    // Decode logs to extract the `RsaCreated` event
    const rsaCreatedEvent = receipt!.logs
      .map((log) => {
        try {
          return resourceSharingAgreement.interface.decodeEventLog(
            "RsaCreated",
            log.data,
            log.topics
          );
        } catch (error) {
          return null;
        }
      })
      .filter((log) => log !== null)[0];

    expect(rsaCreatedEvent).to.not.be.null;
    expect(rsaCreatedEvent).to.not.be.undefined;
    const rsaId = rsaCreatedEvent!.rsaId;

    await resourceSharingAgreement.connect(recipient).acceptRsa(rsaId);

    // Add observer by address
    await resourceSharingAgreement
      .connect(recipient)
      .createObserverAssignment(rsaId, observer.address, "");

    // Remove observer by address
    await resourceSharingAgreement
      .connect(recipient)
      .removeObserverAssignment(rsaId, observer.address, "");

    // Retrieve RSA info
    let rsa = await resourceSharingAgreement.getRsaById(rsaId);

    // Ensure observer address was removed
    expect(rsa.observersAssignments.length).to.equal(0);

    // Add observer by address
    await resourceSharingAgreement
      .connect(recipient)
      .createObserverAssignment(rsaId, observer.address, "");

    // Remove observer by address
    await resourceSharingAgreement
      .connect(recipient)
      .removeObserverAssignment(rsaId, observer.address, "");

    // Retrieve RSA info
    rsa = await resourceSharingAgreement.getRsaById(rsaId);

    // Ensure observer address was removed
    expect(rsa.observersAssignments.length).to.equal(0);
  });

  it("should allow recipient to remove an observer if secondOpinion is enabled", async function () {
    const sharedResources = ["resource1"];
    const duration = "1 month";
    const secondOpinion = true;

    // Certify resources before creating RSA
    await certifyResources(provider, sharedResources);

    // Create RSA
    const tx: ContractTransactionResponse = await resourceSharingAgreement
      .connect(provider)
      .createRsa(
        recipient.address,
        "",
        duration,
        secondOpinion,
        sharedResources
      );

    const receipt = await tx.wait();

    // Ensure the receipt is defined
    expect(receipt).to.be.not.null;
    expect(receipt).to.be.not.undefined;

    // Decode logs to extract the `RsaCreated` event
    const rsaCreatedEvent = receipt!.logs
      .map((log) => {
        try {
          return resourceSharingAgreement.interface.decodeEventLog(
            "RsaCreated",
            log.data,
            log.topics
          );
        } catch (error) {
          return null;
        }
      })
      .filter((log) => log !== null)[0];

    expect(rsaCreatedEvent).to.not.be.null;
    expect(rsaCreatedEvent).to.not.be.undefined;
    const rsaId = rsaCreatedEvent!.rsaId;

    // Accept the RSA
    await resourceSharingAgreement.connect(recipient).acceptRsa(rsaId);

    await resourceSharingAgreement
      .connect(recipient)
      .createObserverAssignment(rsaId, observer.address, "");

    await resourceSharingAgreement
      .connect(observer)
      .acceptObserverAssignment(rsaId);

    await resourceSharingAgreement
      .connect(recipient)
      .removeObserverAssignment(rsaId, observer.address, "");
    // Check if observer was removed
    const rsa = await resourceSharingAgreement.getRsaById(rsaId);

    const observerInRsa = rsa.observersAssignments.find(
      (o) => o.observerAddress === observer.address
    );
    expect(observerInRsa).to.be.undefined;
  });

  it("should create RSAs with valid recipient or email and allow filtering by provider with pagination and state", async function () {
    const sharedResources = ["resource1", "resource2", "resource3"];

    // Certify resources before creating RSA
    await certifyResources(provider, sharedResources);

    // Create RSAs with valid durations and either a recipient or recipient email
    await resourceSharingAgreement
      .connect(provider)
      .createRsa(recipient.address, "", "1 day", false, sharedResources);

    const tx: ContractTransactionResponse = await resourceSharingAgreement
      .connect(provider)
      .createRsa(
        ethers.ZeroAddress,
        "recipient@example.com",
        "1 month",
        true,
        sharedResources
      );
    const receipt = await tx.wait();

    // Ensure the receipt is defined
    expect(receipt).to.be.not.null;
    expect(receipt).to.be.not.undefined;

    // Decode logs to extract the `RsaCreated` event
    const rsaCreatedEvent = receipt!.logs
      .map((log) => {
        try {
          return resourceSharingAgreement.interface.decodeEventLog(
            "RsaCreated",
            log.data,
            log.topics
          );
        } catch (error) {
          return null;
        }
      })
      .filter((log) => log !== null)[0];

    expect(rsaCreatedEvent).to.not.be.null;
    expect(rsaCreatedEvent).to.not.be.undefined;
    const rsaId = rsaCreatedEvent!.rsaId;

    //# Test access to resource by email
    await resourceSharingAgreement
      .connect(healthOrg)
      .authorizeAndLogAccess(
        rsaId,
        "resource1",
        ethers.ZeroAddress,
        "recipient@example.com"
      );

    const allRsas = await rsaEnumerator.getRsasByProvider(
      provider.address,
      "ALL",
      0,
      100
    );

    expect(allRsas.length).to.equal(2);
    expect(allRsas[0].state).to.equal(0);
    expect(allRsas[1].state).to.equal(1);

    // Set the first RSA to Active state to differentiate states
    const [rsa1] = await rsaEnumerator.getRsasByProvider(
      provider.address,
      "ALL",
      0,
      1
    );
    await resourceSharingAgreement.connect(recipient).acceptRsa(rsa1.rsaId);

    // Verify filtering by "ACTIVE" state
    const activeRsas = await rsaEnumerator.getRsasByProvider(
      provider.address,
      "ACTIVE",
      0,
      10
    );

    expect(activeRsas.length).to.equal(2);
    expect(activeRsas[0].state).to.equal(1); // 1 = State.Active

    // Verify filtering by "PENDING" state
    const pendingRsas = await rsaEnumerator.getRsasByProvider(
      provider.address,
      "PENDING",
      0,
      10
    );

    expect(pendingRsas.length).to.equal(0);

    // Test pagination on "ALL" state filter
    const allRsas2 = await rsaEnumerator.getRsasByProvider(
      provider.address,
      "ALL",
      0,
      1
    );
    expect(allRsas2.length).to.equal(1);
    expect(allRsas2[0].state).to.be.oneOf([0n, 1n]); // Should be either Pending or Active
  });

  it("should allow filtering by observer with pagination", async function () {
    const sharedResources = ["resource1", "resource2", "resource3"];

    // Certify resources before creating RSA
    await certifyResources(provider, sharedResources);

    // Create RSAs with valid durations and either a recipient or recipient email
    await resourceSharingAgreement
      .connect(provider)
      .createRsa(recipient.address, "", "1 day", true, sharedResources);

    // Add observer to RSA
    const [rsa] = await rsaEnumerator.getRsasByProvider(
      provider.address,
      "ALL",
      0,
      1
    );

    await resourceSharingAgreement.connect(recipient).acceptRsa(rsa.rsaId);

    await resourceSharingAgreement
      .connect(recipient)
      .createObserverAssignment(rsa.rsaId, observer.address, "");

    await resourceSharingAgreement
      .connect(observer)
      .acceptObserverAssignment(rsa.rsaId);

    const allObserverRsas = await rsaEnumerator.getRsasByObserver(
      observer.address,
      "ALL",
      0,
      10
    );
    expect(allObserverRsas.length).to.equal(1);

    const observerRsaPage = await rsaEnumerator.getRsasByObserver(
      observer.address,
      "ALL",
      1,
      10
    );
    expect(observerRsaPage.length).to.equal(0);

    const allPendingObserverRsas = await rsaEnumerator.getRsasByObserver(
      observer.address,
      "PENDING",
      0,
      10
    );
    expect(allPendingObserverRsas.length).to.equal(0);

    const allActiveObserverRsas = await rsaEnumerator.getRsasByObserver(
      observer.address,
      "ACTIVE",
      0,
      10
    );
    expect(allActiveObserverRsas.length).to.equal(1);
  });

  it("should revert if invalid duration is provided", async function () {
    const sharedResources = ["resource11"];

    // Certify resources before creating RSA
    await certifyResources(provider, sharedResources);

    await expect(
      resourceSharingAgreement
        .connect(provider)
        .createRsa(recipient.address, "", "2 weeks", true, sharedResources)
    ).to.be.revertedWith("Invalid duration");
  });

  it("should revert if neither recipient address nor email is provided", async function () {
    const sharedResources = ["resource12"];

    // Certify resources before creating RSA
    await certifyResources(provider, sharedResources);

    await expect(
      resourceSharingAgreement
        .connect(provider)
        .createRsa(ethers.ZeroAddress, "", "1 day", true, sharedResources)
    ).to.be.revertedWith("Either recipient address or email must be provided");
  });

  it("should allow adding an observer by address in pending state", async function () {
    // Create an RSA
    const sharedResources = ["resource1"];
    // Certify resources before creating RSA
    await certifyResources(provider, sharedResources);

    const tx = await resourceSharingAgreement
      .connect(provider)
      .createRsa(recipient.address, "", "1 day", true, sharedResources);
    const receipt = await tx.wait();
    const rsaCreatedEvent = receipt!.logs
      .map((log) => {
        try {
          return resourceSharingAgreement.interface.decodeEventLog(
            "RsaCreated",
            log.data,
            log.topics
          );
        } catch (error) {
          return null;
        }
      })
      .filter((log) => log !== null)[0];

    expect(rsaCreatedEvent).to.not.be.null;
    expect(rsaCreatedEvent).to.not.be.undefined;
    const rsaId = rsaCreatedEvent!.rsaId;

    await resourceSharingAgreement.connect(recipient).acceptRsa(rsaId);

    // Add observer by address
    await resourceSharingAgreement
      .connect(recipient)
      .createObserverAssignment(rsaId, observer.address, "");

    // Retrieve RSA info
    const rsa = await resourceSharingAgreement.getRsaById(rsaId);

    // Check observers
    expect(rsa.observersAssignments.length).to.equal(1);
    expect(rsa.observersAssignments[0].observerAddress).to.equal(
      observer.address
    );
    expect(rsa.observersAssignments[0].observerEmail).to.equal("");
    expect(rsa.observersAssignments[0].accepted).to.be.false;
  });

  it("should allow adding an observer by email in active state", async function () {
    // Create an RSA
    const sharedResources = ["resource2"];
    // Certify resources before creating RSA
    await certifyResources(provider, sharedResources);

    const tx = await resourceSharingAgreement
      .connect(provider)
      .createRsa(recipient.address, "", "1 day", true, sharedResources);
    const receipt = await tx.wait();

    const rsaCreatedEvent = receipt!.logs
      .map((log) => {
        try {
          return resourceSharingAgreement.interface.decodeEventLog(
            "RsaCreated",
            log.data,
            log.topics
          );
        } catch (error) {
          return null;
        }
      })
      .filter((log) => log !== null)[0];

    expect(rsaCreatedEvent).to.not.be.null;
    expect(rsaCreatedEvent).to.not.be.undefined;
    const rsaId = rsaCreatedEvent!.rsaId;

    await resourceSharingAgreement.connect(recipient).acceptRsa(rsaId);

    // Add observer by email
    const observerEmail = "observer@example.com";
    await resourceSharingAgreement
      .connect(recipient)
      .createObserverAssignment(rsaId, ethers.ZeroAddress, observerEmail);

    // Retrieve RSA info
    const rsa = await resourceSharingAgreement.getRsaById(rsaId);

    // Check observers
    expect(rsa.observersAssignments.length).to.equal(1);
    expect(rsa.observersAssignments[0].observerEmail).to.equal(observerEmail);

    // // Ensure email-based observer is active
    expect(rsa.observersAssignments[0].accepted).to.be.true;

    //# Test access to resource by email
    await resourceSharingAgreement
      .connect(healthOrg)
      .authorizeAndLogAccess(
        rsaId,
        "resource2",
        ethers.ZeroAddress,
        "observer@example.com"
      );
  });

  it("should prevent duplicate email-based observers", async function () {
    // Create an RSA
    const sharedResources = ["resource3"];
    // Certify resources before creating RSA
    await certifyResources(provider, sharedResources);

    const tx = await resourceSharingAgreement
      .connect(provider)
      .createRsa(recipient.address, "", "1 day", true, sharedResources);
    const receipt = await tx.wait();
    const rsaCreatedEvent = receipt!.logs
      .map((log) => {
        try {
          return resourceSharingAgreement.interface.decodeEventLog(
            "RsaCreated",
            log.data,
            log.topics
          );
        } catch (error) {
          return null;
        }
      })
      .filter((log) => log !== null)[0];

    expect(rsaCreatedEvent).to.not.be.null;
    expect(rsaCreatedEvent).to.not.be.undefined;
    const rsaId = rsaCreatedEvent!.rsaId;

    await resourceSharingAgreement.connect(recipient).acceptRsa(rsaId);

    // Add observer by email
    const observerEmail = "observer@example.com";
    await resourceSharingAgreement
      .connect(recipient)
      .createObserverAssignment(rsaId, ethers.ZeroAddress, observerEmail);

    // Attempt to add the same email again
    await expect(
      resourceSharingAgreement
        .connect(recipient)
        .createObserverAssignment(rsaId, ethers.ZeroAddress, observerEmail)
    ).to.be.revertedWith("Observer email already added");
  });

  it("should allow observer address to accept the assignment", async function () {
    // Create an RSA
    const sharedResources = ["resource4"];
    // Certify resources before creating RSA
    await certifyResources(provider, sharedResources);

    const tx = await resourceSharingAgreement
      .connect(provider)
      .createRsa(recipient.address, "", "1 day", true, sharedResources);
    const receipt = await tx.wait();
    const rsaCreatedEvent = receipt!.logs
      .map((log) => {
        try {
          return resourceSharingAgreement.interface.decodeEventLog(
            "RsaCreated",
            log.data,
            log.topics
          );
        } catch (error) {
          return null;
        }
      })
      .filter((log) => log !== null)[0];

    expect(rsaCreatedEvent).to.not.be.null;
    expect(rsaCreatedEvent).to.not.be.undefined;
    const rsaId = rsaCreatedEvent!.rsaId;

    await resourceSharingAgreement.connect(recipient).acceptRsa(rsaId);

    // Add observer by address
    await resourceSharingAgreement
      .connect(recipient)
      .createObserverAssignment(rsaId, observer.address, "");

    // Observer accepts assignment
    await resourceSharingAgreement
      .connect(observer)
      .acceptObserverAssignment(rsaId);

    // Retrieve RSA info
    const rsa = await resourceSharingAgreement.getRsaById(rsaId);

    // Check observer state
    expect(rsa.observersAssignments[0].observerAddress).to.equal(
      observer.address
    );
    expect(rsa.observersAssignments[0].accepted).to.be.true;
  });

  it("should allow removing an observer by email", async function () {
    // Create an RSA
    const sharedResources = ["resource5"];
    // Certify resources before creating RSA
    await certifyResources(provider, sharedResources);

    const tx = await resourceSharingAgreement
      .connect(provider)
      .createRsa(recipient.address, "", "1 day", true, sharedResources);
    const receipt = await tx.wait();
    const rsaCreatedEvent = receipt!.logs
      .map((log) => {
        try {
          return resourceSharingAgreement.interface.decodeEventLog(
            "RsaCreated",
            log.data,
            log.topics
          );
        } catch (error) {
          return null;
        }
      })
      .filter((log) => log !== null)[0];

    expect(rsaCreatedEvent).to.not.be.null;
    expect(rsaCreatedEvent).to.not.be.undefined;
    const rsaId = rsaCreatedEvent!.rsaId;

    await resourceSharingAgreement.connect(recipient).acceptRsa(rsaId);

    // Add observer by email
    const observerEmail = "observer@example.com";
    await resourceSharingAgreement
      .connect(recipient)
      .createObserverAssignment(rsaId, ethers.ZeroAddress, observerEmail);

    // Remove observer by email
    await resourceSharingAgreement
      .connect(recipient)
      .removeObserverAssignment(rsaId, ethers.ZeroAddress, observerEmail);

    // Retrieve RSA info
    const rsa = await resourceSharingAgreement.getRsaById(rsaId);

    // Ensure observer email was removed
    expect(rsa.observersAssignments.length).to.equal(0);
  });

  it("test clean state after revoke rsa", async function () {
    // Create an RSA
    const sharedResources = ["resource1", "resource2"];
    // Certify resources before creating RSA
    await certifyResources(provider, sharedResources);

    // # Add recipient
    const tx = await resourceSharingAgreement
      .connect(provider)
      .createRsa(recipient.address, "", "1 day", true, sharedResources);
    const receipt = await tx.wait();

    const rsaCreatedEvent = receipt!.logs
      .map((log) => {
        try {
          return resourceSharingAgreement.interface.decodeEventLog(
            "RsaCreated",
            log.data,
            log.topics
          );
        } catch (error) {
          return null;
        }
      })
      .filter((log) => log !== null)[0];

    expect(rsaCreatedEvent).to.not.be.null;
    expect(rsaCreatedEvent).to.not.be.undefined;
    const rsaId = rsaCreatedEvent!.rsaId;

    await resourceSharingAgreement.connect(recipient).acceptRsa(rsaId);

    // Add observer
    await resourceSharingAgreement
      .connect(recipient)
      .createObserverAssignment(rsaId, observer.address, "");

    // Add observer by email
    const observerEmail = "observer@example.com";
    await resourceSharingAgreement
      .connect(recipient)
      .createObserverAssignment(rsaId, ethers.ZeroAddress, observerEmail);

    // Retrieve RSA info
    const rsa = await resourceSharingAgreement.getRsaById(rsaId);

    expect(rsa.recipient).to.equal(recipient.address);

    // Check observers
    expect(rsa.observersAssignments.length).to.equal(2);

    expect(rsa.observersAssignments[0].observerAddress).to.equal(
      observer.address
    );
    expect(rsa.observersAssignments[0].accepted).to.be.false;
    expect(rsa.observersAssignments[1].observerEmail).to.equal(observerEmail);
    expect(rsa.observersAssignments[1].accepted).to.be.true;

    const allProviderRsas = await rsaEnumerator.getRsasByProvider(
      provider.address,
      "ALL",
      0,
      1
    );
    expect(allProviderRsas.length).to.equal(1);

    const allRecipientRsas = await rsaEnumerator.getRsasByRecipient(
      recipient.address,
      "ALL",
      0,
      1
    );
    expect(allRecipientRsas.length).to.equal(1);

    const allObserverRsas = await rsaEnumerator.getRsasByObserver(
      observer.address,
      "ALL",
      0,
      10
    );
    expect(allObserverRsas.length).to.equal(1);

    const revokeTx = await resourceSharingAgreement
      .connect(provider)
      .revokeRsa(rsaId);
    await revokeTx.wait();

    const allProviderRsas2 = await rsaEnumerator.getRsasByProvider(
      provider.address,
      "ALL",
      0,
      1
    );
    expect(allProviderRsas2.length).to.equal(0);

    const allRecipientRsas2 = await rsaEnumerator.getRsasByRecipient(
      recipient.address,
      "ALL",
      0,
      1
    );
    expect(allRecipientRsas2.length).to.equal(0);

    const allObserverRsas2 = await rsaEnumerator.getRsasByObserver(
      observer.address,
      "ALL",
      0,
      10
    );
    expect(allObserverRsas2.length).to.equal(0);

    // # Re create RSA
    const tx2 = await resourceSharingAgreement
      .connect(provider)
      .createRsa(recipient.address, "", "1 day", true, sharedResources);
    const receipt2 = await tx2.wait();

    const rsaCreatedEvent2 = receipt2!.logs
      .map((log) => {
        try {
          return resourceSharingAgreement.interface.decodeEventLog(
            "RsaCreated",
            log.data,
            log.topics
          );
        } catch (error) {
          return null;
        }
      })
      .filter((log) => log !== null)[0];

    expect(rsaCreatedEvent2).to.not.be.null;
    expect(rsaCreatedEvent2).to.not.be.undefined;
    const rsaId2 = rsaCreatedEvent2!.rsaId;

    await resourceSharingAgreement.connect(recipient).acceptRsa(rsaId2);

    // Add observer
    await resourceSharingAgreement
      .connect(recipient)
      .createObserverAssignment(rsaId2, observer.address, "");

    // Add observer by email
    await resourceSharingAgreement
      .connect(recipient)
      .createObserverAssignment(rsaId2, ethers.ZeroAddress, observerEmail);

    // Retrieve RSA info
    const rsa2 = await resourceSharingAgreement.getRsaById(rsaId2);

    expect(rsa2.recipient).to.equal(recipient.address);

    // Check observers
    expect(rsa2.observersAssignments.length).to.equal(2);

    expect(rsa2.observersAssignments[0].observerAddress).to.equal(
      observer.address
    );
    expect(rsa2.observersAssignments[0].accepted).to.be.false;
    expect(rsa2.observersAssignments[1].observerEmail).to.equal(observerEmail);
    expect(rsa2.observersAssignments[1].accepted).to.be.true;

    const allProviderRsas3 = await rsaEnumerator.getRsasByProvider(
      provider.address,
      "ALL",
      0,
      1
    );
    expect(allProviderRsas3.length).to.equal(1);

    const allRecipientRsas3 = await rsaEnumerator.getRsasByRecipient(
      recipient.address,
      "ALL",
      0,
      1
    );
    expect(allRecipientRsas3.length).to.equal(1);

    const allObserverRsas3 = await rsaEnumerator.getRsasByObserver(
      observer.address,
      "ALL",
      0,
      10
    );
    expect(allObserverRsas3.length).to.equal(1);
  });
});

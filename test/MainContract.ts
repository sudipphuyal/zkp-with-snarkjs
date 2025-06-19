// test/MainContract.ts or .js
const { expect } = require("chai");
const { ethers } = require("hardhat");
const fs = require("fs");

describe("ZKProof Integration Test", function () {
  it("Should verify proof and execute logic", async function () {
    const proof = JSON.parse(fs.readFileSync("build/proof.json"));
    const publicSignals = JSON.parse(fs.readFileSync("build/public.json"));

    const VerifierFactory = await ethers.getContractFactory("Verifier");
    const verifier = await VerifierFactory.deploy();

    const MainContractFactory = await ethers.getContractFactory("MainContract");
    const mainContract = await MainContractFactory.deploy(verifier.target); // .target for Ethers v6

    const { a, b, c, input } = parseProofForSolidity(proof, publicSignals);

    const result = await mainContract.verifyAndDoSomething(a, b, c, input); // returns bool now
    expect(result).to.equal(true); // ✅ Works now
  });
});

function parseProofForSolidity(proof, publicSignals) {
  return {
    a: [proof.pi_a[0], proof.pi_a[1]],
    b: [
      [proof.pi_b[0][1], proof.pi_b[0][0]],
      [proof.pi_b[1][1], proof.pi_b[1][0]]
    ],
    c: [proof.pi_c[0], proof.pi_c[1]],
    input: [publicSignals[0].toString()]
  };
}

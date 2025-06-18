const circomlib = require("circomlibjs");
const fs = require("fs");

async function generateHash() {
  const poseidon = await circomlib.buildPoseidon();

  const patientId = "123456"; // Example secret

  const hash = poseidon.F.toObject(poseidon([patientId]));

  console.log("Poseidon Hash (patientHash):", hash.toString());

  const input = {
    patientId: patientId.toString(),
    patientHash: hash.toString(),
  };

  fs.writeFileSync("input.json", JSON.stringify(input, null, 2));
}

generateHash();

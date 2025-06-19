pragma circom 2.0.0;

include "circuits/poseidon.circom";  // Ensure this path is correct

template DsaAgreementProof() {
    // === Private Inputs ===
    signal input patientId;
    signal input healthcareProfessionalId;
    signal input sharedData;
    
    // === Public Inputs ===
    signal input duration;
    
    // Declare the signals for the hashes
    signal patientHash;
    signal healthcareProfessionalHash;
    signal sharedDataHash;

    // Use Poseidon hash for patientId, healthcareProfessionalId, and sharedData
    component poseidon1 = Poseidon(1); // For patientId
    poseidon1.inputs[0] <== patientId;
    patientHash <== poseidon1.out;

    component poseidon2 = Poseidon(1); // For healthcareProfessionalId
    poseidon2.inputs[0] <== healthcareProfessionalId;
    healthcareProfessionalHash <== poseidon2.out;

    component poseidon3 = Poseidon(1); // For sharedData
    poseidon3.inputs[0] <== sharedData;
    sharedDataHash <== poseidon3.out;

    // Combine the hashes to form the combined hash
    component poseidon4 = Poseidon(4); // For the combined hash of all inputs
    poseidon4.inputs[0] <== patientHash;
    poseidon4.inputs[1] <== healthcareProfessionalHash;
    poseidon4.inputs[2] <== sharedDataHash;
    poseidon4.inputs[3] <== duration;
    signal combinedHash;
    combinedHash <== poseidon4.out;

    // Enforce equality between the combined hash and the hash of the agreement inputs
    combinedHash === poseidon4.out;  // Ensure that the constraint is valid
}

component main = DsaAgreementProof();

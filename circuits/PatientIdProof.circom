pragma circom 2.0.0;

include "circuits/poseidon.circom";

template PatientIdProof() {
    // === Private Input ===
    signal input patientId;
    // === Public Input (Hash to verify against) ===
    signal output patientHash;

    // signal output out;
   //  signal hashOutput;
    component poseidon = Poseidon(1);
    poseidon.inputs[0] <== patientId;
    // Compute Poseidon Hash of patientId
    //hashOutput <== Poseidon([patientId]);

    // Enforce that hash(patientId) == patientHash
     patientHash <== poseidon.out;
   
     //out <== patientHash;
}

component main = PatientIdProof();

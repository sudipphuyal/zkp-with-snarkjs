// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.27;
import "./ABVerifier.sol";

contract MainContract {
    ABVerifier public verifier;

    constructor(address _verifier) {
        verifier = ABVerifier(_verifier);
    }

    // use verifier.verifyProof(...) in functions
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Verifier.sol";

contract MainContract {
    Verifier public verifier;

    constructor(address _verifier) {
        verifier = Verifier(_verifier);
    }

    function verifyAndDoSomething(
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        uint[1] memory input
    ) public view returns (bool) {
        require(verifier.verifyProof(a, b, c, input), "Invalid proof");
        
        // Proof is valid - do something
        return true;
    }
}

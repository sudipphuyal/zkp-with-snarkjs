// // SPDX-License-Identifier: MIT
// pragma solidity ^0.8.0;

// import "./Verifier.sol";

// contract MainContract {
//     Verifier public verifier;

//     constructor(address _verifier) {
//         verifier = Verifier(_verifier);
//     }

//     function verifyAndDoSomething(
//         uint[2] memory a,
//         uint[2][2] memory b,
//         uint[2] memory c,
//         uint[1] memory input
//     ) public view returns (bool) {
//         require(verifier.verifyProof(a, b, c, input), "Invalid proof");
        
//         // Proof is valid - do something
//         return true;
//     }
// }



// Story begins here
pragma solidity ^0.8.27;

import "./Verifier.sol"; // ZK verifier

interface IUtils {
    function generateDsaId(address _provider, address _recipient) external pure returns (bytes20);
    function getDurationInSeconds(string memory _duration) external view returns (uint256);
}

interface IRegistries {
    function isPatient(address _patient) external view returns (bool);
    function isHealthcareProfessional(address _professional) external view returns (bool);
}

contract MainContract {
    enum DsaState { Pending, Active }

    struct Dsa {
        address provider;
        address recipient;
        DsaState state;
        string duration;
        string sharedData;
        uint256 expiresAt;
        uint256 createdAt;
    }

    struct DsaInfo {
        bytes20 dsaId;
        address provider;
        address recipient;
        DsaState state;
        string duration;
        string sharedData;
        uint256 expiresAt;
        uint256 createdAt;
    }

    mapping(bytes20 => Dsa) public dsas;
    mapping(address => bytes20[]) private providerDsas;
    mapping(address => bytes20[]) private recipientDsas;

    IUtils public utils;
    IRegistries public registriesContract;
    Verifier public verifier; // 🔐

    event DsaCreated(bytes20 indexed dsaId, address indexed provider, address indexed recipient, string duration, uint256 expiresAt, string sharedData);
    event DsaAccepted(bytes20 indexed dsaId, address provider, address recipient);
    event DsaRejected(bytes20 indexed dsaId, address provider, address recipient);
    event DsaCancelled(bytes20 indexed dsaId, address provider, address recipient);
    event DsaRevoked(bytes20 indexed dsaId, address provider, address recipient, address caller);

    constructor(address _utilsContract, address _registriesContract, address _verifierContract) {
        utils = IUtils(_utilsContract);
        registriesContract = IRegistries(_registriesContract);
        verifier = Verifier(_verifierContract); // 🔐
    }

    // 🔐 Create DSA with proof
    function createDsaWithProof(
        address _recipient,
        string memory _duration,
        string memory _sharedData,
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        uint[1] memory input
    ) external {
        require(registriesContract.isPatient(msg.sender), "Only patients can create DSAs");
        require(registriesContract.isHealthcareProfessional(_recipient), "Recipient must be a healthcare professional");
        require(verifier.verifyProof(a, b, c, input), "Invalid ZK proof"); // 🔐

        bytes20 dsaId = utils.generateDsaId(msg.sender, _recipient);
        require(dsas[dsaId].provider == address(0), "DSA already exists");

        uint256 durationInSeconds = utils.getDurationInSeconds(_duration);

        dsas[dsaId] = Dsa({
            provider: msg.sender,
            recipient: _recipient,
            state: DsaState.Pending,
            duration: _duration,
            sharedData: _sharedData,
            expiresAt: block.timestamp + durationInSeconds,
            createdAt: block.timestamp
        });

        emit DsaCreated(dsaId, msg.sender, _recipient, _duration, dsas[dsaId].expiresAt, _sharedData);
    }

    // 🔐 Accept DSA with proof
    function acceptDsaWithProof(
        bytes20 _dsaId,
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        uint[1] memory input
    ) external {
        require(registriesContract.isHealthcareProfessional(msg.sender), "Only HCPs can accept DSAs");
        require(dsas[_dsaId].recipient == msg.sender, "Not the recipient");
        require(dsas[_dsaId].state == DsaState.Pending, "DSA not pending");
        require(verifier.verifyProof(a, b, c, input), "Invalid ZK proof"); // 🔐

        dsas[_dsaId].state = DsaState.Active;
        emit DsaAccepted(_dsaId, dsas[_dsaId].provider, msg.sender);
    }

    // 🧹 Existing helpers like _removeDsaIdFromProvider and burnDsa stay unchanged...
    // 🧹 Your view functions and revoke/cancel/reject remain untouched...

    // ➤ Leave `createDsa()` and `acceptDsa()` in place for non-ZKP flows if needed
}

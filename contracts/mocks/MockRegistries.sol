// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

contract MockRegistries {
    mapping(address => bool) private _patients;
    mapping(address => bool) private _professionals;

    function setPatient(address user, bool status) public {
        _patients[user] = status;
    }

    function setHealthcareProfessional(address user, bool status) public {
        _professionals[user] = status;
    }

    function isPatient(address user) external view returns (bool) {
        return _patients[user];
    }

    function isHealthcareProfessional(address user) external view returns (bool) {
        return _professionals[user];
    }
}

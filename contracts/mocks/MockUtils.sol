// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

contract MockUtils {
    function generateDsaId(address _provider, address _recipient) external pure returns (bytes20) {
        return bytes20(keccak256(abi.encodePacked(_provider, _recipient)));
    }

    function getDurationInSeconds(string memory duration) external pure returns (uint256) {
        if (keccak256(abi.encodePacked(duration)) == keccak256(abi.encodePacked("1h"))) {
            return 3600;
        } else if (keccak256(abi.encodePacked(duration)) == keccak256(abi.encodePacked("1d"))) {
            return 86400;
        } else if (keccak256(abi.encodePacked(duration)) == keccak256(abi.encodePacked("1w"))) {
            return 604800;
        } else {
            return 0;
        }
    }
}

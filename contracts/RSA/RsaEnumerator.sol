// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "./RsaUtils.sol";
import "./ResourcesSharingAgreement.sol";

contract RsaEnumerator {
    RsaUtils public utils;
    ResourcesSharingAgreement private rsaContract;

    constructor(address _utilsContract, address _rsaContract) {
        utils = RsaUtils(_utilsContract);
        rsaContract = ResourcesSharingAgreement(_rsaContract);
    }

    function _getStateFromString(
        string memory _stateFilter
    ) private view returns (RsaUtils.State, bool) {
        if (utils.generateHash(_stateFilter) == utils.generateHash("ALL")) {
            return (RsaUtils.State.Pending, false);
        } else if (
            utils.generateHash(_stateFilter) == utils.generateHash("ACTIVE")
        ) {
            return (RsaUtils.State.Active, true);
        } else if (
            utils.generateHash(_stateFilter) == utils.generateHash("PENDING")
        ) {
            return (RsaUtils.State.Pending, true);
        } else {
            revert("Invalid state filter");
        }
    }

    function _getAcceptanceFilterFromString(
        string memory _stateFilter
    ) private view returns (bool, bool) {
        if (utils.generateHash(_stateFilter) == utils.generateHash("ALL")) {
            return (true, true);
        } else if (
            utils.generateHash(_stateFilter) == utils.generateHash("ACTIVE")
        ) {
            return (true, false);
        } else if (
            utils.generateHash(_stateFilter) == utils.generateHash("PENDING")
        ) {
            return (false, true);
        } else {
            revert("Invalid state filter");
        }
    }

    function getProviderRsaCount(
        address _provider,
        string memory _stateFilter
    ) external view returns (uint256) {
        (RsaUtils.State targetState, bool applyFilter) = _getStateFromString(
            _stateFilter
        );

        uint256 count = 0;
        bytes20[] memory rsaIds = rsaContract.getProviderRsas(_provider);

        for (uint256 i = 0; i < rsaIds.length; i++) {
            if (
                !applyFilter ||
                rsaContract.getRsaState(rsaIds[i]) == targetState
            ) {
                count++;
            }
        }
        return count;
    }

    function getRsasByProvider(
        address _provider,
        string memory _stateFilter,
        uint256 _offset,
        uint256 _limit
    ) external view returns (ResourcesSharingAgreement.RsaInfo[] memory) {
        (RsaUtils.State targetState, bool applyFilter) = _getStateFromString(
            _stateFilter
        );
        bytes20[] memory rsaIds = rsaContract.getProviderRsas(_provider);
        uint256 resultCount = 0;

        for (
            uint256 i = _offset;
            i < rsaIds.length && resultCount < _limit;
            i++
        ) {
            if (
                !applyFilter ||
                rsaContract.getRsaState(rsaIds[i]) == targetState
            ) {
                resultCount++;
            }
        }

        ResourcesSharingAgreement.RsaInfo[]
            memory result = new ResourcesSharingAgreement.RsaInfo[](
                resultCount
            );
        uint256 index = 0;

        for (
            uint256 i = _offset;
            i < rsaIds.length && index < resultCount;
            i++
        ) {
            if (
                !applyFilter ||
                rsaContract.getRsaState(rsaIds[i]) == targetState
            ) {
                result[index] = rsaContract.getRsaInfo(rsaIds[i]);
                index++;
            }
        }

        return result;
    }

    function getRecipientRsaCount(
        address _recipient,
        string memory _stateFilter
    ) external view returns (uint256) {
        (RsaUtils.State targetState, bool applyFilter) = _getStateFromString(
            _stateFilter
        );

        bytes20[] memory rsaIds = rsaContract.getRecipientRsas(_recipient);

        uint256 count = 0;
        for (uint256 i = 0; i < rsaIds.length; i++) {
            if (
                !applyFilter ||
                rsaContract.getRsaState(rsaIds[i]) == targetState
            ) {
                count++;
            }
        }

        return count;
    }

    function getRsasByRecipient(
        address _recipient,
        string memory _stateFilter,
        uint256 _offset,
        uint256 _limit
    ) external view returns (ResourcesSharingAgreement.RsaInfo[] memory) {
        (RsaUtils.State targetState, bool applyFilter) = _getStateFromString(
            _stateFilter
        );

        bytes20[] memory rsaIds = rsaContract.getRecipientRsas(_recipient);

        uint256 resultCount = 0;
        for (uint256 i = 0; i < rsaIds.length; i++) {
            if (
                !applyFilter ||
                rsaContract.getRsaState(rsaIds[i]) == targetState
            ) {
                resultCount++;
            }
        }

        uint256 start = _offset;
        uint256 end = start + _limit > resultCount
            ? resultCount
            : start + _limit;

        ResourcesSharingAgreement.RsaInfo[]
            memory result = new ResourcesSharingAgreement.RsaInfo[](
                end - start
            );
        uint256 index = 0;

        for (uint256 i = 0; i < rsaIds.length && index < end - start; i++) {
            if (
                !applyFilter ||
                rsaContract.getRsaState(rsaIds[i]) == targetState
            ) {
                if (index >= start) {
                    result[index] = rsaContract.getRsaInfo(rsaIds[i]);
                }
                index++;
            }
        }

        return result;
    }

    function getObserverRsaCount(
        address _observer,
        string memory _stateFilter
    ) external view returns (uint256) {
        (
            bool includeAccepted,
            bool includeNotAccepted
        ) = _getAcceptanceFilterFromString(_stateFilter);

        bytes20[] memory rsaIds = rsaContract.getObserverRsas(_observer);

        uint256 count = 0;
        for (uint256 i = 0; i < rsaIds.length; i++) {
            ResourcesSharingAgreement.ObserverAssignment[]
                memory assignments = rsaContract.getObserverAssignments(
                    rsaIds[i]
                );

            for (uint256 j = 0; j < assignments.length; j++) {
                if (
                    assignments[j].observerAddress == _observer &&
                    ((assignments[j].accepted && includeAccepted) ||
                        (!assignments[j].accepted && includeNotAccepted))
                ) {
                    count++;
                    break;
                }
            }
        }

        return count;
    }

    function getRsasByObserver(
        address _observer,
        string memory _stateFilter,
        uint256 _offset,
        uint256 _limit
    ) external view returns (ResourcesSharingAgreement.RsaInfo[] memory) {
        (
            bool includeAccepted,
            bool includeNotAccepted
        ) = _getAcceptanceFilterFromString(_stateFilter);

        bytes20[] memory rsaIds = rsaContract.getObserverRsas(_observer);
        uint256[] memory filteredRsaIndexes = new uint256[](rsaIds.length);
        uint256 resultCount = 0;

        for (uint256 i = 0; i < rsaIds.length; i++) {
            ResourcesSharingAgreement.ObserverAssignment[]
                memory assignments = rsaContract.getObserverAssignments(
                    rsaIds[i]
                );

            for (uint256 j = 0; j < assignments.length; j++) {
                if (
                    assignments[j].observerAddress == _observer &&
                    ((assignments[j].accepted && includeAccepted) ||
                        (!assignments[j].accepted && includeNotAccepted))
                ) {
                    filteredRsaIndexes[resultCount] = i;
                    resultCount++;
                    break;
                }
            }
        }

        uint256 start = _offset;
        uint256 end = start + _limit > resultCount
            ? resultCount
            : start + _limit;
        ResourcesSharingAgreement.RsaInfo[]
            memory result = new ResourcesSharingAgreement.RsaInfo[](
                end - start
            );

        uint256 index = 0;
        for (uint256 i = start; i < end; i++) {
            uint256 rsaIndex = filteredRsaIndexes[i];
            result[index] = rsaContract.getRsaInfo(rsaIds[rsaIndex]);
            index++;
        }

        return result;
    }
}

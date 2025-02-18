# Besu Contracts

npm install 

npx hardhat clean

npx hardhat compile

npx hardhat test

## RPC calls

curl -X POST --data '{"jsonrpc":"2.0","method":"eth_getBlockByNumber","params":["latest", false],"id":1}' http://134.209.19.66:8545

## DEPLOY BESU

Note: To run with a different account run with "PRIVATE_KEY=<OTHER_PRIVATE_KEY> " before "npx hardhat"

1) Delete ignition/deplyments directory

2) Run - npx hardhat ignition deploy ./ignition/modules/Registries.ts --network besu

3) Copy contract address to REGISTRIES_ADDRESS var in .env

4) Run - npx hardhat ignition deploy ./ignition/modules/ResourceCertification.ts --network besu

5) Copy contract address to RESOURCE_CERTIFICATION_ADDRESS var in .env

6) Run - npx hardhat ignition deploy ./ignition/modules/Utils.ts --network besu

7) Copy contract address to UTILS_ADDRESS var in .env

8) Run - npx hardhat ignition deploy ./ignition/modules/ResourceSharingAgreement.ts --network besu

9) Copy contract address to RSA_ADDRESS var in .env

10) Run - npx hardhat ignition deploy ./ignition/modules/RsaEnumerator.ts --network besu

11) Copy contract address to RSA_ENUMERATOR_ADDRESS var in .env

12) Run - npx hardhat ignition deploy ./ignition/modules/DataSharingAgreement.ts --network besu

13) Copy contract address to DSA_ADDRESS var in .env

14) Run - npx hardhat ignition deploy ./ignition/modules/DsaEnumerator.ts --network besu

15) Copy contract address to DSA_ENUMERATOR_ADDRESS var in .env

## DEPLOY SEPOLIA

Note: To run with a different account run with "PRIVATE_KEY=<OTHER_PRIVATE_KEY> " before "npx hardhat"

1) Delete ignition/deplyments directory

2) Run - npx hardhat ignition deploy ./ignition/modules/Registries.ts --network sepolia

3) Copy contract address to REGISTRIES_ADDRESS var in .env

4) Run - npx hardhat ignition deploy ./ignition/modules/ResourceCertification.ts --network sepolia

5) Copy contract address to RESOURCE_CERTIFICATION_ADDRESS var in .env

6) Run - npx hardhat ignition deploy ./ignition/modules/Utils.ts --network sepolia

7) Copy contract address to UTILS_ADDRESS var in .env

8) Run - npx hardhat ignition deploy ./ignition/modules/ResourceSharingAgreement.ts --network sepolia

9) Copy contract address to RSA_ADDRESS var in .env

10) Run - npx hardhat ignition deploy ./ignition/modules/RsaEnumerator.ts --network sepolia

11) Copy contract address to RSA_ENUMERATOR_ADDRESS var in .env

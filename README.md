# Besu Contracts

npm install 

npx hardhat clean

npx hardhat compile

npx hardhat test

## RPC calls

curl -X POST --data '{"jsonrpc":"2.0","method":"eth_getBlockByNumber","params":["latest", false],"id":1}' http://134.209.19.66:8545

## DEPLOY

PRIVATE_KEY=<PRIVATE_KEY> npx hardhat ignition deploy ./ignition/modules/Registries.ts --network besu --verbose --show-stack-traces

PRIVATE_KEY=<PRIVATE_KEY> npx hardhat run scripts/deploy.js --network besu

PRIVATE_KEY=<PRIVATE_KEY> npx hardhat run scripts/RegistriesTest.ts --network besu

PRIVATE_KEY=<PRIVATE_KEY> npx hardhat ignition deploy ./ignition/modules/Registries.ts --network besu

PRIVATE_KEY=<PRIVATE_KEY> npx hardhat ignition deploy ./ignition/modules/ResourceCertification.ts --network besu

PRIVATE_KEY=<PRIVATE_KEY> npx hardhat ignition deploy ./ignition/modules/RsaUtils.ts --network besu

PRIVATE_KEY=<PRIVATE_KEY> npx hardhat ignition deploy ./ignition/modules/ResourceSharingAgreement.ts --network besu

PRIVATE_KEY=<PRIVATE_KEY> npx hardhat ignition deploy ./ignition/modules/RsaEnumerator.ts --network besu
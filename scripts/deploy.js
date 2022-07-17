const hre = require("hardhat");

async function main () {
  // We get the contract to deploy
  const GovernanceToken = await hre.ethers.getContractFactory('GovernanceERC20');
  console.log("Deploying Governance Token...");
  const governanceToken = await GovernanceToken.deploy(1000);
  await governanceToken.deployed();
  console.log('Governance Token deployed to:', governanceToken.address);

  const DAO = await hre.ethers.getContractFactory('DAO');
  console.log('Deploying DAO...');
  const dao = await DAO.deploy(governanceToken.address);
  await dao.deployed();
  console.log('DAO deployed to:', dao.address);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
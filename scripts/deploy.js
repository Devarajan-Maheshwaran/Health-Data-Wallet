async function main() {
  console.log("Deploying HealthRecord contract...");
  
  // Get the Contract Factory
  const HealthRecord = await ethers.getContractFactory("HealthRecord");
  
  // Deploy the contract
  const healthRecord = await HealthRecord.deploy();
  await healthRecord.deployed();
  
  console.log("HealthRecord deployed to:", healthRecord.address);
  console.log("Update the CONTRACT_ADDRESSES.HEALTH_RECORD value in client/src/constants/index.ts with this address");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

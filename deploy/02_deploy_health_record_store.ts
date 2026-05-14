import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log("Deploying HealthRecordStore with account:", deployer);

  const result = await deploy("HealthRecordStore", {
    from: deployer,
    args: [],
    log: true,
    waitConfirmations: hre.network.name === "hardhat" ? 1 : 5,
  });

  console.log("HealthRecordStore deployed to:", result.address);

  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    await hre.run("verify:verify", {
      address: result.address,
      constructorArguments: [],
    });
  }
};

func.tags = ["HealthRecordStore", "all"];
export default func;

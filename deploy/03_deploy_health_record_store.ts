import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts } = hre;
  const { deploy, get } = deployments;
  const { deployer } = await getNamedAccounts();

  const accessController = await get("AccessController");
  console.log("Deploying HealthRecordStore with account:", deployer);
  console.log("Using AccessController at:", accessController.address);

  const result = await deploy("HealthRecordStore", {
    from: deployer,
    args: [accessController.address],
    log: true,
    waitConfirmations: 1,
  });

  console.log("HealthRecordStore deployed to:", result.address);
};

func.tags = ["HealthRecordStore", "all"];
func.dependencies = ["AccessController"];
export default func;

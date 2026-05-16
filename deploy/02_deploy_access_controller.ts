import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log("Deploying AccessController with account:", deployer);

  const result = await deploy("AccessController", {
    from: deployer,
    args: [],
    log: true,
    waitConfirmations: 1,
  });

  console.log("AccessController deployed to:", result.address);
};

func.tags = ["AccessController", "all"];
func.dependencies = ["PatientRegistry"];
export default func;

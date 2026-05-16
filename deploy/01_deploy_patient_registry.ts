import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log("Deploying PatientRegistry with account:", deployer);

  const result = await deploy("PatientRegistry", {
    from: deployer,
    args: [],
    log: true,
    waitConfirmations: 1,
  });

  console.log("PatientRegistry deployed to:", result.address);
};

func.tags = ["PatientRegistry", "all"];
export default func;

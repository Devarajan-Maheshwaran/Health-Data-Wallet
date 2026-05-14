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
    waitConfirmations: hre.network.name === "hardhat" ? 1 : 5,
  });

  console.log("PatientRegistry deployed to:", result.address);

  // Verify on BscScan (skip for local)
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("Verifying on BscScan...");
    await hre.run("verify:verify", {
      address: result.address,
      constructorArguments: [],
    });
  }
};

func.tags = ["PatientRegistry", "all"];
export default func;

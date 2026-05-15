import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deploy } = hre.deployments;
  const { deployer } = await hre.getNamedAccounts();

  await deploy('AccessController', {
    from: deployer,
    args: [],
    log:  true,
    autoMine: true,
  });
};

func.tags = ['AccessController'];
func.dependencies = ['PatientRegistry'];
export default func;

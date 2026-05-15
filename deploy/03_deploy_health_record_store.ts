import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

/// @dev HealthRecordStore requires the AccessController address at construction time.
const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deploy, get } = hre.deployments;
  const { deployer } = await hre.getNamedAccounts();

  const accessController = await get('AccessController');

  await deploy('HealthRecordStore', {
    from: deployer,
    args: [accessController.address],
    log:  true,
    autoMine: true,
  });
};

func.tags = ['HealthRecordStore'];
func.dependencies = ['AccessController'];
export default func;

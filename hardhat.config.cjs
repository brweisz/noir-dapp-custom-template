require('@nomicfoundation/hardhat-toolbox-viem');
require('@nomicfoundation/hardhat-viem');
require('@nomicfoundation/hardhat-chai-matchers');

const { task } = require('hardhat/config');

const { subtask, vars } = require('hardhat/config');
const { TASK_COMPILE_SOLIDITY } = require('hardhat/builtin-tasks/task-names');
const { join, resolve } = require('path');
const { writeFile } = require('fs/promises');
const { mkdirSync, writeFileSync } = require('fs');


subtask(TASK_COMPILE_SOLIDITY).setAction(async (_, { config }, runSuper) => {
  const superRes = await runSuper();

  try {
    await writeFile(join(config.paths.root, 'artifacts', 'package.json'), '{ "type": "commonjs" }');
  } catch (error) {
    console.error('Error writing package.json: ', error);
  }

  return superRes;
});

task('node', 'Runs a local blockchain').setAction(async (_, hre, runSuper) => {
  console.log("Starting network...")
  const networkConfig = (await import(`viem/chains`))[hre.network.name];
  const config = {
    name: hre.network.name,
    networkConfig: {
      ...networkConfig,
      id: hre.network.config.chainId || networkConfig.id,
    },
  };
  mkdirSync('artifacts', { recursive: true });
  writeFileSync('artifacts/deployment.json', JSON.stringify(config), { flag: 'w' });
  await runSuper();
})

module.exports = {
  solidity: {
    compilers: [
      {
        version: '0.8.4',
        settings: {
          optimizer: { enabled: true, runs: 200 },
        },
      },
    ],
  },
  defaultNetwork: 'localhost',
  networks: {
    localhost: {
      url: 'http://127.0.0.1:8545',
      chainId: 31337,
      accounts: vars.has('localhost')
        ? [vars.get('localhost')]
        : ['0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'],
    },
    scrollSepolia: {
      url: 'https://sepolia-rpc.scroll.io',
      accounts: vars.has('scrollSepolia') ? [vars.get('scrollSepolia')] : [],
    },
    holesky: {
      url: 'https://holesky.drpc.org',
      accounts: vars.has('holesky') ? [vars.get('holesky')] : [],
    },
  },
  paths: {
    root: './',
    sources: './artifacts',
    artifacts: './artifacts/hardhat',
  },
};

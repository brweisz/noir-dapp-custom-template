import express from "express";
import Web3 from 'web3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import hardhat from 'hardhat'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const web3 = new Web3('http://localhost:8545');

async function compileContract(contractSourceCode){
  console.log("Writing file")
  // Save contract source code
  const filePath = path.join(__dirname, '/artifacts/SolidityVerifier.sol');
  console.log(filePath)
  await fs.writeFile(filePath, contractSourceCode, (err) => {
    if (err) {
      console.error('Error writing to file:', err)
    } else {
      console.log('File written successfully!');
    }
  })

  // Compile contract
  console.log("Compiling contract")
  await hardhat.run('compile');
  console.log("Contract compiled")


  /*exec('npx hardhat compile', (error, stdout, stderr) => {
    if (error) {
      console.error(`Error during compilation: ${error}`);
      throw new Error(error)
    }
    console.log(`Compilation output: ${stdout}`);
  });*/

  /*const input = {
    language: 'Solidity',
    sources: {
      'SolidityVerifier.sol': {
        content: contractSourceCode,
      },
    },
    settings: {
      viaIR: true,
      outputSelection: {
        '*': {
          '*': ['abi', 'evm.bytecode'],
        },
      },
      optimizer: {
        enabled: true,
        runs: 200
      },
    },
  };

  const output= JSON.parse(solc.compile(JSON.stringify(input)));
  console.log(output)
  const contractData = output.contracts['SolidityVerifier.sol'];
  console.log(contractData)

  if (!contractData) throw new Error("No contract data")

  const { abi, evm } = contractData['SolidityVerifier'];
  return { compiledContract: evm.bytecode.object, abi }*/
}

async function deployCompiledContract(compiledContract, abi) {
  console.log("Deploying contract")
  const accounts = await web3.eth.getAccounts();
  const contract = new web3.eth.Contract(abi);

  const deployedContract = await contract.deploy({
    data: '0x' + compiledContract,
  }).send({
    from: accounts[0],
    gas: 1500000,
    gasPrice: '30000000000',
  });

  return deployedContract.options.address
}

app.post("/compile-and-deploy-contract", async (req, res) => {
  let response = { object: undefined, errors: [] }
  try {
    let { contractSourceCode } = req.body;
    let compiledContract = await compileContract(contractSourceCode)
    let contractAddress = await deployCompiledContract(compiledContract)
    response.object = { contractAddress }
  } catch (e) {
    console.log(e)
    response.errors.push(e.message)
    // res.status(500).json({ error: 'An error occurred during compilation or deployment' })
  }
  res.send(response);
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}!`));

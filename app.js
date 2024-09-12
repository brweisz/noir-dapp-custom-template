import express from 'express';
import { writeFileSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import hardhat from 'hardhat';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

async function compileContract(contractSourceCode){
  const filePath = path.join(__dirname, '/artifacts/SolidityVerifier.sol');
  writeFileSync(filePath, contractSourceCode, (err) => {
    if (err) {
      console.error('Error writing to file:', err)
    } else {
      console.log('File written successfully!');
    }
  })

  await hardhat.run('compile');
}

/*app.post("/compile-circuit-and-generate-proof", async (req, res) => {
  let noirSourceCode = req.get("noirSourceCode");
  let inputs = req.get("inputs");
  let response = { object: undefined, errors: [] };

  try {
    // Write noir source code to file
    console.log("Writing file")
    const filePath = path.join(__dirname, '/artifacts/main.nr');

    writeFileSync(filePath, noirSourceCode, (err) => {
      if (err) {console.error('Error writing to file:', err)} else console.log('File written successfully!')})

    // The command should write the compiled circuit to a file (to use it later) and return the file and the proof
    // The compiled circuit is binary + abi
    let { proof, compiledCircuit } = await hardhat.run("generate-proof", {
      noirSourceCode,
      inputs
    });
    response.object = { proof };
  } catch (e) {
    console.log(e);
    response.errors.push(e.message);
  }
});*/

app.post("/compile-contract", async (req,res) => {
  let response = { object: undefined, errors: [] }
  try {
    let { contractSourceCode } = req.body;

    await compileContract(contractSourceCode)
    let file = readFileSync("./artifacts/hardhat/artifacts/SolidityVerifier.sol/UltraVerifier.json", "utf8")
    let json_file = JSON.parse(file)
    let contractBytecode = json_file.bytecode
    response.object = {
      contractBytecode
    }
  } catch (e) {
    console.log(e)
    response.errors.push(e.message)
  }
  res.send(response);
})

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}!`));

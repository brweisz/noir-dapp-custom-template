// @ts-nocheck

import React, { useState } from 'react';

import { useOnChainVerification } from '../hooks/useOnChainVerification.js';
import { compileCircuit, defaultCode } from '../utils/circuit.js';
import { BarretenbergBackend } from '@noir-lang/backend_barretenberg';
import { Noir } from '@noir-lang/noir_js';
import { toast } from 'react-toastify';
import { generateVerifierContract } from '../utils/generateVerifierContract.js';
import { ultraVerifierAbi } from '../utils/verifierContractABI.ts';
import { ethers } from 'ethers';
import {bytesToHex, extractInputNames} from "../utils/utils.js"
import {postCompileContract} from "../utils/apiClient.js"

export default function Component() {

  let [inputNames, setInputNames] = useState(["x", "y"])
  let [sourceCodeError, setSourceCodeError] = useState("")
  let [contractSourceCode, setContractSourceCode] = useState()
  let [contractBytecode, setContractBytecode] = useState()
  let { isConnected, connectDisconnectButton, address } = useOnChainVerification();
  const [backend, setBackend] = useState();
  let [provingArgs, setProvingArgs] = useState();
  const [currentCompiledCircuit, setCurrentCompiledCircuit] = useState();

  let [contractAddress, setContractAddress] = useState();

  const _verifyOnChain = async function() {
    if (typeof window.ethereum == null) {alert('MetaMask is not installed!');return;}
    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, ultraVerifierAbi, signer);
      let proofToSend = bytesToHex(provingArgs.proof)
      let publicInputsToSend = provingArgs.publicInputs as `0x${string}`[]
      const transaction = await contract.verify(proofToSend, publicInputsToSend);

      console.log("Transaction successful:", transaction);
    } catch (error) {
      console.error("Error making transaction:", error);
    }
  }

  const verifyOnChain = async function(){
    await toast.promise(_verifyOnChain(), {
      pending: 'Verifying proof on-chain',
      success: 'Proof verified on-chain',
      error: 'Error verifying proof on-chain',
    });
  }

  const generateProof = async (inputs: any) => {

    const noir = new Noir(currentCompiledCircuit);
    await toast.promise(noir.init, {
      pending: 'Initializing Noir...',
      success: 'Noir initialized!',
      error: 'Error initializing Noir',
    });

    const { witness } = await toast.promise(noir.execute(inputs), {
      pending: 'ACVM Executing compiledCircuit --> Generating witness',
      success: 'Witness generated',
      error: 'Error generating witness',
    });

    if (!witness) return;

    const barretenbergBackend = new BarretenbergBackend(currentCompiledCircuit, { threads: navigator.hardwareConcurrency });
    const proofData = await toast.promise(barretenbergBackend.generateProof(witness), {
      pending: 'Generating proof',
      success: 'Proof generated',
      error: 'Error generating proof',
    });
    if (!proofData) return;
    setProvingArgs(proofData)
    setBackend(barretenbergBackend)
  };

  const getSpinnerElements = () => {
    const spinner = document.getElementById('spinner')!;
    const submitBtn = document.getElementById('submit')!;
    return [submitBtn, spinner];
  };

  const deactivateSpinner = () => {
    let [submitBtn, spinner] = getSpinnerElements();
    spinner.style.display = 'none';
    submitBtn.disabled = false;
  };

  const activateSpinner = () => {
    let [submitBtn, spinner] = getSpinnerElements();
    spinner.style.display = 'inline-block';
    submitBtn.disabled = true;
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    activateSpinner();
    _submit(e).then(() => {}).catch(() => {}).finally(() => {
      deactivateSpinner();
    });
  };

  const verifyOffChain = async function(){
    await toast.promise(backend.verifyProof(provingArgs), {
      pending: 'Verifying proof off-chain',
      success: 'Proof verified off-chain',
      error: 'Error verifying proof off-chain',
    });
  }

  const _generateCircuit = async function(noirProgram: any){
    compileCircuit(noirProgram)
      .then(compiledCircuit => {
        setSourceCodeError("");
        setCurrentCompiledCircuit(compiledCircuit);
      })
      .catch(error => setSourceCodeError(error.message))
  }

  const generateCircuit = async function(e){
    let noirProgram = e.target.form.elements['noir_program'].value
    await toast.promise(_generateCircuit(noirProgram), {
      pending: 'Compiling circuit...',
      success: 'Circuit compiled',
      error: 'Error compiling circuit',
    });
  }

  const _submit = async (e: React.FormEvent<HTMLFormElement>) => {
    const elements = e.currentTarget.elements;
    let inputElements = Array.from(elements).filter(el => el.tagName == "INPUT" && el.type === 'text')
    let inputs = inputElements.reduce((acc, current) => {
      acc[current.name] = current.value;
      return acc
    }, {})

    const noirProgram = elements.namedItem('noir_program') as HTMLInputElement;
    await generateProof(inputs, noirProgram.value);
  };



  const _deployContractOnWeb = async function(abi, bytecode){
    if (typeof window.ethereum === "undefined") {alert("Please install Metamask!");return;}
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    const provider = new ethers.BrowserProvider(window.ethereum)
    const signer = await provider.getSigner();
    const factory = new ethers.ContractFactory(abi, bytecode, signer);

    const contract = await factory.deploy();
    await contract.deploymentTransaction().wait();
    let address = await contract.getAddress()
    setContractAddress(address)
    console.log("Contract deployed at:", address);
  }

  const deployContractOnWeb = async function(){
    await toast.promise(_deployContractOnWeb(ultraVerifierAbi, contractBytecode), {
      pending: 'Deploying contract from browser...',
      success: 'Verifier contract deployed',
      error: 'Error deploying verifier contract',
    });
  }

  const updateProgramSourceCode = function(e){
    let inputNames = extractInputNames(e.target.value)
    let textarea = document.getElementById("noir-program")
    if (new Set(inputNames).size !== inputNames.length) {
      textarea.classList.add("multiple-inputs-error")
    } else {
      textarea.classList.remove("multiple-inputs-error")
      setInputNames(inputNames)
    }
  }

  const generateContract = async function(){
    let contractSourceCode = await toast.promise(generateVerifierContract(currentCompiledCircuit), {
      pending: 'Generating verifier contract on browser...',
      success: 'Verifier contract generated',
      error: 'Error generating verifier contract',
    });
    setContractSourceCode(contractSourceCode)
  }

  const compileContractOnServer = async function(){
    let { contractBytecode } = await toast.promise(postCompileContract(contractSourceCode), {
      pending: 'Compiling contract on server...',
      success: 'Verifier contract compiled',
      error: 'Error compiling verifier contract',
    });
    setContractBytecode(contractBytecode)
  }

  return (
    <>
      <form className="container" onSubmit={submit}>
        <div className="header">{connectDisconnectButton}</div>
        <h2>Noir <span className="funky-typography">Playground</span></h2>
        <h4>Write you own <i>Noir</i> circuit </h4>
        <p>main.nr</p>
        <textarea className="program" name="noir_program" id="noir-program"
                  required={true}
                  defaultValue={defaultCode()}
                  onChange={updateProgramSourceCode}
        />
        {sourceCodeError && <p className="error-message">Error: {sourceCodeError}</p>}
        <button className="button prove-button" type="button" onClick={generateCircuit}>
          Generate circuit</button>
        <p>Try providing some inputs to generate a proof!</p>
        <div className="inputs">
          {inputNames.map(inputName => {
            return <input className="text-input"
                          name={`${inputName}`}
                          type="text" placeholder={`${inputName}`}
                          required={true}
                          key={`${inputName}`} />;
          })}
        </div>

        <div className="prove-options">
          <div style={{ display: 'flex' }}>
            <button className="button prove-button" type="submit" id="submit">Calculate proof</button>
            <div className="spinner-button" id="spinner"></div>
          </div>
        </div>
        <div className="actions-section">
          <div className="column-workflow">
            <button className="button verify-button" type="button" onClick={verifyOffChain}
                    disabled={!currentCompiledCircuit}>
              Verify off-chain
            </button>
          </div>
          <div className="column-workflow">
            <button className="button verify-button" type="button" onClick={generateContract}
                    disabled={!currentCompiledCircuit}>
              {contractAddress ? "Re-Generate Verifier Contract" : "Generate Verifier Contract"}
            </button>
            <button className="button verify-button" type="button" onClick={compileContractOnServer}>
              Compile contract
            </button>
            <button className="button verify-button" type="button" onClick={deployContractOnWeb}>
              Deploy contract
            </button>

            {contractAddress && <p className='contract-address'>Contract deployed in address {contractAddress}</p>}
            <button className="button verify-button" type="button" onClick={verifyOnChain}
                    disabled={!contractAddress}>
              Verify on-chain
            </button>
          </div>
        </div>
      </form>
    </>
  );
}


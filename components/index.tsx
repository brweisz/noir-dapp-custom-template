// @ts-nocheck

import React, { useState } from 'react';

import { compileCircuit, defaultCode } from '../utils/circuit.js';
import { BarretenbergBackend } from '@noir-lang/backend_barretenberg';
import { Noir } from '@noir-lang/noir_js';
import { toast } from 'react-toastify';
import { generateVerifierContract } from '../utils/generateVerifierContract.js';
import { ultraVerifierAbi } from '../utils/verifierContractABI.ts';
import {extractInputNames, extractInputsFromFormElements} from "../utils/utils.js"
import {postCompileContract} from "../utils/apiClient.js"
import { deployContractEthers, sendETHtoAccountEthers, verifyOnChainEthers } from '../utils/chainInteraction.js';
import { useOnChainVerification } from '../hooks/useOnChainVerification.js';

export default function NoirPlayground() {

  let [inputNames, setInputNames] = useState(["x", "y"])
  let [sourceCodeError, setSourceCodeError] = useState("")
  let [contractSourceCode, setContractSourceCode] = useState()
  let [contractBytecode, setContractBytecode] = useState()
  const [backend, setBackend] = useState();
  let [provingArgs, setProvingArgs] = useState();
  const [currentCompiledCircuit, setCurrentCompiledCircuit] = useState();

  let [contractAddress, setContractAddress] = useState();
  let {isConnected, address, connectDisconnectButton, chainSelector} = useOnChainVerification()

  const verifyOnChain = async function(){
    await toast.promise(verifyOnChainEthers(contractAddress, provingArgs), {
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
    return compileCircuit(noirProgram)
      .then(compiledCircuit => {
        setSourceCodeError("");
        setCurrentCompiledCircuit(compiledCircuit);
      })
      .catch(error => {
        setSourceCodeError(error.message);
        throw error
      })
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
    let { inputs } = extractInputsFromFormElements(elements);

    const noirProgram = elements.namedItem('noir_program') as HTMLInputElement;
    await generateProof(inputs, noirProgram.value);
  };

  const deployContractOnWeb = async function(){
    let address = await toast.promise(deployContractEthers(ultraVerifierAbi, contractBytecode), {
      pending: 'Deploying contract from browser...',
      success: 'Verifier contract deployed',
      error: 'Error deploying verifier contract',
    });
    setContractAddress(address)
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

  const sendETHtoAccount = async function(){
    await sendETHtoAccountEthers()
  }

  const connectWallet = async function() {

  }

  return (
    <>
      <form className="container" onSubmit={submit}>
        <div className="header">
          <button type="button" className="button verify-button" onClick={sendETHtoAccount}> Send 1 ETH</button>
          {chainSelector}
          {connectDisconnectButton}
        </div>
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
        <div className="actions-section">
          <div className="column-workflow">
            <div style={{ display: 'flex' }}>
              <button className="button verify-button" type="submit" id="submit" disabled={!currentCompiledCircuit}>Calculate proof</button>
              <div className="spinner-button" id="spinner"></div>
            </div>
            <button className="button verify-button" type="button" onClick={generateContract}
                    disabled={!currentCompiledCircuit}>
              {contractAddress ? 'Re-Generate Verifier Contract' : 'Generate Verifier Contract'}
            </button>
            <button className="button verify-button" type="button" onClick={compileContractOnServer} disabled={!contractSourceCode}>
              Compile contract
            </button>
            <button className="button verify-button" type="button" onClick={deployContractOnWeb} disabled={!contractBytecode}>
              Deploy contract
            </button>

            {contractAddress && <p className="contract-address">Contract deployed in address {contractAddress}</p>}

          </div>
          <div className="column-workflow">
            <button className="button verify-button" style={{ 'marginBottom': '120px' }} type="button" onClick={verifyOffChain}
                    disabled={!provingArgs}>
              Verify off-chain
            </button>
            <button className="button verify-button" type="button" onClick={verifyOnChain} disabled={!provingArgs || !contractAddress}>
              Verify on-chain
            </button>
          </div>
        </div>
      </form>
    </>
  );
}


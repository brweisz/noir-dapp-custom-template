// @ts-nocheck

import React, { useState } from 'react';

import { useOnChainVerification } from '../hooks/useOnChainVerification.js';
import { compileCircuit } from '../circuit/compile.js';
import { BarretenbergBackend } from '@noir-lang/backend_barretenberg';
import { Noir } from '@noir-lang/noir_js';
import { toast } from 'react-toastify';
import { generateVerifierContract } from './contract.js';
import { createUseReadContract } from 'wagmi/codegen';
import { ultraVerifierAbi } from '../hooks/verifierContractABI.ts';
import Switch from 'react-switch';
import { ethers } from 'ethers';

export default function Component() {

  let [inputNames, setInputNames] = useState(["x", "y"])
  let { isConnected, connectDisconnectButton, address } = useOnChainVerification();
  const [backend, setBackend] = useState();
  let [provingArgs, setProvingArgs] = useState();
  const [currentCompiledCircuit, setCurrentCompiledCircuit] = useState();
  let [proveOnServer, setProveOnServer] = useState(false);

  let [contractAddress, setContractAddress] = useState();

  const bytesToHex = function(arrayOfBytes: Uint8Array){
    return "0x"+Array.from(arrayOfBytes)
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join('');
  }

  const verifyOnChain = async function() {
    if (typeof window.ethereum == null) alert('MetaMask is not installed!');

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

  const generateProof = async (inputs: any, noirProgram: any) => {
    if (!inputs) return;

    const compiledCircuit = await compileCircuit(noirProgram);
    const barretenbergBackend = new BarretenbergBackend(compiledCircuit, { threads: navigator.hardwareConcurrency });
    const noir = new Noir(compiledCircuit);

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

    const proofData = await toast.promise(barretenbergBackend.generateProof(witness), {
      pending: 'Generating proof',
      success: 'Proof generated',
      error: 'Error generating proof',
    });
    if (!proofData) return;
    setProvingArgs(proofData)
    setBackend(barretenbergBackend)
    setCurrentCompiledCircuit(compiledCircuit)
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
    /*try {
      await _submit(e); //TODO: not synchronous
    } catch {
      deactivateSpinner();
    }*/
    // the same as above but asynchronous?
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

  const _submit = async (e: React.FormEvent<HTMLFormElement>) => {
    const elements = e.currentTarget.elements;
    if (!elements) return;

    let inputElements = Array.from(elements).filter(el => el.tagName == "INPUT" && el.type === 'text')
    let inputs = inputElements.reduce((acc, current) => {
      acc[current.name] = current.value;
      return acc
    }, {})

    const noirProgram = elements.namedItem('noir_program') as HTMLInputElement;
    await generateProof(inputs, noirProgram.value);
  };

  async function generateAndDeployContract(){
    console.log("Deploying")
    if (!currentCompiledCircuit) {
      console.log("Cannot generate contract because no circuit was provided")
      return;
    }
    let contractSourceCode = await generateVerifierContract(currentCompiledCircuit)
    console.log("Contract successfully created")
    console.log("Compiling and deploying contract")
    let address = await compileAndDeploy(contractSourceCode)
    setContractAddress(address)
  }

  const compileAndDeploy = async (contractSourceCode) => {
    const response = await fetch('/api/compile-and-deploy-contract', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ contractSourceCode }),
    });

    const response_data = await response.json();
    let contractAddress = response_data.object.contractAddress;
    console.log('Deployed contract address:', contractAddress);
    return contractAddress
  };

  const defaultCode = function(){
    return `fn main(x: Field, y:Field){ \n assert(x==y); \n }`
  }

  const _extractInputNames = function(programSourceCode){
    let firstLine = programSourceCode.split("\n")[0]
    let parts = firstLine.split(":")
    let inputNames = []
    for(let i = 0; i < parts.length - 1; i++){
      let partSplitted = parts[i].split(new RegExp("[ (]", 'g'))
      inputNames.push(partSplitted[partSplitted.length - 1])
    }
    return inputNames
  }

  const updateProgramSourceCode = function(e){
    let inputNames = _extractInputNames(e.target.value)
    let textarea = document.getElementById("noir-program")
    if (new Set(inputNames).size !== inputNames.length) {
      textarea.classList.add("multiple-inputs-error")
    } else {
      textarea.classList.remove("multiple-inputs-error")
      setInputNames(inputNames)
    }
  }

  return (
    <>
      <form className="container" onSubmit={submit}>
        <h2>Noir <span className="funky-typography">Playground</span></h2>
        {connectDisconnectButton}
        <h4>Write you own <i>Noir</i> circuit </h4>
        <p>main.nr</p>
        <textarea className="program" name="noir_program" id="noir-program"
                  required={true}
                  defaultValue={defaultCode()}
                  onChange={updateProgramSourceCode}
        />
        <p>Try it!</p>
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
          <div className="prove-server-options">
            <p>On browser</p>
            <Switch onChange={(checked) => setProveOnServer(checked)} checked={proveOnServer} />
            <p>On server</p>
          </div>
          <button className="button prove-button" type="submit" id="submit">Calculate proof</button>
          <div className="spinner-button" id="spinner"></div>
        </div>
        <div className="actions-section">
        <div className="column-workflow">

            <button className="button verify-button" type="button" onClick={verifyOffChain}
                    disabled={!currentCompiledCircuit}>
              Verify off-chain
            </button>
          </div>
          <div className="column-workflow">
            <button className="button verify-button" type="button" onClick={generateAndDeployContract}
                    disabled={!currentCompiledCircuit || contractAddress}> Generate Verifier Contract
            </button>

            <div className="verify-button-container">
              {contractAddress && <p className='contract-address'>Contract deployed in address {contractAddress}</p>}
              <button className="button verify-button" type="button" onClick={verifyOnChain}
                      disabled={!contractAddress}>
                Verify on-chain
              </button>
            </div>
          </div>

        </div>
      </form>
    </>
  );
}


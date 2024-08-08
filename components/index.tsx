// @ts-nocheck

import React, { useEffect, useState } from 'react';
import { useOnChainVerification } from '../hooks/useOnChainVerification.jsx';
import { compileCircuit } from '../circuit/compile.js';
import { BarretenbergBackend } from '@noir-lang/backend_barretenberg';
import { Noir } from '@noir-lang/noir_js';
import { toast } from 'react-toastify';
import deployment from '../artifacts/deployment.json';
import { useReadUltraVerifierVerify } from '../artifacts/generated.js';


export default function Component() {
  let { isConnected, connectors, connect, disconnect } = useOnChainVerification();

  // ------- WE WANT TO VERIFY ON CHAIN ---------- //
  const [backend, setBackend] = useState();
  const [args, setArgs] = useState();
  let [verificationArgs, setVerificationArgs] = useState();
  const { data, error } = useReadUltraVerifierVerify({args, query: {enabled: !!args,},});

  let connectDisconnectButton = !isConnected ?
    (
      <div style={{ padding: '20px 0' }}>
        <button type="button" key={connectors[0].uid} onClick={() => {
          connect({ connector: connectors[0], chainId: deployment.networkConfig.id });
        }}> Connect wallet
        </button>
      </div>
    ) : (
      <div>
        <button type="button" onClick={() => {
          disconnect();
        }}>Disconnect wallet
        </button>
      </div>
    );


  const generateProof = async (inputs: any) => {
    if (!inputs) return;

    const compiledCircuit = await compileCircuit(inputs.noir_program);
    const barretenbergBackend = new BarretenbergBackend(compiledCircuit, { threads: navigator.hardwareConcurrency });
    const noir = new Noir(compiledCircuit);
    deactivateSpinner();

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
    setVerificationArgs(proofData)
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
    try {
      await _submit(e);
    } catch {
      deactivateSpinner();
    }
  };

  const verifyOnChain = async function() {

  }

  const verifyOffChain = async function(){
    await toast.promise(backend.verifyProof(verificationArgs), {
      pending: 'Verifying proof off-chain',
      success: 'Proof verified off-chain',
      error: 'Error verifying proof off-chain',
    });
  }

  const _submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    activateSpinner();

    const elements = e.currentTarget.elements;
    if (!elements) return;

    const x = elements.namedItem('x') as HTMLInputElement;
    const y = elements.namedItem('y') as HTMLInputElement;
    const noir_program = elements.namedItem('noir_program') as HTMLInputElement;

    let inputs = {
      x: x.value,
      y: y.value,
      noir_program: noir_program.value,
    };

    await generateProof(inputs);
  };

  return (
    <>
      <form className="container" onSubmit={submit}>
        <h2>Example starter</h2>
        {connectDisconnectButton}
        <h4>Write you own noir circuit with <i>x</i> and <i>y</i> as input names</h4>
        <p>main.nr</p>
        <textarea className="program" name="noir_program" />
        <p>Try it!</p>
        <div className="inputs">
          <input className="text-input" name="x" type="text" placeholder="x" />
          <input className="text-input" name="y" type="text" placeholder="y" />
        </div>
        <div className="generate-proof-button-container">
          <button className="button" type="submit" id="submit">Calculate proof</button>
          <div className="spinner-button" id="spinner"></div>
        </div>
        <div className="verify-button-container">
          <button type="button" onClick={verifyOnChain}> Verify on-chain </button>
          <button type="button" onClick={verifyOffChain}> Verify off-chain </button>
        </div>
      </form>
    </>
  );
}


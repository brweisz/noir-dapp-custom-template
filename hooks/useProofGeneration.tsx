import {toast} from 'react-toastify';
import {useEffect, useState} from 'react';
import {compileCircuit} from '../circuit/compile.js';
import {BarretenbergBackend, ProofData} from '@noir-lang/backend_barretenberg';
import {Noir} from '@noir-lang/noir_js';

export function useProofGeneration(inputs?: { [key: string]: string }) {
  const [proofData, setProofData] = useState<ProofData | undefined>();
  const [backend, setBackend] = useState<BarretenbergBackend>();
  const [noir, setNoir] = useState<Noir | undefined>();

  const proofGeneration = async () => {
    if (!inputs) return;

    const compiledCircuit = await compileCircuit(inputs.noir_program);
    const backend = new BarretenbergBackend(compiledCircuit, { threads: navigator.hardwareConcurrency });
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

    const proofData = await toast.promise(backend.generateProof(witness), {
      pending: 'Generating proof',
      success: 'Proof generated',
      error: 'Error generating proof',
    });
    if (!proofData) return;

    setProofData(proofData);
    setNoir(noir);
    setBackend(backend);
  };

  useEffect(() => {
    if (!inputs) return;
    proofGeneration();
  }, [inputs]);

  return { noir, proofData, backend };
}

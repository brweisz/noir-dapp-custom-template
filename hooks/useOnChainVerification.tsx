import { ProofData } from '@noir-lang/types';
import { useAccount, useConnect, useDisconnect, useSwitchChain } from 'wagmi';
import { bytesToHex } from 'viem';
import { useEffect, useState } from 'react';
import { Id, toast } from 'react-toastify';
import { ultraVerifierAddress, useReadUltraVerifierVerify } from '../artifacts/generated.js';

export function useOnChainVerification(proofData?: ProofData) {
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { isConnected } = useAccount();
  const { chains, switchChain } = useSwitchChain();
  const [onChainToast, setOnChainToast] = useState<Id>(0);

  // Verification things
  const [args, setArgs] = useState<[`0x${string}`, `0x${string}`[]] | undefined>();
  const { data, error } = useReadUltraVerifierVerify({args, query: {enabled: !!args,},});

  useEffect(() => {
    switchChain({ chainId: chains[0].id });
    // setArgs([bytesToHex(proofData.proof), proofData.publicInputs as `0x${string}`[]]);
  }, []);

  /*useEffect(() => {
    if (data) {
      toast.update(onChainToast, {
        type: 'success',
        render: 'Proof verified on-chain!',
        isLoading: false,
        autoClose: 5000
      });
    } else if (error) {
      toast.update(onChainToast, {
        type: 'error',
        render: 'Error verifying proof on-chain!',
        isLoading: false,
      });
      console.error(error.message);
    }
  }, [data, error]);*/

  return {isConnected, connectors, connect, disconnect, switchChain, chains}

  /*if (!isConnected) {
    return (
      <div style={{ padding: '20px 0' }}>
        <button
            type="button"
          key={connectors[0].uid}
          onClick={() =>
            connect({ connector: connectors[0], chainId: deployment.networkConfig.id })
          }
        >
          Connect wallet
        </button>
      </div>
    );
  } else {
    return (
      <div>
        <button type="button" onClick={() => disconnect()}>Disconnect</button>
      </div>
    );
  }*/
}

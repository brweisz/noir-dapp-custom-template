import { ProofData } from '@noir-lang/types';
import { useAccount, useConnect, useDisconnect, useSwitchChain } from 'wagmi';
import { useEffect, useState } from 'react';

export function useOnChainVerification(proofData?: ProofData) {
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { isConnected } = useAccount();
  const { chains, switchChain } = useSwitchChain();

  useEffect(() => {
    switchChain({ chainId: chains[0].id });
  }, []);

  return {isConnected, connectors, connect, disconnect, switchChain, chains}
}

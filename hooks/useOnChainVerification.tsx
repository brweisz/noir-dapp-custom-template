import { useAccount, useConnect, useDisconnect, useSwitchChain } from 'wagmi';
import React, { useEffect, useState } from 'react';

export function useOnChainVerification() {
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { isConnected, address } = useAccount();
  const { chains, switchChain } = useSwitchChain();
  const [selectedChain, setSelectedChain] = useState();

  useEffect(() => {
    console.log('Aviable chains:', chains.map(chain => chain.name));
    // switchChain({ chainId: chains[0].id });
  }, []);

  let chainSelector = (
    <div style={{ display: 'flex', gap: '20px' }}>
      {chains.map(chain => {
        return <button type="button"
                       style={{ border: '2px solid black', textAlign: 'center', padding: '10px', width: '100px' }}
                       onClick={() => {
                         console.log("switching chain to", chain.name)
                         switchChain({ chainId: chain.id });
                       }}
        >
          {chain.name}
        </button>;
      })}
    </div>
  );

  let connectDisconnectButton = !isConnected ?
    (
      <div>
        <button type="button"
                className="button verify-button"
                key={connectors[0].uid} // Fijo, queremos que sea siempre injected
                onClick={() => {
                  connect({ connector: connectors[0] });
                }}> Connect wallet
        </button>
      </div>
    ) : (
      <div>
        <button type="button"
                className="button verify-button"
                onClick={() => {
                  disconnect();
                }}>Disconnect wallet
        </button>
      </div>
    );

  return { isConnected, address, connectDisconnectButton, chainSelector };
}

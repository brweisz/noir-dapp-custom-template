// @ts-nocheck

import React, { ReactNode, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import './App.css';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';
import NoirPlayground from './components/index.js';
import initNoirC from '@noir-lang/noirc_abi';
import initACVM from '@noir-lang/acvm_js';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { defineChain, createClient } from 'viem';
import { injected } from 'wagmi/connectors';
import { networkConfig } from "./artifacts/deployment.json"
import { mainnet, sepolia } from 'wagmi/chains'

const queryClient = new QueryClient();

// const { id, name, nativeCurrency, rpcUrls } = networkConfig;
// const dev_chain = defineChain({ id, name, nativeCurrency, rpcUrls })
const dev_chain = defineChain(networkConfig)

const config = createConfig({
  connectors: [injected()],
  chains: [dev_chain, mainnet, sepolia],
  client({ chain }) {
    return createClient({ chain, transport: http() })
  }
})


const InitWasm = ({ children }) => {
  const [init, setInit] = React.useState(false);
  useEffect(() => {
    (async () => {
      await Promise.all([
        initACVM(new URL('@noir-lang/acvm_js/web/acvm_js_bg.wasm', import.meta.url).toString()),
        initNoirC(
          new URL('@noir-lang/noirc_abi/web/noirc_abi_wasm_bg.wasm', import.meta.url).toString(),
        ),
      ]);
      setInit(true);
    })();
  });

  return <div>{init && children}</div>;
};

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {mounted && children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <Providers>
    <InitWasm>
      <NoirPlayground />
      <ToastContainer />
    </InitWasm>
  </Providers>,
);

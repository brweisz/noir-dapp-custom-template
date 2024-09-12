// @ts-nocheck

import { ethers } from 'ethers';
import { ultraVerifierAbi } from './verifierContractABI.js';
import { bytesToHex } from './utils.js';

export async function deployContractEthers(abi: any, bytecode: string){
  if (typeof window.ethereum === "undefined") {alert("Please install Metamask!");return;}
  await window.ethereum.request({ method: 'eth_requestAccounts' });
  const provider = new ethers.BrowserProvider(window.ethereum)
  const signer = await provider.getSigner();
  const factory = new ethers.ContractFactory(abi, bytecode, signer);

  const contract = await factory.deploy();
  await contract.deploymentTransaction().wait();
  let address = await contract.getAddress()
  console.log("Contract deployed at:", address);
  return address
}

export async function verifyOnChainEthers(contractAddress, provingArgs) {
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
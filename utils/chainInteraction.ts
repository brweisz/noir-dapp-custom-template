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
    throw error
  }
}

export async function sendETHtoAccountEthers(){

  if (typeof window.ethereum === "undefined") {alert("Please install Metamask!");return;}
  let recipientAddress = (await window.ethereum.request({ method: 'eth_requestAccounts' }))[0];

  const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
  const sender = await provider.getSigner(0);

  try {
    const tx = await sender.sendTransaction({
      to: recipientAddress,
      value: ethers.parseUnits('1.0', 'ether') // 1 ETH
    });

    await tx.wait();
    console.log(`Transaction successful: ${tx.hash}`);
  } catch (error) {
    console.error('Transaction failed:', error);
  }
}
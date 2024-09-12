// @ts-nocheck

import { ethers } from 'ethers';

export async function deployContractEthers(abi: any, bytecode: string){
  if (typeof window.ethereum === "undefined") {alert("Please install Metamask!");return;}
  await window.ethereum.request({ method: 'eth_requestAccounts' });
  const provider = new ethers.BrowserProvider(window.ethereum)
  const signer = await provider.getSigner();
  const factory = new ethers.ContractFactory(abi, bytecode, signer);

  const contract = await factory.deploy();
  await contract.deploymentTransaction().wait();
  let address = await contract.getAddress()
  setContractAddress(address)
  console.log("Contract deployed at:", address);
}
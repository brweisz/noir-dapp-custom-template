# noir-dapp-custom-template
This project is what its name says: a playground. Noir setup is already simple, but this website aims to make it even simpler: just enter and start writing you verifier contracts with a few clicks! The project has space still for a lot of growing. The features available right now are:
* Write a Noir program
* Fill the inputs
* Execute the program generating the circuit and the witnesses involved (in the browser)
* Generate the proof off-chain (in the browser)
* Verify the proof off-chain (in the browser)
* Generate a verifier contract (in the browser)
* Compile the verifier contract (in the server)
* Deploy the contract in the selected network 
* Verify the contract on-chain

Still, there are many possible evolution paths for this project. Some of the main ones are:
* Improve the UX 
  * In the editor
  * In the workflow
* Add more blockchains to the set of available ones
* Allow some things to happen in the server as well as the browser, mainly to avoid costly operations on the browser when needed:
  * Circuit compilation
  * Circuit execution
  * Proof generation
  * Contract generation
* Use a database and some way to recognize the user to facilitate the access to the history of deployed contracts (right now is the user's responsibility to preserve that information). 

1. Install dependencies:
```bash
nvm use 20.10.0
```
```bash
bun i # "npm i" or "yarn"
```

2. Running the app. In different terminals execute the following commands:

run a separate Ethereum node from the dev environment:
```bash
bunx hardhat node
```

run the server environment:
```bash
node --watch app.js
```

run the frontend environment:
```bash
bunx vite dev
```

3. When you're running your local hardhat network and want to deploy a contract using your Metamask account, you'll need to transfer some ETH in the network to your account. For that there's a button on the top-left of the screen. 
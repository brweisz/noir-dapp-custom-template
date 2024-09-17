# noir-dapp-custom-template
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
vite dev
```

3. When you're running your local hardhat network and want to deploy a contract using your Metamask account, you'll need to transfer some ETH in the network to your account. For that there's a button on the top-left of the screen. 
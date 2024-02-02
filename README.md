# TCQ Lobby

This is a project based on hardhat.

Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat run scripts/deploy.ts
```

# Objective

#### Develop a Solidity (On Optimism L2) contract for managing game lobbies where players can enroll by depositing 0.05 testnet ETH:

Create a lobby system where a user can enroll in a game round.

- Limit the maximum number of players to 500 per lobby.
- Implement a deposit function to accept 0.05 testnet ETH.
- Ensure proper handling of overflows (more than 500 players) and underflows (lobby cancelation).
- Maintain a record of enrolled players and their deposits.
- Bonus: Add a feature for refunding deposits if a lobby is canceled or a player withdraws before the game starts.
- Ensure ETH is stored safely in vault

## Gas Usage

![Gas Usage](https://raw.githubusercontent.com/EresDev/TCQLobby/main/docs/GasUsage.png)

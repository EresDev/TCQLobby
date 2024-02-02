import { ethers } from "hardhat";

async function main() {
  const lobby = await ethers.deployContract("TCQLobby", [
    "0xE97e3b59B9c58a691bdb40De1698Af5fF29C2D71",
    5,
  ]);

  await lobby.waitForDeployment();

  console.log("Done", await lobby.getAddress());
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

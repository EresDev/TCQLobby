import { network, ethers } from "hardhat";

export enum RoundStatus {
  STARTED,
  FINISHED,
  CANCELLED,
}

export const timeTravel = async (seconds: number) => {
  await network.provider.send("evm_increaseTime", [seconds]);
  await network.provider.send("evm_mine");
};

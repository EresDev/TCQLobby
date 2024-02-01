import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";
import { RoundStatus, timeTravel } from "./helpers";

describe("TerraconQuestLobby", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();

    const TerraconQuestLobby = await ethers.getContractFactory(
      "TerraconQuestLobby"
    );
    const lobby = await TerraconQuestLobby.deploy();

    return { lobby, owner, otherAccount };
  }

  describe("TerraconQuestLobby tests", function () {
    it("Should be at the first round", async function () {
      const { lobby } = await deployFixture();

      expect(await lobby.currentRoundNo()).to.equal(1);
    });

    it("Should revert round cancel because it is in preparation", async function () {
      const { lobby } = await deployFixture();

      await expect(lobby.cancelRound()).to.revertedWith(
        "Round is in prepartion"
      );
    });

    it("Should cancel a round after preparation", async function () {
      const { lobby } = await deployFixture();

      await timeTravel(1800);
      await lobby.cancelRound();

      expect(await lobby.roundStatus(1)).to.equal(RoundStatus.CANCELLED);
    });

    it("Should revert a round finish before finish time", async function () {
      const { lobby } = await deployFixture();

      await timeTravel(1800);

      await expect(lobby.finishRound()).to.revertedWith("Round time not ended");
    });

    it("Should finish a round after finish time", async function () {
      const { lobby } = await deployFixture();

      await timeTravel(3600);
      await lobby.finishRound();

      expect(await lobby.roundStatus(1)).to.equal(RoundStatus.FINISHED);
    });

    // describe("Events", function () {
    //   it("Should emit an event on withdrawals", async function () {
    //     const { lock, unlockTime, lockedAmount } = await loadFixture(
    //       deployOneYearLockFixture
    //     );

    //     await time.increaseTo(unlockTime);

    //     await expect(lock.withdraw())
    //       .to.emit(lock, "Withdrawal")
    //       .withArgs(lockedAmount, anyValue); // We accept any value as `when` arg
    //   });
    // });

    // describe("Transfers", function () {
    //   it("Should transfer the funds to the owner", async function () {
    //     const { lock, unlockTime, lockedAmount, owner } = await loadFixture(
    //       deployOneYearLockFixture
    //     );

    //     await time.increaseTo(unlockTime);

    //     await expect(lock.withdraw()).to.changeEtherBalances(
    //       [owner, lock],
    //       [lockedAmount, -lockedAmount]
    //     );
    //   });
    // });
  });
});

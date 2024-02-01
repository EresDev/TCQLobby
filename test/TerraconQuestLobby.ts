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

    it("Should cancel a round after preparation if lobby not full", async function () {
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

    it("Should finish a round at correct time", async function () {
      const { lobby } = await deployFixture();

      await timeTravel(3600);
      await lobby.finishRound();

      expect(await lobby.roundStatus(1)).to.equal(RoundStatus.FINISHED);
    });

    it("Should join lobby", async function () {
      const { lobby } = await deployFixture();

      await lobby.join({ value: ethers.parseEther("0.05") });

      expect(await lobby.playerCount(1)).to.equal(1);

      expect(
        await ethers.provider.getBalance(await lobby.getAddress())
      ).to.equal(ethers.parseEther("0.05"));
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

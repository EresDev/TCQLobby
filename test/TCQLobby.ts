import { expect } from "chai";
import { ethers } from "hardhat";
import { RoundStatus, timeTravel } from "./helpers";
import { parseEther } from "ethers";

describe("TCQLobby", function () {
  async function deploy() {
    // Contracts are deployed using the first signer/account by default
    const [owner, signer1, signer2, signer3, signer4, signer5, vault] =
      await ethers.getSigners();

    const TCQLobby = await ethers.getContractFactory("TCQLobby");
    const lobby = await TCQLobby.deploy(await vault.getAddress(), 5);

    return { lobby, owner, signer1, signer2, signer3, signer4, signer5, vault };
  }

  describe("Functions", function () {
    it("Should be at the first round", async function () {
      const { lobby } = await deploy();

      expect(await lobby.currentRoundNo()).to.equal(1);
    });

    it("Should revert round cancel because it is in preparation", async function () {
      const { lobby } = await deploy();

      await expect(lobby.cancelRound()).to.revertedWith(
        "Round is in prepartion"
      );
    });

    it("Should cancel a round after preparation if lobby not full", async function () {
      const { lobby } = await deploy();

      await timeTravel(1800);
      await lobby.cancelRound();

      expect(await lobby.roundStatus(1)).to.equal(RoundStatus.CANCELLED);
    });

    it("Should revert a round finish before finish time", async function () {
      const { lobby } = await deploy();

      await timeTravel(1800);

      await expect(lobby.finishRound()).to.revertedWith("Round time not ended");
    });

    it("Should finish a round at correct time", async function () {
      const { lobby } = await deploy();

      await timeTravel(3600);
      await lobby.finishRound();

      expect(await lobby.roundStatus(1)).to.equal(RoundStatus.FINISHED);
    });

    it("Should join lobby", async function () {
      const { lobby } = await deploy();

      await lobby.join({ value: ethers.parseEther("0.05") });

      expect(await lobby.playerCount(1)).to.equal(1);

      expect(
        await ethers.provider.getBalance(await lobby.getAddress())
      ).to.equal(ethers.parseEther("0.05"));
    });

    it("Should revert if already joined the lobby", async function () {
      const { lobby } = await deploy();

      await lobby.join({ value: ethers.parseEther("0.05") });

      await expect(
        lobby.join({ value: ethers.parseEther("0.05") })
      ).to.revertedWith("Already joined");

      expect(
        await ethers.provider.getBalance(await lobby.getAddress())
      ).to.equal(ethers.parseEther("0.05"));
    });

    it("Should revert join for new players when max player limit reached", async function () {
      const { lobby, signer1, signer2, signer3, signer4, signer5 } =
        await deploy();

      [signer1, signer2, signer3, signer4, signer5].forEach(async (signer) => {
        await lobby.connect(signer).join({ value: ethers.parseEther("0.05") });
      });

      await expect(
        lobby.join({ value: ethers.parseEther("0.05") })
      ).to.revertedWith("Lobby is full");
    });

    it("Should transfer eth to vault when lobby gets filled", async function () {
      const { lobby, signer1, signer2, signer3, signer4, signer5, vault } =
        await deploy();

      const vaultAddress = await vault.getAddress();
      const balanceBefore = await ethers.provider.getBalance(vaultAddress);

      await Promise.all(
        [signer1, signer2, signer3, signer4, signer5].map(async (signer) => {
          await lobby
            .connect(signer)
            .join({ value: ethers.parseEther("0.05") });
        })
      );

      const balanceAfter = await ethers.provider.getBalance(vaultAddress);
      expect(balanceAfter).to.equal(
        BigInt(balanceBefore) + parseEther("0.05") * BigInt(5)
      );
    });

    it("Should revert game play if player has not already joined", async function () {
      const { lobby, signer1: otherAccount } = await deploy();
      await timeTravel(1801);

      await expect(lobby.connect(otherAccount).play()).to.revertedWith(
        "You have not joined current round"
      );
    });

    it("Should revert unjoin if not joined", async function () {
      const { lobby, signer1 } = await deploy();

      await expect(lobby.unjoin()).to.revertedWith("Not joined");
    });

    it("Should unjoin and refund during prep time", async function () {
      const { lobby, signer1 } = await deploy();

      await lobby.join({ value: ethers.parseEther("0.05") });

      expect(await lobby.playerCount(1)).to.equal(1);

      expect(
        await ethers.provider.getBalance(await lobby.getAddress())
      ).to.equal(ethers.parseEther("0.05"));

      await lobby.unjoin();

      expect(await lobby.playerCount(1)).to.equal(0);

      expect(
        await ethers.provider.getBalance(await lobby.getAddress())
      ).to.equal(ethers.parseEther("0"));
    });

    it("Should revert unjoin after prep time", async function () {
      const { lobby, signer1 } = await deploy();

      await lobby.join({ value: ethers.parseEther("0.05") });

      await timeTravel(1801);

      await expect(lobby.unjoin()).to.revertedWith(
        "Too late, prep time passed"
      );
    });

    it("Should revert game play if not play time", async function () {
      const { lobby, signer1: otherAccount } = await deploy();
      await lobby
        .connect(otherAccount)
        .join({ value: ethers.parseEther("0.05") });

      await expect(lobby.connect(otherAccount).play()).to.revertedWith(
        "Too early, round in preps"
      );

      await timeTravel(1801);
      await expect(lobby.connect(otherAccount).play()).to.not.be.reverted;

      await timeTravel(1801);
      await expect(lobby.connect(otherAccount).play()).to.revertedWith(
        "Too late, play time ended"
      );
    });

    it("Should claim refund of a cancelled round", async function () {
      const { lobby } = await deploy();

      await lobby.join({ value: ethers.parseEther("0.05") });
      await timeTravel(1801);
      await lobby.cancelRound();

      expect(await lobby.claimRefund(1)).to.not.be.reverted;
    });

    it("Should revert claim refund of a not joined round", async function () {
      const { lobby } = await deploy();

      await timeTravel(1801);
      await lobby.cancelRound();

      await expect(lobby.claimRefund(1)).revertedWith("You did not join");
    });

    describe("Events", function () {
      it("Should emit an event on join", async function () {
        const { lobby, owner } = await deploy();

        await expect(lobby.join({ value: ethers.parseEther("0.05") }))
          .to.emit(lobby, "Joined")
          .withArgs(await owner.getAddress(), 1, ethers.parseEther("0.05"));
      });
      it("Should emit an events on unjoin", async function () {
        const { lobby, owner } = await deploy();
        await lobby.join({ value: ethers.parseEther("0.05") });

        await expect(lobby.unjoin())
          .to.emit(lobby, "Unjoined")
          .withArgs(await owner.getAddress(), 1, ethers.parseEther("0.05"));
      });

      it("Should emit refund events on unjoin", async function () {
        const { lobby, owner } = await deploy();
        await lobby.join({ value: ethers.parseEther("0.05") });

        await expect(lobby.unjoin())
          .to.emit(lobby, "Refunded")
          .withArgs(1, await owner.getAddress(), ethers.parseEther("0.05"));
      });

      it("Should emit an event on refund", async function () {
        const { lobby, owner } = await deploy();

        await lobby.join({ value: ethers.parseEther("0.05") });
        await timeTravel(1801);
        await lobby.cancelRound();

        await expect(lobby.claimRefund(1))
          .to.emit(lobby, "Refunded")
          .withArgs(1, await owner.getAddress(), ethers.parseEther("0.05"));
      });
    });
  });
});

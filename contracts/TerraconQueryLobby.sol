// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract TerraconQuestLobby {
    uint public currentRoundNo;

    enum RoundStatus {
        STARTED,
        FINISHED,
        CANCELLED
    }

    // roundNo => status
    mapping(uint => RoundStatus) public roundStatus;

    //roundNo => startTime
    mapping(uint => uint) public roundStartTime;

    uint public constant ROUND_PREPARATION_INTERVAL = 30 minutes;

    uint public constant ROUND_PLAY_INTERVAL = 30 minutes;

    uint public constant PLAYERS_COUNT_PER_LOBBY = 500;

    // roundNo => player => true/false
    mapping(uint => mapping(address => bool)) public players;

    // roundNo => count
    mapping(uint => uint) public playerCount;

    mapping(uint => bool) public cancelledRounds;

    // (cancelled)roundNo => player => true/false
    mapping(uint => mapping(address => bool)) refunds;

    constructor() {
        currentRoundNo = 1;
        roundStartTime[currentRoundNo] = block.timestamp;
    }

    // @notice previous round should either be finished or cancelled
    function startNewRound() external {
        require(
            roundStatus[currentRoundNo] == RoundStatus.FINISHED ||
                roundStatus[currentRoundNo] == RoundStatus.CANCELLED,
            "Previous round in progress"
        );
        roundStartTime[currentRoundNo + 1] = block.timestamp;
        ++currentRoundNo;
    }

    function finishRound() external {
        require(
            roundStatus[currentRoundNo] == RoundStatus.STARTED,
            "Round not started"
        );

        require(
            roundStartTime[currentRoundNo] +
                ROUND_PREPARATION_INTERVAL +
                ROUND_PLAY_INTERVAL <
                block.timestamp,
            "Round time not ended"
        );

        roundStatus[currentRoundNo] = RoundStatus.FINISHED;
    }

    function cancelRound() external {
        require(
            roundStatus[currentRoundNo] == RoundStatus.STARTED,
            "Round not started"
        );

        require(
            roundStartTime[currentRoundNo] + ROUND_PREPARATION_INTERVAL <
                block.timestamp,
            "Round is in prepartion"
        );

        require(
            playerCount[currentRoundNo] < PLAYERS_COUNT_PER_LOBBY,
            "Lobby is full"
        );

        cancelledRounds[currentRoundNo] = true;
        roundStatus[currentRoundNo] = RoundStatus.CANCELLED;
    }

    // Play

    modifier joinable() {
        require(
            roundStatus[currentRoundNo] == RoundStatus.STARTED,
            "Wait for new round"
        );
        require(
            playerCount[currentRoundNo] < PLAYERS_COUNT_PER_LOBBY,
            "Lobby is full"
        );
        _;
    }

    function join() external payable joinable {
        require(msg.value == 0.05 ether, "Invalid join fee");

        players[currentRoundNo][tx.origin] = true;
        playerCount[currentRoundNo] += 1;
    }
}

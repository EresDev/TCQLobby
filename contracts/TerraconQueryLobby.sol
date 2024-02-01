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

    uint public constant BUY_IN_FEE = 0.05 ether;

    uint public maxPlayersPerRound;

    // roundNo => player => true/false
    mapping(uint => mapping(address => bool)) public players;

    // roundNo => count
    mapping(uint => uint) public playerCount;

    mapping(uint => bool) public cancelledRounds;

    // (cancelled)roundNo => player => true/false
    mapping(uint => mapping(address => bool)) refunds;

    event Joined(address indexed player, uint256 indexed roundNo, uint fee);
    event Unjoined(
        address indexed player,
        uint256 indexed roundNo,
        uint feeRefund
    );
    event RoundStarted(uint256 indexed roundNo, address indexed byPlayer);

    constructor(uint _maxPlayersPerRound) {
        currentRoundNo = 1;
        roundStartTime[currentRoundNo] = block.timestamp;
        maxPlayersPerRound = _maxPlayersPerRound;
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

        emit RoundStarted(currentRoundNo, msg.sender);
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
            playerCount[currentRoundNo] < maxPlayersPerRound,
            "Lobby is full"
        );

        cancelledRounds[currentRoundNo] = true;
        roundStatus[currentRoundNo] = RoundStatus.CANCELLED;
    }

    // Play

    modifier joinable() {
        require(players[currentRoundNo][msg.sender] == false, "Already joined");
        require(
            roundStatus[currentRoundNo] == RoundStatus.STARTED,
            "Wait for new round"
        );
        require(
            playerCount[currentRoundNo] < maxPlayersPerRound,
            "Lobby is full"
        );
        _;
    }

    function join() external payable joinable {
        require(msg.value == BUY_IN_FEE, "Invalid join fee");

        players[currentRoundNo][msg.sender] = true;
        playerCount[currentRoundNo] += 1;

        emit Joined(msg.sender, currentRoundNo, BUY_IN_FEE);
    }

    modifier unjoinable() {
        require(players[currentRoundNo][msg.sender] == true, "Not joined");
        require(
            roundStatus[currentRoundNo] == RoundStatus.STARTED,
            "Too late to unjoin"
        );
        require(
            roundStartTime[currentRoundNo] + ROUND_PREPARATION_INTERVAL >
                block.timestamp,
            "Too late, prep time passed"
        );
        _;
    }

    function unjoin() external unjoinable {
        players[currentRoundNo][msg.sender] = false;
        playerCount[currentRoundNo] -= 1;

        payable(msg.sender).transfer(BUY_IN_FEE);

        emit Unjoined(msg.sender, currentRoundNo, BUY_IN_FEE);
    }

    modifier playable() {
        require(
            roundStatus[currentRoundNo] == RoundStatus.STARTED,
            "You have not joined current round"
        );
        require(
            roundStartTime[currentRoundNo] + ROUND_PREPARATION_INTERVAL <=
                block.timestamp,
            "Too early, round in preps"
        );
        require(
            roundStartTime[currentRoundNo] +
                ROUND_PREPARATION_INTERVAL +
                ROUND_PLAY_INTERVAL >
                block.timestamp,
            "Too late, play time ended"
        );
        _;
    }

    function play() external view playable {
        require(
            players[currentRoundNo][msg.sender] == true,
            "You have not joined current round"
        );

        // TODO: add any game play steps, e.g. look for silver mines
        // It is not done because it was not the part of the test
        // but it is expected to have some steps here
    }
}

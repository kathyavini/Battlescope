export default function createPlayer() {
  let ownBoard;
  let enemyBoard;

  const previousMoves = [];

  function makeAttack([row, col]) {
    return enemyBoard.receiveAttack([row, col]);
  }

  function assignOwnGameboard(gameboard) {
    ownBoard = gameboard;
  }

  function assignEnemyGameboard(gameboard) {
    enemyBoard = gameboard;
  }

  function aiPlay() {
    let thisMove = randomMove();

    while (playedPreviously(thisMove)) {
      thisMove = randomMove();
    }

    previousMoves.push({ move: thisMove });

    return thisMove;
  }

  function randomMove() {
    const move = [
      Math.floor(Math.random() * 10),
      Math.floor(Math.random() * 10),
    ];
    return move;
  }

  function playedPreviously(thisMove) {
    const checkMoves = previousMoves.filter(
      (turn) => turn.move[0] === thisMove[0] && turn.move[1] === thisMove[1]
    );

    if (checkMoves[0]) {
      return true;
    }
    return false;
  }

  return {
    makeAttack,
    assignOwnGameboard,
    assignEnemyGameboard,
    aiPlay,
    get ownBoard() {
      return ownBoard;
    },
    get enemyBoard() {
      return enemyBoard;
    },
    get previousMoves() {
      return [...previousMoves];
    },
  };
}

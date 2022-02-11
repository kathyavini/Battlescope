export default function createPlayer() {
  let enemyBoard;

  let previousMoves = [];
  let shipHistory = ''; // for AI conditionals

  const aiMode = {
    columnAxis: true,
    posDirection: true,
  };

  function assignEnemyGameboard(gameboard) {
    enemyBoard = gameboard;
  }

  function makeAttack([row, col]) {
    return enemyBoard.receiveAttack([row, col]);
  }

  function aiPlay() {
    let thisMove = randomMove();

    while (playedPreviously(thisMove)) {
      thisMove = randomMove();
    }

    previousMoves.push({ move: thisMove });

    return thisMove;
  }

  function aiSmartPlay() {
    let thisMove;

    if (previousMoves[0]) {
      evaluateLastMove();

      thisMove = smartMove();

      while (playedPreviously(thisMove)) {
        const previousResult = playedPreviously(thisMove);

        previousMoves.push({ move: thisMove, result: previousResult });

        thisMove = smartMove();
      }
    } else {
      thisMove = randomMove();

      while (playedPreviously(thisMove)) {
        thisMove = randomMove();
      }
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
      if (checkMoves[0].result) {
        // smart AI
        return checkMoves[0].result;
      } else {
        // random AI; original unit tests
        return true;
      }
    }
    return false;
  }

  function evaluateLastMove() {
    const lastMove = previousMoves[previousMoves.length - 1].move;

    // Check this location on the enemy gameboard
    const foundResult = enemyBoard.boardArray[lastMove[0]][lastMove[1]];

    // And store the result in previousMove array
    previousMoves[previousMoves.length - 1].result = foundResult;
  }

  function smartMove() {
    let nextMove;
    let lastMove = previousMoves[previousMoves.length - 1];

    if (lastMove.result === 'sunk') {
      // Reset/clear after a ship is sunk
      shipHistory = '';

      aiMode.columnAxis = true;
      aiMode.posDirection = true;

      return randomMove();
    }

    // Add to hit/miss history for this particular attacked ship
    if (shipHistory[0] === 'h' || lastMove.result === 'hit') {
      shipHistory = shipHistory + lastMove.result[0];
    }

    // Variables for referencing previous moves
    // const moves = ['current', 'last', 'secondLast', 'thirdLast', 'fourthLast', 'fifthLast']
    let secondLast;
    let thirdLast;
    let fourthLast;
    let fifthLast;

    const totalMoves = previousMoves.length;

    if (shipHistory.length >= 5) {
      fifthLast = previousMoves[totalMoves - 5];
    }
    if (shipHistory.length >= 4) {
      fourthLast = previousMoves[totalMoves - 4];
    }
    if (shipHistory.length >= 3) {
      thirdLast = previousMoves[totalMoves - 3];
    }
    if (shipHistory.length >= 2) {
      secondLast = previousMoves[totalMoves - 2];
    }

    // if last move was successful, carry on
    if (lastMove.result === 'hit') {
      nextMove = moveAccordingToMode(lastMove.move);

      // Unless there are boundary issues
      if (outOfBounds(nextMove) && shipHistory === 'hmhh') {
        adjustForBounds(nextMove);
        nextMove = moveAccordingToMode(fourthLast.move);
      } else if (outOfBounds(nextMove) && shipHistory === 'hmh') {
        adjustForBounds(nextMove);
        nextMove = moveAccordingToMode(thirdLast.move);
      } else if (outOfBounds(nextMove) && shipHistory === 'hm') {
        adjustForBounds(nextMove);
        nextMove = moveAccordingToMode(secondLast.move);
      } else if (outOfBounds(nextMove)) {
        //simple case
        adjustForBounds(nextMove);
        nextMove = moveAccordingToMode(lastMove.move);
      }
      return nextMove;
    }

    // This gets complicated
    if (fifthLast && fifthLast.result === 'hit') {
      // Current axis must be correct; switch direction
      aiMode.posDirection = !aiMode.posDirection;
      nextMove = moveAccordingToMode(fifthLast.move);

      if (outOfBounds(nextMove)) {
        adjustForBounds(nextMove);
        nextMove = moveAccordingToMode(fifthLast.move);
      }
      return nextMove;
    }

    if (fourthLast && fourthLast.result === 'hit') {
      // Current axis must be correct; switch direction
      aiMode.posDirection = !aiMode.posDirection;
      nextMove = moveAccordingToMode(fourthLast.move);

      if (outOfBounds(nextMove)) {
        adjustForBounds(nextMove);
        nextMove = moveAccordingToMode(fourthLast.move);
      }
      return nextMove;
    }

    if (thirdLast && shipHistory === 'hmm') {
      // Either axis or direction needs to be switched
      if (aiMode.columnAxis) {
        // i.e. no boundary hitting
        aiMode.columnAxis = !aiMode.columnAxis;
      } else {
        aiMode.posDirection = !aiMode.posDirection;
      }

      nextMove = moveAccordingToMode(thirdLast.move);

      if (outOfBounds(nextMove)) {
        adjustForBounds(nextMove);
        nextMove = moveAccordingToMode(thirdLast.move);
      }

      return nextMove;
    }

    if (secondLast && secondLast.result === 'hit') {
      // switch direction at the outset
      if (aiMode.columnAxis && aiMode.posDirection) {
        aiMode.posDirection = false;
        nextMove = moveAccordingToMode(secondLast.move);
      } else {
        // already switched direction
        aiMode.columnAxis = false; // now switch axis
        nextMove = moveAccordingToMode(secondLast.move);
      }

      if (outOfBounds(nextMove)) {
        adjustForBounds(nextMove);
        nextMove = moveAccordingToMode(secondLast.move);
      }
      return nextMove;
    }

    // If not successful, reset
    shipHistory = '';
    aiMode.columnAxis = true;
    aiMode.posDirection = true;
    return randomMove();
  }

  function moveAccordingToMode([row, column]) {
    if (aiMode.columnAxis && aiMode.posDirection) {
      return [row + 1, column];
    } else if (aiMode.columnAxis) {
      return [row - 1, column];
    } else if (aiMode.posDirection) {
      return [row, column + 1];
    } else {
      return [row, column - 1];
    }
  }

  function outOfBounds([row, column]) {
    if (row > 9 || row < 0 || column > 9 || column < 0) {
      return true;
    }
  }

  function adjustForBounds([row, column]) {
    if (row > 9 && aiMode.columnAxis === true) {
      aiMode.posDirection = false;
    } else if (row < 0) {
      // only possible if direction already switched
      aiMode.columnAxis = false;
    } else if (column < 0) {
      aiMode.posDirection = true;
    }
  }

  return {
    makeAttack,
    assignEnemyGameboard,
    aiPlay,
    aiSmartPlay,
    // Everything below is internal and was used only for testing
    get enemyBoard() {
      return enemyBoard;
    },
    get previousMoves() {
      return [...previousMoves];
    },
    // Only for testing would these ever be set
    set previousMoves(historyArray) {
      previousMoves = historyArray;
    },
    aiMode,
    set shipHistory(string) {
      shipHistory = string;
    },
  };
}

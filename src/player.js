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

    // First move
    if (!previousMoves[0]) {
      thisMove = randomMove();
      // All subsequent
    } else {
      evaluateLastMove();

      thisMove = smartMove();

      while (playedPreviously(thisMove)) {
        if (shipHistory) {
          const previousResult = queryPreviousResult(thisMove);
          // Within the deterministic attack sequence, any previously played move is recorded again as if it is being played now so the sequence can continue
          previousMoves.push({ move: thisMove, result: previousResult });
        }
        thisMove = smartMove();
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

    if (checkMoves[0]) return true;

    return false;
  }

  function queryPreviousResult(thisMove) {
    const checkMoves = previousMoves.filter(
      (turn) => turn.move[0] === thisMove[0] && turn.move[1] === thisMove[1]
    );

    return checkMoves[0].result;
  }

  function evaluateLastMove() {
    const lastMove = previousMoves[previousMoves.length - 1].move;

    // Result is read off of the enemy gameboard
    const foundResult = enemyBoard.boardArray[lastMove[0]][lastMove[1]];

    // And stored in the previousMove array
    previousMoves[previousMoves.length - 1].result = foundResult;
  }

  function smartMove() {
    let nextMove;
    let lastMove = previousMoves[previousMoves.length - 1];

    // Reset after a ship is sunk
    if (lastMove.result === 'sunk') {
      shipHistory = '';

      aiMode.columnAxis = true;
      aiMode.posDirection = true;

      return randomMove();
    }

    // Attack sequence history begins with the first hit on a new ship
    if (shipHistory[0] === 'h' || lastMove.result === 'hit') {
      shipHistory = shipHistory + lastMove.result[0];
    }

    // If no history, a ship has not been discovered yet
    if (!shipHistory) return randomMove();


    let [secondLast, thirdLast, fourthLast, fifthLast] =
      definePreviousMoveVariables();

    /* Conditional logic for Deterministic AI */
    // Second parameter in the following functions is the previous move in reference to which the next move should be made

    if (lastMove.result === 'hit') {
      nextMove = continueSamePath(lastMove);

      // If hitting a boundary, calculate correct move to backtrack from
      if (outOfBounds(nextMove)) {
        let referenceMove;
        switch (shipHistory) {
          case 'hmhh':
            referenceMove = fourthLast.move;
            break;
          case 'hmh':
            referenceMove = thirdLast.move;
            break;
          default:
            referenceMove = lastMove.move;
        }
        switchDirectionAtEdges(nextMove);
        nextMove = moveAccordingToMode(referenceMove);
      }

      return nextMove;
    }

    if (fifthLast && fifthLast.result === 'hit') {
      return keepAxisSwitchDirection(nextMove, fifthLast);
    }
    if (fourthLast && fourthLast.result === 'hit') {
      return keepAxisSwitchDirection(nextMove, fourthLast);
    }
    if (thirdLast && shipHistory === 'hmm') {
      return switchAxisOrDirection(nextMove, thirdLast);
    }
    if (secondLast && secondLast.result === 'hit') {
      return switchAxisOrDirection(nextMove, secondLast);
    }

    // A failsafe reset for encountering a condition not listed above (should not be called)
    console.log('None of the above conditions apply');
    shipHistory = '';
    aiMode.columnAxis = true;
    aiMode.posDirection = true;

    return randomMove();
  }

  /* smartMove Helper Functions */
  function definePreviousMoveVariables() {
    let secondLast;
    let thirdLast;
    let fourthLast;
    let fifthLast;

    if (shipHistory.length >= 5) {
      fifthLast = previousMoves[previousMoves.length - 5];
    }
    if (shipHistory.length >= 4) {
      fourthLast = previousMoves[previousMoves.length - 4];
    }
    if (shipHistory.length >= 3) {
      thirdLast = previousMoves[previousMoves.length - 3];
    }
    if (shipHistory.length >= 2) {
      secondLast = previousMoves[previousMoves.length - 2];
    }

    return [secondLast, thirdLast, fourthLast, fifthLast];
  }

  function continueSamePath(lastMove) {
    return moveAccordingToMode(lastMove.move);
  }

  function keepAxisSwitchDirection(nextMove, referenceMove) {
    aiMode.posDirection = !aiMode.posDirection;
    nextMove = moveAccordingToMode(referenceMove.move);

    if (outOfBounds(nextMove)) {
      switchDirectionAtEdges(nextMove);
      nextMove = moveAccordingToMode(referenceMove.move);
    }

    return nextMove;
  }

  function switchAxisOrDirection(nextMove, referenceMove) {
    if (aiMode.columnAxis && aiMode.posDirection) {
      // initial switch upon first miss should be of direction
      aiMode.posDirection = !aiMode.posDirection;
    } else if (aiMode.columnAxis && !aiMode.posDirection) {
      // if direction is already switched row axis should be started
      aiMode.columnAxis = !aiMode.columnAxis;
      // If ship then missed to side, switch direction
    } else if (!aiMode.columnAxis && !aiMode.posDirection) {
      !aiMode.posDirection;
    }

    nextMove = moveAccordingToMode(referenceMove.move);

    if (outOfBounds(nextMove)) {
      switchDirectionAtEdges(nextMove);
      nextMove = moveAccordingToMode(referenceMove.move);
    }

    return nextMove;
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

  function switchDirectionAtEdges([row, column]) {
    if (row > 9 && aiMode.columnAxis === true) {
      aiMode.posDirection = false;
    } else if (row < 0 && column == 0) {
      // ONLY happens with horizontal ship in top right corner
      aiMode.columnAxis = false;
      aiMode.posDirection = true;
    }else if (row < 0) {
      // if direction has already been switched
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

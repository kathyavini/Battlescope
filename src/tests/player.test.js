import createPlayer from '../player';

test('Factory creates object with method makeAttack', () => {
  expect(createPlayer()).toHaveProperty('makeAttack');
});

const testPlayer = createPlayer();
const mockEnemyBoard = {
  receiveAttack: ([row, column]) =>
    `Enemy board received attack at row ${row}, column ${column}`,
};

test('Player object assigns reference to enemy gameboard', () => {
  testPlayer.assignEnemyGameboard(mockEnemyBoard);
  expect(testPlayer.enemyBoard.receiveAttack([6, 5])).toBe(
    'Enemy board received attack at row 6, column 5'
  );
});

test('Player object can attack enemy gameboard', () => {
  testPlayer.assignEnemyGameboard(mockEnemyBoard);
  expect(testPlayer.makeAttack([8, 8])).toBe(
    'Enemy board received attack at row 8, column 8'
  );
});

describe('Random aiPlay', () => {
  test('AI should return move within bounds of board', () => {
    let aiMoveHistory = [];
    const aiMove = testPlayer.aiPlay();
    expect(aiMove[0]).toBeGreaterThanOrEqual(0);
    expect(aiMove[0]).toBeLessThanOrEqual(9);
    expect(aiMove[1]).toBeGreaterThanOrEqual(0);
    expect(aiMove[1]).toBeLessThanOrEqual(9);

    aiMoveHistory.push({ move: aiMove });
  });

  test('AI should keep record of previous moves', () => {
    let repeatedMoveHistory = [];
    const newPlayer = createPlayer();
    for (let i = 0; i < 5; i++) {
      const thisMove = newPlayer.aiPlay();
      repeatedMoveHistory.push({ move: thisMove });
    }
    expect(newPlayer.previousMoves).toEqual(repeatedMoveHistory);
  });

  test('AI should not repeat moves', () => {
    let repeatedMoveHistory = [];
    let checkMoveHistory = []; // array of repeats
    const newPlayer = createPlayer();
    let moveRepeated = false;
    let i = 0;

    while (!moveRepeated && i < 100) {
      const thisMove = newPlayer.aiPlay();

      const checkMoves = repeatedMoveHistory.filter((turn) => {
        return turn.move[0] === thisMove[0] && turn.move[1] === thisMove[1];
      });
      if (checkMoves[0]) {
        checkMoveHistory.push(checkMoves);
        moveRepeated = true;
      }
      repeatedMoveHistory.push({ move: thisMove });
      i++;
    }
    expect(checkMoveHistory[0]).toBeUndefined();
  });
});

// AI LOGIC WHEN ENCOUNTERING SHIPS
describe('Deterministic aiSmartPlay', () => {
  const mockBoardHistory = {
    boardArray: Array(10)
      .fill(null)
      .map((x) => Array(10).fill(null)),
  };

  function updateMockBoard(mockMoveHistory) {
    for (const turn of mockMoveHistory) {
      mockBoardHistory.boardArray[turn.move[0]][turn.move[1]] = turn.result;
    }
  }

  function generatePlayer(mockHistory, mockBoard) {
    const player = createPlayer();
    player.assignEnemyGameboard(mockBoard);
    player.previousMoves = mockHistory;

    // For later tests with more branching, the AI updates a string with all results since first hit for the current ship being attacked
    let historyString = mockHistory
      .slice(0, -1)
      .map((x) => x.result[0])
      .join('');

    // These strings start with first hit, but some of the move history arrays below include previous misses
    while (historyString[0] === 'm') {
      historyString = historyString.slice(1);
    }
    player.shipHistory = historyString;

    return player;
  }

  test('Continues down column after first hit', () => {
    const mockMoveHistory = [{ move: [1, 2], result: 'hit' }];
    updateMockBoard(mockMoveHistory);

    const smartPlayer = generatePlayer(mockMoveHistory, mockBoardHistory);

    expect(smartPlayer.aiSmartPlay()).toEqual([2, 2]);
  });

  test('Tries other direction if a hit is followed by a miss', () => {
    const mockMoveHistory = [
      { move: [1, 2], result: 'hit' },
      { move: [2, 2], result: 'miss' },
    ];
    updateMockBoard(mockMoveHistory);

    const smartPlayer = generatePlayer(mockMoveHistory, mockBoardHistory);

    const thisMove = smartPlayer.aiSmartPlay();
    expect(thisMove).toEqual([0, 2]);
  });

  test('Changes direction if hits bottom board boundary', () => {
    const mockMoveHistory = [{ move: [9, 2], result: 'hit' }];
    updateMockBoard(mockMoveHistory);

    const smartPlayer = generatePlayer(mockMoveHistory, mockBoardHistory);

    const thisMove = smartPlayer.aiSmartPlay();
    expect(thisMove).toEqual([8, 2]);
  });

  test('Changes axis if hits top board boundary', () => {
    const mockMoveHistory = [
      { move: [0, 2], result: 'hit' },
      { move: [1, 2], result: 'miss' },
    ];
    updateMockBoard(mockMoveHistory);

    const smartPlayer = generatePlayer(mockMoveHistory, mockBoardHistory);

    const thisMove = smartPlayer.aiSmartPlay();
    expect(thisMove).toEqual([0, 1]);
  });

  test('If succeeding, continues on same axis', () => {
    const mockMoveHistory = [
      { move: [0, 2], result: 'hit' },
      { move: [1, 2], result: 'miss' },
      { move: [0, 1], result: 'hit' },
    ];
    updateMockBoard(mockMoveHistory);

    const smartPlayer = generatePlayer(mockMoveHistory, mockBoardHistory);

    smartPlayer.aiMode.columnAxis = false;
    smartPlayer.aiMode.posDirection = false;

    const thisMove = smartPlayer.aiSmartPlay();
    expect(thisMove).toEqual([0, 0]);
  });

  test('If hits twice but then misses, keeps axis', () => {
    const mockMoveHistory = [
      { move: [0, 2], result: 'hit' },
      { move: [1, 2], result: 'miss' },
      { move: [0, 1], result: 'hit' },
      { move: [0, 0], result: 'miss' },
    ];
    updateMockBoard(mockMoveHistory);

    const smartPlayer = generatePlayer(mockMoveHistory, mockBoardHistory);

    // Logged from test above
    smartPlayer.aiMode.columnAxis = false;
    smartPlayer.aiMode.posDirection = false;

    const thisMove = smartPlayer.aiSmartPlay();
    expect(thisMove).toEqual([0, 3]);
  });

  test('If hits three times but then misses, keeps axis, even if hitting boundary', () => {
    const mockMoveHistory = [
      { move: [0, 2], result: 'hit' },
      { move: [1, 2], result: 'miss' },
      { move: [0, 1], result: 'hit' },
      { move: [0, 0], result: 'hit' },
    ];
    updateMockBoard(mockMoveHistory);

    const smartPlayer = generatePlayer(mockMoveHistory, mockBoardHistory);

    smartPlayer.aiMode.columnAxis = false;
    smartPlayer.aiMode.posDirection = false;

    const thisMove = smartPlayer.aiSmartPlay();

    expect(thisMove).toEqual([0, 3]);
  });

  test('If hits boundary after two hits, maintains axis and switches direction', () => {
    const mockMoveHistory = [
      { move: [0, 1], result: 'hit' },
      { move: [1, 1], result: 'miss' },
      { move: [0, 0], result: 'hit' },
    ];
    updateMockBoard(mockMoveHistory);

    const smartPlayer = generatePlayer(mockMoveHistory, mockBoardHistory);

    smartPlayer.aiMode.columnAxis = false;
    smartPlayer.aiMode.posDirection = false;

    const thisMove = smartPlayer.aiSmartPlay();

    expect(thisMove).toEqual([0, 2]);
  });

  test('If runs into previously played position, records the result as a turn and continues the sequence', () => {
    const mockMoveHistory = [
      { move: [3, 4], result: 'miss' },
      { move: [4, 4], result: 'hit' },
      { move: [5, 4], result: 'miss' },
    ];
    updateMockBoard(mockMoveHistory);

    const smartPlayer = generatePlayer(mockMoveHistory, mockBoardHistory);

    smartPlayer.aiMode.columnAxis = true;
    smartPlayer.aiMode.posDirection = true;

    const thisMove = smartPlayer.aiSmartPlay();

    expect(thisMove).toEqual([4, 3]);
  });

  test('Follows up on three previous hits even if encountering a boundary', () => {
    const mockMoveHistory = [
      { move: [9, 5], result: 'hit' },
      { move: [8, 5], result: 'miss' },
      { move: [9, 4], result: 'hit' },
      { move: [9, 3], result: 'hit' },
      { move: [9, 2], result: 'miss' },
    ];

    updateMockBoard(mockMoveHistory);

    const smartPlayer = generatePlayer(mockMoveHistory, mockBoardHistory);

    smartPlayer.aiMode.columnAxis = false;
    smartPlayer.aiMode.posDirection = false;

    const thisMove = smartPlayer.aiSmartPlay();

    expect(thisMove).toEqual([9, 6]);
  });

  test('Follows up on four previous hits even if encountering a boundary', () => {
    const mockMoveHistory = [
      { move: [9, 5], result: 'hit' },
      { move: [8, 5], result: 'miss' },
      { move: [9, 4], result: 'hit' },
      { move: [9, 3], result: 'hit' },
      { move: [9, 2], result: 'hit' },
      { move: [9, 1], result: 'miss' },
    ];
    updateMockBoard(mockMoveHistory);

    const smartPlayer = generatePlayer(mockMoveHistory, mockBoardHistory);

    smartPlayer.aiMode.columnAxis = false;
    smartPlayer.aiMode.posDirection = false;

    const thisMove = smartPlayer.aiSmartPlay();

    expect(thisMove).toEqual([9, 6]);
  });

  // This case produced an uncaught exception in actual play 
  test('Can handle corner case', () => {
    const mockMoveHistory = [
      { move: [0, 0], result: 'hit' },
      { move: [1, 0], result: 'miss' },
    ];

    updateMockBoard(mockMoveHistory);

    const smartPlayer = generatePlayer(mockMoveHistory, mockBoardHistory);

    smartPlayer.aiMode.columnAxis = true;
    smartPlayer.aiMode.posDirection = true;

    const thisMove = smartPlayer.aiSmartPlay();

    expect(thisMove).toEqual([0, 1]);
  })
});

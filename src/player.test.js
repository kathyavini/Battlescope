import { createPlayer } from './player';

test('Factory creates object with method makeAttack', () => {
  expect(createPlayer()).toHaveProperty('makeAttack');
});

const testPlayer = createPlayer();
const mockEnemyBoard = {
  receiveAttack: ([row, column]) =>
    `Enemy board received attack at row ${row}, column ${column}`,
};
const mockOwnBoard = {
  receiveAttack: ([row, column]) =>
    `Own board received attack at row ${row}, column ${column}`,
};

test('Player object assigns reference to own gameboard', () => {
  testPlayer.assignOwnGameboard(mockOwnBoard);
  expect(testPlayer.ownBoard.receiveAttack([4, 5])).toBe(
    'Own board received attack at row 4, column 5'
  );
});

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

test('AI should return move within bounds of board', () => {
  let aiMoveHistory = [];
  const aiMove = testPlayer.aiPlay();
  expect(aiMove[0]).toBeGreaterThanOrEqual[0];
  expect(aiMove[0]).toBeLessThanOrEqual[9];
  expect(aiMove[1]).toBeGreaterThanOrEqual[0];
  expect(aiMove[1]).toBeLessThanOrEqual[9];

  aiMoveHistory.push({ move: aiMove });
});

test('AI should keep record of previous moves', () => {
  let repeatedMoveHistory = [];
  const newPlayer = createPlayer();
  for (let i = 0; i < 5; i++) {
    const thisMove = newPlayer.aiPlay();
    repeatedMoveHistory.push({ move: thisMove });
  }
  console.log(repeatedMoveHistory);
  console.log(newPlayer.previousMoves);
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
        checkMoveHistory.push(checkMoves)
        moveRepeated = true;
    }
    repeatedMoveHistory.push({ move: thisMove });
    i++;
  }

//   console.log(repeatedMoveHistory);
//   console.log(newPlayer.previousMoves);

  expect(checkMoveHistory[0]).toBeUndefined();
});

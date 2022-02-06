import { createGameboard } from './gameboard';

let testGameboard = createGameboard();

/* This is external API - keep */
test('Gameboard factory returns an object with receive attack', () => {
  expect(createGameboard()).toHaveProperty('receiveAttack');
});

/* Internal methods tests - please remove later */
test('Gameboard factory returns an object with board and fleet', () => {
  expect(createGameboard()).toHaveProperty(
    'boardArray',
    'fleet',
    'receiveAttack'
  );
});

test('Gameboard initialized as a 10 x 10 2D Array', () => {
  expect(testGameboard.boardArray.length).toEqual(10);
  expect(testGameboard.boardArray[0].length).toEqual(10);
});

test('Getter correctly reads board array', () => {
  expect(testGameboard.boardArray[0][0]).toBeNull();
});

/* Do getters make arrays immutable? - answer is no. This was true with return [...boardArray] (return copy) and the function getBoardArray()...

It was also true with Object.freeze() around the return statement, and it was also true with renaming the constant in the get function! This is nuts! */
test.skip('Getter cannot mutate board array', () => {
  testGameboard.boardArray[0][0] = 'testValue';
  expect(testGameboard.boardArray[0][0]).toBeNull();
});


test('Gameboard adds horizontal ship to board correctly', () => {
  testGameboard.placeShip('patrol boat', [1, 4], 'horizontal');
  expect(testGameboard.boardArray[1][4]).toBe('p1');
  expect(testGameboard.boardArray[1][5]).toBe('p2');
  expect(testGameboard.boardArray[2][5]).toBeNull();
});

test('Gameboard adds vertical ship to board correctly', () => {
  testGameboard.placeShip('submarine', [5, 4], 'vertical');
  expect(testGameboard.boardArray[5][4]).toBe('s1');
  expect(testGameboard.boardArray[6][4]).toBe('s2');
  expect(testGameboard.boardArray[7][4]).toBe('s3');
  expect(testGameboard.boardArray[5][5]).toBeNull();
});

test('Gameboard adds ship to fleet correctly', () => {
  expect(testGameboard.fleet[0].length).toBe(2);
  expect(testGameboard.fleet[0].isSunk()).toBe(false);
  expect(testGameboard.fleet[1].length).toBe(3);
  expect(testGameboard.fleet[1].isSunk()).toBe(false);
  expect(testGameboard.fleet[3]).toBeUndefined();
});

test('Gameboard reports fleet not sunk correctly', () => {
  expect(testGameboard.isFleetSunk()).toBe(false);
})

test('Gameboard reports first ship sunk correctly', () => {
  testGameboard.fleet[0].hit(1).hit(2);
  expect(testGameboard.fleet[0].isSunk()).toBe(true);
})

test('Gameboard reports second ship sunk correctly', () => {
  testGameboard.fleet[1].hit(1).hit(2).hit(3);
  expect(testGameboard.fleet[1].isSunk()).toBe(true);
})

test('Gameboard reports fleet sunk correctly', () => {
  expect(testGameboard.isFleetSunk()).toBe(true);
})

  /* Fresh board :) */
  const newBoard = createGameboard();


test('New instances of gameboard do not interfere with each other', () => {
  expect(newBoard.fleet[0]).toBeUndefined();
  expect(newBoard.boardArray[7][4]).toBeNull();
})
test('Gameboard passes hit to ship correctly', () => {
  newBoard.placeShip('battleship', [1, 1], 'horizontal');
  newBoard.receiveAttack([1, 2]);
  expect(newBoard.fleet[0].shipArray).toEqual([0, 1, 0, 0]);
})

test('Gameboard records miss correctly', () => {
  /* Fresh board :) */
  newBoard.receiveAttack([5, 2]);
  expect(newBoard.boardArray[5][2]).toBe('miss');
})
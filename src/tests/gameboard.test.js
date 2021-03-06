import createGameboard from '../gameboard';

const testGameboard = createGameboard();

test('Gameboard initialized as a 10 x 10 2D Array', () => {
  expect(testGameboard.boardArray.length).toEqual(10);
  expect(testGameboard.boardArray[0].length).toEqual(10);
});

test('Getter correctly reads board array', () => {
  expect(testGameboard.boardArray[0][0]).toBeNull();
});

test('Getter cannot mutate board array', () => {
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

test('Getter cannot mutate fleet', () => {
  testGameboard.fleet.push({ name: 'fake ship' });
  expect(testGameboard.fleet[3]).toBeUndefined();
});

test('Gameboard reports fleet not sunk correctly', () => {
  expect(testGameboard.isFleetSunk()).toBe(false);
});

test('Gameboard reports first ship sunk correctly', () => {
  testGameboard.fleet[0].hit(1).hit(2);
  expect(testGameboard.fleet[0].isSunk()).toBe(true);
});

test('Gameboard reports second ship sunk correctly', () => {
  testGameboard.fleet[1].hit(1).hit(2).hit(3);
  expect(testGameboard.fleet[1].isSunk()).toBe(true);
});

test('Gameboard reports fleet sunk correctly', () => {
  expect(testGameboard.isFleetSunk()).toBe(true);
});

const newBoard = createGameboard();

test('New instances of gameboard do not interfere with each other', () => {
  expect(newBoard.fleet[0]).toBeUndefined();
  expect(newBoard.boardArray[7][4]).toBeNull();
  expect(testGameboard.boardArray[7][4]).toBe('s3');
});

test('Gameboard passes hit to ship correctly', () => {
  newBoard.placeShip('battleship', [1, 1], 'horizontal');
  newBoard.receiveAttack([1, 2]);
  expect(newBoard.fleet[0].shipArray).toEqual([0, 1, 0, 0]);
});

test('Gameboard records miss correctly', () => {
  newBoard.receiveAttack([5, 2]);
  expect(newBoard.boardArray[5][2]).toBe('miss');
});

describe('Legal placement of ships', () => {
  const shipTestBoard = createGameboard();
  test('placeShip() throws error if ship is placed out of bounds horizontally', () => {
    expect(() => {
      shipTestBoard.placeShip('battleship', [0, 9], 'horizontal');
    }).toThrow('Ship outside bounds of board');
  });

  test('placeShip() throws error if ship is placed out of bounds vertically', () => {
    expect(() => {
      shipTestBoard.placeShip('destroyer', [9, 0], 'vertical');
    }).toThrow('Ship outside bounds of board');
  });

  shipTestBoard.placeShip('destroyer', [0, 0], 'vertical');
  test('placeShip() throws error if ship is adjacent to another ship', () => {
    expect(() => {
      shipTestBoard.placeShip('battleship', [0, 1], 'vertical');
    }).toThrow('Ship adjacent to another ship');
  });

  test('placeShip() throws no error on legal placement of ship', () => {
    expect(() => {
      shipTestBoard.placeShip('battleship', [0, 2], 'vertical');
    }).not.toThrow();
  });
});

describe('Random placement of fleet', () => {
  const randomPlacementBoard = createGameboard();

  test('placeAllShipRandomly() creates a fleet of exactly one of each kind of ship', () => {
    randomPlacementBoard.placeAllShipsRandomly();
    expect(randomPlacementBoard.fleet.length).toBe(5);
  });
});

describe.only('Drag and drop helper functions', () => {
  const dragDropBoard = createGameboard();

  test('clearShipFromBoard removes the correct ship from array', () => {
    dragDropBoard.placeAllShipsRandomly();
    dragDropBoard.clearShipFromBoard('battleship');
    const foundShips = [];
    dragDropBoard.boardArray.forEach((row) => {
      const [results] = row.filter((x) => {
        if (x) return x[0] === 'b';
      });
      if (results) foundShips.push(results);
    });
    expect(foundShips).toEqual([]);
  });

  test('clearShipFromFleet removes the correct ship from fleet array', () => {
    dragDropBoard.clearShipFromFleet('battleship');
    const foundShips = dragDropBoard.fleet.filter(
      (x) => x.type === 'battleship'
    );
    expect(foundShips).toEqual([]);
  });

  test('isShipLegal correctly flags adjacent ships', () => {
    
  })
});

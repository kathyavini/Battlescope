import { createShip } from './ships';
import { publish } from './pubsub';

export default function createGameboard() {
  const boardArray = Array(10)
    .fill(null)
    .map((x) => Array(10).fill(null));

  const fleet = [];

  /* From Wikipedia */
  const shipLengths = [5, 4, 3, 3, 2];
  const shipTypes = [
    'carrier',
    'battleship',
    'destroyer',
    'submarine',
    'patrol boat',
  ];

  function placeShip(type, [row, column], orientation) {
    const shipIndex = shipTypes.indexOf(type);
    const shipLength = shipLengths[shipIndex];

    let createdShip = createShip(shipLength);
    createdShip.type = type;
    fleet.push(createdShip);

    /* Mark board array */
    for (let i = 1; i <= shipLength; i++) {
      const shipMarker = type[0] + i;


      if (i === 1) {
        testAdjacentCells([row, column], shipMarker);
        boardArray[row][column] = shipMarker;
        continue;
      }

      if (orientation === 'horizontal') {
        if (column + (i - 1) > 9) {
          throw 'Ship outside bounds of board';
        }
        testAdjacentCells([row, column + (i - 1)], shipMarker)
        boardArray[row][column + (i - 1)] = shipMarker;
      } else {
        if (row + (i - 1) > 9) {
          throw 'Ship outside bounds of board';
        }
        testAdjacentCells([row + (i - 1), column], shipMarker)
        boardArray[row + (i - 1)][column] = shipMarker;
      }
    }
  }

  function receiveAttack([row, column]) {
    const valueAtPosition = boardArray[row][column];

    if (!valueAtPosition) {
      boardArray[row][column] = 'miss';
      publish('miss', [row, column]);
      return;
    }
    const hitShip = fleet.filter(
      (ship) => ship.type[0] === valueAtPosition[0]
    )[0];
    hitShip.hit(valueAtPosition[1]);
    boardArray[row][column] = 'hit';
    publish('hit', [row, column]);
    if (hitShip.isSunk()) {
      publish('shipSunk', hitShip);
      boardArray[row][column] = 'sunk';
    }
  }

  function isFleetSunk() {
    const sunkShips = fleet.filter((ship) => ship.isSunk() === true);
    return sunkShips.length === fleet.length;
  }

  function testAdjacentCells([row, col], shipMarker) {
    const boundingSquares = defineBoundingBox([row, col]);
    for (const [sqRow, sqCol] of boundingSquares) {
      let test = boardArray[sqRow][sqCol];
      if (test && test[0] !== shipMarker[0]) {
        throw('Ship adjacent to another ship')
      }
    }
  }

  function defineBoundingBox([row, col]) {
    const squares = [];
    // Clockwise circle from top left
    squares.push(
      [row - 1, col - 1],
      [row - 1, col],
      [row - 1, col + 1],
      [row, col + 1],
      [row + 1, col + 1],
      [row + 1, col],
      [row + 1, col - 1],
      [row, col - 1]
    );

    const withinBoard = squares.filter(([sqRow, sqCol]) => {
      return sqRow > -1 && sqRow < 10 && sqCol > -1 && sqCol < 10
    })

    return withinBoard
  }

  return {
    get boardArray() {
      /* 2D array so each element needs destructuring */
      return boardArray.map((x) => [...x]);
    },
    receiveAttack,
    placeShip,
    get fleet() {
      return [...fleet];
    },
    isFleetSunk,
  };
}

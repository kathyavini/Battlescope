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

    /* Test legality of all positions before marking any */
    for (let i = 0; i < shipLength; i++) {
      let testSquare;

      if (orientation === 'horizontal') {
        testSquare = [row, column + i];
      } else {
        testSquare = [row + i, column];
      }

      if (testSquare[0] > 9 || testSquare[1] > 9) {
        throw 'Ship outside bounds of board';
      }
      if (adjacentShip(testSquare, type)) {
        throw 'Ship adjacent to another ship';
      }
    }

    /* Mark board array */
    for (let i = 1; i <= shipLength; i++) {
      const shipMarker = type[0] + i;

      if (i === 1) {
        boardArray[row][column] = shipMarker;
        continue;
      }

      if (orientation === 'horizontal') {
        boardArray[row][column + (i - 1)] = shipMarker;
      } else {
        boardArray[row + (i - 1)][column] = shipMarker;
      }
    }

    let createdShip = createShip(shipLength);
    createdShip.type = type;

    fleet.push(createdShip);
    // console.log(fleet);
  }

  // Moved from game module to gameboard module
  const orientations = ['horizontal', 'vertical'];
  
  function randomPosition() {
    return [Math.floor(Math.random() * 10), Math.floor(Math.random() * 10)];
  }

  function placeAllShipsRandomly() {
    for (const ship of shipTypes) {
      attemptPlacement(ship);
    }
  }

  function attemptPlacement(ship) {
    let position = randomPosition();
    let orientation = orientations[Math.floor(Math.random() * 2)];
    try {
      placeShip(ship, position, orientation);
    } catch (error) {
      attemptPlacement(ship);
    }
  }

  /* Helper functions for testing ship legality */
  function adjacentShip([row, col], shipMarker) {
    const boundingSquares = defineBoundingBox([row, col]);
    for (const [sqRow, sqCol] of boundingSquares) {
      let test = boardArray[sqRow][sqCol];
      if (test && test[0] !== shipMarker[0]) {
        return true;
      }
    }
    return false;
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
      return sqRow > -1 && sqRow < 10 && sqCol > -1 && sqCol < 10;
    });

    return withinBoard;
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

  return {
    get boardArray() {
      /* 2D array so each element needs destructuring */
      return boardArray.map((x) => [...x]);
    },
    receiveAttack,
    placeShip,
    placeAllShipsRandomly,
    get fleet() {
      return [...fleet];
    },
    isFleetSunk,
  };
}

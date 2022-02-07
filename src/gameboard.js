import { createShip } from './ships';
import { publish } from './pubsub'

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
        boardArray[row][column] = shipMarker;
        continue;
      }
      // } else {
      if (orientation === 'horizontal') {
        /* (i - 1) as marker 2 should be one square from start */
        boardArray[row][column + (i - 1)] = shipMarker;
      } else {
        boardArray[row + (i - 1)][column] = shipMarker;
      }
    }
  }

  function receiveAttack([row, column]) {
    const valueAtPosition = boardArray[row][column];

    if (!valueAtPosition) {
      boardArray[row][column] = 'miss';
      publish('miss', [row, column])
      return;
    }
    const hitShip = fleet.filter(
      (ship) => ship.type[0] === valueAtPosition[0]
    )[0];
    hitShip.hit(valueAtPosition[1]);
    boardArray[row][column] = 'hit';
    publish('hit', [row, column])
    if (hitShip.isSunk()) {
      publish('shipSunk', hitShip)
    }
  }

  function isFleetSunk() {
    const sunkShips = fleet.filter((ship) => ship.isSunk() === true);
    return sunkShips.length === fleet.length;
  }

  return {
    get boardArray() {
      /* Honestly, it took way too long to figure out that the problem here was that it was an array of arrays and each element needed destructuring! */
      return boardArray.map((x) => [...x]);
    },
    receiveAttack,
    placeShip,
    // the following are for testing only
    get fleet() {
      return [...fleet];
    },
    isFleetSunk,
  };
}

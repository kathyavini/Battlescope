import createGameboard from './gameboard';
import { renderBoard, renderTurnScreen } from './dom';
import createPlayer from './player';
import { subscribe, publish } from './pubsub';

export function newGame() {
  const player1 = createPlayer();
  const player2 = createPlayer();

  const board1 = createGameboard();
  const board2 = createGameboard();

  player1.assignEnemyGameboard(board2);
  player2.assignEnemyGameboard(board1);

  return { player1, player2, board1, board2 };
}

export function placeDemoShips(board) {
  board.placeShip('patrol boat', [1, 4], 'horizontal');
  board.placeShip('submarine', [3, 6], 'vertical');
  board.placeShip('destroyer', [5, 9], 'vertical');
  board.placeShip('battleship', [5, 0], 'horizontal');
  board.placeShip('carrier', [9, 3], 'horizontal');
}

function randomPosition() {
  return [Math.floor(Math.random() * 10), Math.floor(Math.random() * 10)];
}

const shipTypes = [
  'carrier',
  'battleship',
  'destroyer',
  'submarine',
  'patrol boat',
];

const orientations = ['horizontal', 'vertical'];

export function placeShipsRandomly(board) {
  for (const ship of shipTypes) {
    placeShip(ship, board);
  }
}

function placeShip(ship, board) {
  let position = randomPosition();
  let orientation = orientations[Math.floor(Math.random() * 2)];
  try {
    board.placeShip(ship, position, orientation);
  } catch (error) {
    placeShip(ship, board); 
  }
}



export function demoMoves({ player1, player2, board1, board2 }) {
  for (let i = 1; i < 101; i++) {
    setTimeout(() => {
      /* Can't stick in function as need return to exit the loop */
      if (board2.isFleetSunk()) {
        publish('fleetSunk', ['Player 2', 'Player 1']);
        return;
      } else if (board1.isFleetSunk()) {
        publish('fleetSunk', ['Player 1', 'Player 2']);
        return;
      }
      publish('targetChange', 'enemy');
      // player1.makeAttack(player1.aiPlay());
      player1.makeAttack(player1.aiSmartPlay());
      renderBoard(board2.boardArray, 'enemy');

      setTimeout(() => {
        if (board2.isFleetSunk()) {
          publish('fleetSunk', ['Player2', 'Player1']);
          return;
        } else if (board1.isFleetSunk()) {
          publish('fleetSunk', ['Player1', 'Player2']);
          return;
        }
        publish('targetChange', 'own');
        // player2.makeAttack(player2.aiPlay());
        player2.makeAttack(player2.aiSmartPlay());
        renderBoard(board1.boardArray, 'own');
      }, 15);
    }, i * 30);
  }
}

export function aiGameLoop({ player1, player2, board1, board2 }) {
  subscribe('squareAttacked', humanAttack);
  publish('boardChange', 'enemy');

  function humanAttack(target) {
    publish('targetChange', 'enemy');

    player1.makeAttack([target[0], target[1]]);

    renderBoard(board2.boardArray, 'enemy');

    if (board2.isFleetSunk()) {
      publish('fleetSunk', ['Computer', 'Human']);
      return;
    }
    // console.log(player1.previousMoves);

    setTimeout(() => {
      publish('boardChange', 'own');

      publish('targetChange', 'own');

      // const aiMove = await player2.aiPlayAsync()

      player2.makeAttack(player2.aiSmartPlay());
      // console.log(player2.previousMoves);

      renderBoard(board1.boardArray, 'own');

      if (board1.isFleetSunk()) {
        publish('fleetSunk', ['Human', 'Computer']);
        return;
      }

      setTimeout(() => {
        publish('boardChange', 'enemy');
      }, 1500);
    }, 1000);
  }
}

export function twoPlayerGameLoop({ player1, player2, board1, board2 }) {
  renderTurnScreen();
}

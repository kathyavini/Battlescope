import {
  createContainers,
  makeAnnouncements,
  clickListener,
  renderBoard,
  renderDragAndDropBoard,
  renderTurnScreen,
  renderStartScreen,
  renderShipPlacing
} from './dom';
import createPlayer from './player';
import createGameboard from './gameboard';
import { subscribe, publish } from './pubsub';

export function newGame() {
  createContainers();

  const player1 = createPlayer();
  const player2 = createPlayer();

  const board1 = createGameboard();
  const board2 = createGameboard();

  player1.assignEnemyGameboard(board2);
  player2.assignEnemyGameboard(board1);

  board1.placeAllShipsRandomly();
  board2.placeAllShipsRandomly();

  renderShipPlacing(board1);
  // renderDragAndDropBoard(board1);
  // renderBoardExperimental(board2, 'enemy');
  
  renderBoard(board1.boardArray, 'own');
  renderBoard(board2.boardArray, 'enemy');

  // Event listeners to track game events
  makeAnnouncements();

  // Type of game:

  // demoMoves({ player1, player2, board1, board2 });
  playerVsAILoop({ player1, player2, board1, board2 });
  // twoPlayerGameLoop({ player1 });

  renderTurnScreen();
  renderStartScreen();
}

function demoMoves({ player1, player2, board1, board2 }) {
  for (let i = 1; i < 101; i++) {
    setTimeout(() => {
      if (board2.isFleetSunk()) {
        publish('fleetSunk', ['Player 2', 'Player 1']);
        return;
      } else if (board1.isFleetSunk()) {
        publish('fleetSunk', ['Player 1', 'Player 2']);
        return;
      }
      publish('targetChange', 'enemy');
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
        player2.makeAttack(player2.aiSmartPlay());
        renderBoard(board1.boardArray, 'own');
      }, 25);
    }, i * 50);
  }
}

export function playerVsAILoop({ player1, player2, board1, board2 }) {

  // Make board clickable to human player
  clickListener(player1, 'enemy');

  subscribe('squareAttacked', humanAttack);
  // publish('boardChange', 'enemy');

  function humanAttack([player, target]) {
    publish('targetChange', 'enemy');

    player.makeAttack([target[0], target[1]]);

    renderBoard(board2.boardArray, 'enemy');

    if (board2.isFleetSunk()) {
      publish('fleetSunk', ['Computer', 'Human']);
      return;
    }

    setTimeout(() => {
      // publish('boardChange', 'own');
      publish('targetChange', 'own');

      player2.makeAttack(player2.aiSmartPlay());
      renderBoard(board1.boardArray, 'own');

      if (board1.isFleetSunk()) {
        publish('fleetSunk', ['Human', 'Computer']);
        return;
      }

      setTimeout(() => {
        // publish('boardChange', 'enemy');
      }, 1500);
    }, 1000);
  }
}

export function twoPlayerGameLoop({ player1, player2, board1, board2 }) {
  renderTurnScreen();
}

export function giveUp() {
  console.log("it's been a rough coding day/night")
}
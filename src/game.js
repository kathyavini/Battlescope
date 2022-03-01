import {
  createContainers,
  makeAnnouncements,
  clickListener,
  renderBoard,
  renderTurnScreen,
  renderStartScreen,
  clearBoards,
  swapSunkFleets
} from './dom';
import { renderShipScreen } from './dragDrop';
import createPlayer from './player';
import createGameboard from './gameboard';
import { subscribe, publish, unsubscribe } from './pubsub';

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

  // Event listeners to track game events
  makeAnnouncements();

  // Event listeners to select type of game
  const [singlePlayerButton, twoPlayerButton] = renderStartScreen();

  singlePlayerButton.addEventListener('click', (ev) => {
    ev.preventDefault();
    document.querySelector('.start-screen').style.display = 'none';

    playerVsAILoop({ player1, player2, board1, board2 });
  });

  twoPlayerButton.addEventListener('click', (ev) => {
    ev.preventDefault();
    document.querySelector('.start-screen').style.display = 'none';

    twoPlayerGameLoop({ player1, player2, board1, board2 });
  });
}

async function playerVsAILoop({ player1, player2, board1, board2 }) {
  await renderShipScreen(board1);
  renderBoard(board1.boardArray, 'own');
  renderBoard(board2.boardArray, 'enemy');

  // Make board clickable to human player
  clickListener(player1, 'enemy');

  subscribe('squareAttacked', humanAttack);

  function humanAttack([player, target]) {
    publish('targetChange', 'enemy');

    player.makeAttack([target[0], target[1]]);

    renderBoard(board2.boardArray, 'enemy');

    if (board2.isFleetSunk()) {
      publish('fleetSunk', ['Computer', 'Human']);
      return;
    }

    setTimeout(() => {
      publish('targetChange', 'own');

      player2.makeAttack(player2.aiSmartPlay());
      renderBoard(board1.boardArray, 'own');

      if (board1.isFleetSunk()) {
        publish('fleetSunk', ['Human', 'Computer']);
        return;
      }
    }, 1000);
  }
}

async function twoPlayerGameLoop({ player1, player2, board1, board2 }) {
  await renderTurnScreen('PLAYER 1');
  await renderShipScreen(board1);

  await renderTurnScreen('PLAYER 2');
  await renderShipScreen(board2);

  await playerTurn(board1, board2, player1, player2, 'Player 1', 'Player 2');

  // CSS selectors need adjusting in this loop due to the
  // boards being cleared between each turn
  document.querySelector('main').classList.add('two-player');
}

async function playerTurn(
  ownBoard,
  enemyBoard,
  thisPlayer,
  nextPlayer,
  thisPlayerStr,
  nextPlayerStr
) {
  let numAttacks = 0;

  clearBoards();
  swapSunkFleets();

  // Controls where hits/misses are announced and sunk ships shown
  publish('targetChange', 'enemy');

  renderBoard(ownBoard.boardArray, 'own');
  renderBoard(enemyBoard.boardArray, 'enemy');

  clickListener(thisPlayer, 'enemy');

  subscribe('squareAttacked', playerAttack);

  function playerAttack([player, target]) {
    player.makeAttack([target[0], target[1]]);

    renderBoard(enemyBoard.boardArray, 'enemy');

    if (enemyBoard.isFleetSunk()) {
      publish('fleetSunk', ['Computer', 'Human']);
      return;
    }
    numAttacks++;

    if (numAttacks === 3) {
      numAttacks = 0;
      unsubscribe('squareAttacked', playerAttack);

      setTimeout(() => {
        changePlayer(
          ownBoard,
          enemyBoard,
          thisPlayer,
          nextPlayer,
          thisPlayerStr,
          nextPlayerStr
        );
      }, 1000);
    }
  }
}

async function changePlayer(
  ownBoard,
  enemyBoard,
  thisPlayer,
  nextPlayer,
  thisPlayerStr,
  nextPlayerStr
) {
  await renderTurnScreen(nextPlayerStr);

  playerTurn(
    enemyBoard,
    ownBoard,
    nextPlayer,
    thisPlayer,
    nextPlayerStr,
    thisPlayerStr
  );
}

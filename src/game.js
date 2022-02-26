import {
  createContainers,
  makeAnnouncements,
  clickListener,
  renderBoard,
  renderTurnScreen,
  renderStartScreen,
} from './dom';
import { renderShipScreen } from './dragDrop';
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

function playerVsAILoop({ player1, player2, board1, board2 }) {
  renderShipScreen(board1); // interesting that doing something with this promise is not necessary

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

      setTimeout(() => {}, 1500);
    }, 1000);
  }
}

async function twoPlayerGameLoop({ player1, player2, board1, board2 }) {
  
  await renderTurnScreen('PLAYER 1').then(console.log)
  await renderShipScreen(board1).then(console.log);

  await renderTurnScreen('PLAYER 2').then(console.log);
  await renderShipScreen(board2).then(console.log);

  // Game loop

}

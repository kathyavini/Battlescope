import createGameboard from './gameboard';
import { renderBoard } from './dom';
import createPlayer from './player';

export function newGame() {
  const player1 = createPlayer();
  const player2 = createPlayer();

  const board1 = createGameboard();
  const board2 = createGameboard();

  player1.assignEnemyGameboard(board2); // 
  player1.assignOwnGameboard(board1); // 

  player2.assignEnemyGameboard(board1);
  player2.assignOwnGameboard(board2); // Possibly unneeded?

  placeDemoShips(board1);
  placeDemoShips(board2);

  return { player1, player2, board1, board2 };
}

export function placeDemoShips(board) {
  board.placeShip('patrol boat', [1, 4], 'horizontal');
  board.placeShip('submarine', [3, 6], 'vertical');
  board.placeShip('destroyer', [5, 9], 'vertical');
  board.placeShip('battleship', [5, 0], 'horizontal');
  board.placeShip('carrier', [9, 3], 'horizontal');
}

export function demoMoves({ player1, player2, board1, board2 }) {
  for (let i = 1; i < 10; i++) {
    setTimeout(() => {
      player1.makeAttack(player1.aiPlay())
      renderBoard(board2.boardArray, 'enemy');

      setTimeout(() => {
        player2.makeAttack(player2.aiPlay())
        renderBoard(board1.boardArray, 'own');
      }, 1000)

    }, i * 2500)
  }
}
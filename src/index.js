import { createContainers, renderBoard, makeAnnouncements } from './dom';
import { newGame, placeDemoShips, demoMoves, aiGameLoop } from './game.js';

createContainers();
makeAnnouncements();
const { player1, player2, board1, board2 } = newGame();

placeDemoShips(board1);
placeDemoShips(board2);

renderBoard(board1.boardArray, 'enemy');
renderBoard(board2.boardArray, 'own');

// demoMoves({ player1, player2, board1, board2 });

aiGameLoop({ player1, player2, board1, board2 });
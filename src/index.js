import { createContainers, renderBoard, makeAnnouncements } from './dom';
import { newGame, placeDemoShips, demoMoves, aiGameLoop, twoPlayerGameLoop } from './game.js';

createContainers();
makeAnnouncements(); // Event listeners for game events
const { player1, player2, board1, board2 } = newGame();

// placeDemoShips(board1);
// placeDemoShips(board2);

board1.placeAllShipsRandomly();
board2.placeAllShipsRandomly();

renderBoard(board1.boardArray, 'own');
renderBoard(board2.boardArray, 'enemy');

// demoMoves({ player1, player2, board1, board2 });

aiGameLoop({ player1, player2, board1, board2 });

// twoPlayerGameLoop({ player1, player2, board1, board2 });
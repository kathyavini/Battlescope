import { createContainers, renderBoard, makeAnnouncements } from './dom';
import { newGame, placeDemoShips, placeShipsRandomly, demoMoves, aiGameLoop, twoPlayerGameLoop } from './game.js';

createContainers();
makeAnnouncements(); // Event listeners for game events
const { player1, player2, board1, board2 } = newGame();

// placeDemoShips(board1);
// placeDemoShips(board2);

placeShipsRandomly(board1);
placeShipsRandomly(board2);

renderBoard(board1.boardArray, 'own');
renderBoard(board2.boardArray, 'enemy');

demoMoves({ player1, player2, board1, board2 });

// aiGameLoop({ player1, player2, board1, board2 });

// twoPlayerGameLoop({ player1, player2, board1, board2 });
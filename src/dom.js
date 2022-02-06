import './css/colors-and-fonts.css';
import './css/dom.css';
import { createNewElement } from './utils';

export function createContainers() {
  const body = document.querySelector('body');
  const boardsContainer = createNewElement('main', ['play-area']);
  const enemyContainer = createNewElement('section', ['enemy']);
  const ownContainer = createNewElement('section', ['own']);

  enemyContainer.append(
    createNewElement('h2', ['enemy-title'], 'Enemy Waters'),
    createNewElement('div', ['board', 'enemy-board'])
  );

  ownContainer.append(
    createNewElement('h2', ['own-title'], 'Friendly Waters'),
    createNewElement('div', ['board', 'own-board'])
  );
  boardsContainer.append(enemyContainer, ownContainer);

  body.append(createNewElement('h1', ['title'], 'Battleship'), boardsContainer);

  /* Make squares - heh, code is from my Etch a Sketch */
  const boards = document.querySelectorAll('.board');
  for (const board of boards) {
    for (let i = 0; i < 10; i++) {
      for (let j = 0; j < 10; j++) {
        const div = createNewElement('div', ['square'], null, {
          'data-pos': `${i}${j}`,
        });
        board.appendChild(div);
      }
    }
  }
}

export function renderBoard(board, placement) {
  for (let i = 0; i < 10; i++) {
    for (let j = 0; j < 10; j++) {
      const value = board[i][j];
      const boardSquare = document.querySelector(
        `.${placement}-board [data-pos="${i}${j}"]`
      );
      if (!value) {
        continue;
      } else if (value === 'hit') {
        boardSquare.classList.add('hit');
      } else if (value === 'miss') {
        boardSquare.classList.add('miss');
      } else boardSquare.classList.add('ship');
    }
  }
}

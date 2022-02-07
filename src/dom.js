import './css/colors-and-fonts.css';
import './css/dom.css';
import { createNewElement } from './utils';
import { subscribe, publish } from './pubsub';

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

  body.append(
    createNewElement('h1', ['title'], 'Battleship'),
    createNewElement('h3', ['announce-panel']),
    boardsContainer
  );

  /* Make squares - heh, code is from my Etch a Sketch */
  const boards = document.querySelectorAll('.board');
  for (const board of boards) {
    for (let i = 0; i < 10; i++) {
      for (let j = 0; j < 10; j++) {
        const div = createNewElement('div', ['square'], null, {
          'data-pos': `${i}${j}`,
        });
        div.addEventListener('click', clickAttack);
        board.appendChild(div);
      }
    }
  }

  subscribe('fleetSunk', endGame);

  function endGame() {
    boardsContainer.style.pointerEvents = 'none';
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

function clickAttack(ev) {
  publish('squareAttacked', ev.target.dataset.pos);
  ev.target.style.pointerEvents = 'none';
  ev.target.parentElement.style.pointerEvents = 'none';
  setTimeout(() => {
    ev.target.parentElement.style.pointerEvents = 'initial';
  }, 200)
}

export function makeAnnouncements() {
  const panel = document.querySelector('.announce-panel');
  
  subscribe('hit', announceHit);
  subscribe('miss', announceMiss);

  subscribe('fleetSunk', announceWin);

  function announceHit([row, column]) {
    setTimeout(() => {
      panel.classList.add('hit');
      panel.textContent = `A HIT at ${row},${column}!`;
      setTimeout(() => {
        panel.textContent = '';
        panel.classList.remove('hit');
      }, 100)
    }, 50)
  }

  function announceMiss() {
    setTimeout(() => {
      panel.textContent = `MISS!`;
      setTimeout(() => {
        panel.textContent = '';
      }, 100)
    }, 50)

  }

  function announceWin([ loser, winner ]) {
    setTimeout(() => {
      panel.classList.add('win');
      panel.textContent = `${loser}'s fleet is sunk! ${winner} wins!`;
    }, 100)

  }
}

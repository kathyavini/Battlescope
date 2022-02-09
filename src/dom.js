import './css/colors-and-fonts.css';
import './css/dom.css';
import './css/mobile.css';
import { createNewElement } from './utils';
import { subscribe, publish } from './pubsub';

export function createContainers() {
  const body = document.querySelector('body');
  const boardsContainer = createNewElement('main', ['play-area']);
  const enemyContainer = createNewElement('section', ['enemy']);
  const ownContainer = createNewElement('section', ['own']);

  enemyContainer.append(
    createNewElement('h2', ['enemy-title'], 'Enemy Waters'),
    createNewElement('h3', ['announce-panel']),
    createNewElement('div', ['board', 'enemy-board']),
    createNewElement('div', ['sunk-fleet'])
  );

  ownContainer.append(
    createNewElement('h2', ['own-title'], 'Friendly Waters'),
    createNewElement('h3', ['announce-panel']),
    createNewElement('div', ['board', 'own-board']),
    createNewElement('div', ['sunk-fleet'])
  );
  boardsContainer.append(enemyContainer, ownContainer);

  body.append(
    createNewElement('h1', ['title'], 'Battleship'),
    // announceDiv,
    createNewElement('h3', ['game-announce']),
    boardsContainer
  );

  /* Make squares */
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
      } else if (value === 'hit' || value === 'sunk') {
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
  }, 1750);
}

export function makeAnnouncements() {
  let panel;
  let fleet;
  let visibleContainer;
  const gamePanel = document.querySelector('.game-announce');

  subscribe('targetChange', changePanel);


  function changePanel(target) {
    panel = document.querySelector(`.${target} .announce-panel`);
    fleet = document.querySelector(`.${target} .sunk-fleet`);
  }

  subscribe('boardChange', changeView);
  const containers = document.querySelectorAll('.play-area section');

  function changeView(target) {
    for (const container of containers) {
      container.classList.remove('visible');
    }
    visibleContainer = document.querySelector(`.${target}`);
    visibleContainer.classList.add('visible');
  }



  const gamePanels = document.querySelectorAll('.announce-panel');

  for (const gamePanel of gamePanels) {
    gamePanel.addEventListener('transitionend', () => {
      gamePanel.classList.remove('visible');
      gamePanel.classList.remove('hit');
    });
  }

  subscribe('hit', announceHit);
  subscribe('miss', announceMiss);
  subscribe('shipSunk', announceSunkShip);
  subscribe('shipSunk', renderSunkShip);
  subscribe('fleetSunk', announceWin);


  function announceHit([row, column]) {
    panel.classList.add('visible');
    panel.classList.add('hit');
    panel.textContent = `A HIT at ${row},${column}!`;
  }

  function announceMiss() {
    panel.classList.add('visible');
    panel.textContent = `MISS!`;
  }

  function announceSunkShip(hitShip) {
    panel.classList.add('visible');
    panel.textContent = `${hitShip.type} has been sunk!!`;
  }

  function renderSunkShip(hitShip) {
    const shipRender = createNewElement('div', ['ship-render']);
    for (let i = 0; i < hitShip.length; i++) {
      shipRender.appendChild(createNewElement('div', ['ship-part']));
    }
    fleet.appendChild(shipRender);
  }

  function announceWin([loser, winner]) {
    gamePanel.classList.add('win');
    gamePanel.textContent = `${loser}'s fleet is sunk! ${winner} wins!`;
  }
}

export function renderTurnScreen() {
  const boardsContainer = document.querySelector('main');
  console.log(boardsContainer);

  const turnScreen = createNewElement('div', ['turn-screen']);
  turnScreen.append(
    createNewElement(
      'h2',
      ['turn-instructions'],
      'Please pass the device to the next player. Hit ready when device is passed'
    ),
    createNewElement('button', ['ready-button'], 'Ready')
  );

  boardsContainer.append(turnScreen);
}

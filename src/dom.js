import './css/colors-and-fonts.css';
import './css/dom.css';
import './css/game-screens.css';
import './css/mobile.css';
import { createNewElement } from './utils';
import { subscribe, publish } from './pubsub';

/* For themeing */
const shipMapping = {
  carrier: 'octopus',
  battleship: 'pufferfish',
  destroyer: 'goldfish',
  submarine: 'seahorse',
  'patrol boat': 'betta fish',
};

export function createContainers() {
  const body = document.querySelector('body');
  const boardsContainer = createNewElement('main', ['play-area']);
  const enemyContainer = createNewElement('section', ['enemy']);
  const ownContainer = createNewElement('section', ['own']);
  const enemyBoardFleet = createNewElement('div', ['board-fleet']);
  const ownBoardFleet = createNewElement('div', ['board-fleet']);

  enemyContainer.append(
    createNewElement('h2', ['subtitle', 'enemy-title'], 'Opponent Ocean'),
    createNewElement('h3', ['announce-panel']),
    enemyBoardFleet
  );
  enemyBoardFleet.append(
    createNewElement('div', ['board', 'enemy-board']),
    createNewElement('div', ['sunk-fleet'])
  );

  ownContainer.append(
    createNewElement('h2', ['subtitle', 'own-title'], 'Your Ocean'),
    createNewElement('h3', ['announce-panel']),
    ownBoardFleet
  );
  ownBoardFleet.append(
    createNewElement('div', ['board', 'own-board']),
    createNewElement('div', ['sunk-fleet'])
  );

  boardsContainer.append(enemyContainer, ownContainer);

  body.append(
    createNewElement('h1', ['title'], 'Battlescope'),
    createNewElement('h3', ['game-announce']),
    boardsContainer
  );

  /* Gameboard squares */
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

export function renderBoard(board, section) {
  for (let i = 0; i < 10; i++) {
    for (let j = 0; j < 10; j++) {
      const value = board[i][j];
      const boardSquare = document.querySelector(
        `.${section}-board [data-pos="${i}${j}"]`
      );
      if (!value) {
        continue;
      } else if (value === 'hit' || value === 'miss') {
        boardSquare.classList.add(value);
        boardSquare.style.pointerEvents = 'none'; // necessary for the 2-player version where the boards are redrawn each turn
      } else if (value === 'sunk') {
        boardSquare.classList.add(value);
        boardSquare.classList.add('hit');
        boardSquare.style.pointerEvents = 'none';
      } else {
        boardSquare.classList.add(value);
        boardSquare.classList.add('ship');

        // Tag one square per (own) ship for showing the animal image
        // Enemy ships show their animal type when class sunk is applied
        boardSquare.classList.add(`${value[0]}`);

        if (value[0] === 'b' && value[1] === '2') {
          boardSquare.classList.add('tagged');
        } else if (value[0] === 'c' && value[1] === '3') {
          boardSquare.classList.add('tagged');
        } else if ((value[0] === 's' || value[0] === 'd') && value[1] === '2') {
          boardSquare.classList.add('tagged');
        } else if (value[0] === 'p' && value[1] === '1') {
          boardSquare.classList.add('tagged');
        }
      }
    }
  }
}

// For two-player mode, where the boards are cleared and swapped each turn/device pass
export function clearBoards() {
  const boards = document.querySelectorAll('.board');
  for (const board of boards) {
    board.innerHTML = '';
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

export function swapSunkFleets() {
  const ownBoardArea = document.querySelector(`.own .board-fleet`);
  const enemyBoardArea = document.querySelector(`.enemy .board-fleet`);

  enemyBoardArea.appendChild(document.querySelector(`.own .sunk-fleet`));
  ownBoardArea.appendChild(document.querySelector(`.enemy .sunk-fleet`));
}

export function clickListener(player, section) {
  const targetContainer = document.querySelector(`section.${section}`);

  const targetSquares = targetContainer.querySelectorAll('.square');
  targetSquares.forEach((square) => {
    square.addEventListener('click', (ev) => {
      clickAttack(ev, player);
    });
  });
}

function clickAttack(ev, player) {
  // Gameboard consumes the event emitted here
  publish('squareAttacked', [player, ev.target.dataset.pos]);

  // That square can no longer be targeted
  ev.target.style.pointerEvents = 'none';

  // Time until next human click can be registered on any square
  ev.target.parentElement.style.pointerEvents = 'none';
  setTimeout(() => {
    ev.target.parentElement.style.pointerEvents = 'initial';
  }, 50);
}

export function makeAnnouncements() {
  const gamePanel = document.querySelector('.game-announce');
  const boardsContainer = document.querySelector('main');

  let panel;
  let sunkFleet;

  // Game loop emits event when active panel is switched
  subscribe('targetChange', changePanel);

  function changePanel(target) {
    panel = document.querySelector(`.${target} .announce-panel`);
    sunkFleet = document.querySelector(`.${target} .sunk-fleet`);
  }

  const announcePanels = document.querySelectorAll('.announce-panel');

  // Timing of announcements are controlled by CSS transitions
  for (const panel of announcePanels) {
    panel.addEventListener('transitionend', () => {
      panel.classList.remove('visible');
      panel.classList.remove('hit');
    });
  }

  subscribe('hit', announceHit);
  subscribe('miss', announceMiss);
  subscribe('shipSunk', announceSunkShip);
  subscribe('fleetSunk', announceWin);
  subscribe('fleetSunk', endGame);
  subscribe('shipSunk', renderSunkShip);

  // These functions used to announce hit locations as well
  // for now leaving location data as a parameter here in case that is re-implemented
  function announceHit([row, column]) {
    panel.classList.add('visible');
    panel.classList.add('hit');
    panel.textContent = `Something's been spotted!`;
  }

  function announceMiss() {
    panel.classList.add('visible');
    panel.textContent = `Nothing!`;
  }

  function announceSunkShip([hitShip, [row, column]]) {
    panel.classList.add('visible');
    const creature = shipMapping[`${hitShip.type}`];
    panel.textContent = `It's a ${creature}!!`;
  }

  function announceWin([loser, winner]) {
    gamePanel.classList.add('win');
    gamePanel.textContent = `${loser}'s sea creatures have been found! ${winner} wins!`;
  }

  function endGame() {
    // Collapse board announce panels
    for (const panel of announcePanels) {
      panel.style.display = 'none';
    }
    // Disable further clicking
    boardsContainer.style.pointerEvents = 'none';

    // Button to restart (reload) game
    const playAgain = createNewElement('button', ['play-again'], 'Play Again');

    playAgain.addEventListener('click', (ev) => {
      ev.preventDefault();
      location.reload();
    });

    gamePanel.appendChild(playAgain);
  }

  function renderSunkShip([hitShip, [row, column]]) {
    const shipRender = createNewElement('div', [
      'ship-render',
      `${hitShip.type[0]}`,
    ]);

    for (let i = 0; i < hitShip.length; i++) {
      shipRender.appendChild(createNewElement('div', ['ship-part']));
    }

    sunkFleet.appendChild(shipRender);
  }
}

export function renderStartScreen() {
  const body = document.querySelector('body');
  const player1 = createNewElement(
    'button',
    ['single-player-button'],
    '1-Player'
  );
  const player2 = createNewElement('button', ['two-player-button'], '2-Player');

  const startScreen = createNewElement('div', ['start-screen']);
  startScreen.append(
    createNewElement('h1', ['start-title'], 'BattleSCOPE'),
    createNewElement('div', ['scope']),
    createNewElement(
      'h2',
      ['start-subtitle'],
      'A friendlier take on the classic game Battleship'
    ),
    createNewElement(
      'p',
      ['directions'],
      "DIRECTIONS: Explore your opponent's ocean with your underwater scope. The first to spot all five sea creatures wins! In 2-PLAYER-MODE each turn grants five scope attempts."
    ),
    player1,
    player2
  );

  body.append(startScreen);

  return [player1, player2]; // to control game type from game module
}

export async function renderTurnScreen(player) {
  const body = document.querySelector('body');
  const readyButton = createNewElement('button', ['ready-button'], 'Ready');

  const turnScreen = createNewElement('div', ['turn-screen']);
  turnScreen.append(
    createNewElement(
      'h2',
      ['turn-instructions'],
      `Please pass the device to ${player}. Hit ready when device is passed`
    ),
    readyButton
  );

  body.append(turnScreen);

  return new Promise((resolve) => {
    readyButton.addEventListener('click', (ev) => {
      ev.preventDefault();
      turnScreen.parentElement.removeChild(turnScreen);
      resolve(true);
    });
  });
}

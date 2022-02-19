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
  const enemyBoardFleet = createNewElement('div', ['board-fleet']);
  const ownBoardFleet = createNewElement('div', ['board-fleet']);

  enemyContainer.append(
    createNewElement('h2', ['subtitle', 'enemy-title'], 'Opponent Waters'),
    createNewElement('h3', ['announce-panel']),
    enemyBoardFleet
  );
  enemyBoardFleet.append(
    createNewElement('div', ['board', 'enemy-board']),
    createNewElement('div', ['sunk-fleet'])
  );

  ownContainer.append(
    createNewElement('h2', ['subtitle', 'own-title'], 'Friendly Waters'),
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

  /* Make squares */
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
      } else if (value === 'sunk') {
        boardSquare.classList.add(value);
        boardSquare.classList.add('hit');
      } else {
        boardSquare.classList.add(value);
        boardSquare.classList.add('ship');

        // THE ANIMALS!
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

function clickAttack(ev, player) {
  publish('squareAttacked', [player, ev.target.dataset.pos]);

  ev.target.style.pointerEvents = 'none';

  ev.target.parentElement.style.pointerEvents = 'none';

  // Controls time until next human click can be registered
  setTimeout(() => {
    ev.target.parentElement.style.pointerEvents = 'initial';
  }, 15);
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

export function makeAnnouncements(player, section) {
  const targetContainer = document.querySelector(`section.${section}`);

  let panel;
  let sunkFleet;
  // let visibleContainer;
  const gamePanel = document.querySelector('.game-announce');
  const boardsContainer = document.querySelector('main');
  const subtitles = document.querySelectorAll('.subtitle');

  subscribe('targetChange', changePanel);

  function changePanel(target) {
    panel = document.querySelector(`.${target} .announce-panel`);
    sunkFleet = document.querySelector(`.${target} .sunk-fleet`);
  }

  // subscribe('boardChange', changeView);
  const containers = document.querySelectorAll('.play-area section');

  // function changeView(target) {
  //   for (const container of containers) {
  //     container.classList.remove('visible');
  //   }
  //   visibleContainer = document.querySelector(`.${target}`);
  //   visibleContainer.classList.add('visible');
  // }

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
  subscribe('fleetSunk', announceWin);
  subscribe('shipSunk', renderSunkShip);

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
    boardsContainer.style.pointerEvents = 'none';
    for (const gamePanel of gamePanels) {
      gamePanel.style.display = 'none';
    }
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

/* For themeing */
const shipMapping = {
  carrier: 'octopus',
  battleship: 'pufferfish',
  destroyer: 'goldfish',
  submarine: 'seahorse',
  'patrol boat': 'betta fish',
};

export function renderTurnScreen() {
  const body = document.querySelector('body');

  const turnScreen = createNewElement('div', ['turn-screen']);
  turnScreen.append(
    createNewElement(
      'h2',
      ['turn-instructions'],
      'Please pass the device to the next player. Hit ready when device is passed'
    ),
    createNewElement('button', ['ready-button'], 'Ready')
  );

  body.append(turnScreen);
}

export function renderStartScreen() {
  const body = document.querySelector('body');

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
      "DIRECTIONS: Explore your opponent's ocean with your underwater scope. The first to spot all five sea creatures wins! In 2-PLAYER-MODE each turn grants three scope attempts."
    ),
    createNewElement('button', ['single-player-button'], '1-Player'),
    createNewElement('button', ['two-player-button'], '2-Player')
  );

  body.append(startScreen);
}

export function renderShipPlacing(gameboard) {
  const body = document.querySelector('body');

  const shipPlacing = createNewElement('div', ['ship-screen']);
  shipPlacing.append(
    createNewElement('h2', ['ship-subtitle'], 'Hide your wildlife'),
    createNewElement(
      'p',
      ['directions'],
      'Drag and drop to move, click to change orientation. Wildlife cannot be directly adjacent to other wildlife'
    )
  );

  body.append(shipPlacing);

  document.querySelector('main').style.display = 'none';

  /* Create blank board */
  const board = createNewElement('div', ['drag-board']);
  for (let i = 0; i < 10; i++) {
    for (let j = 0; j < 10; j++) {
      const div = createNewElement('div', ['drag-square'], null, {
        'data-pos': `${i}${j}`,
      });
      board.appendChild(div);
    }
  }

  shipPlacing.appendChild(board);

  placeDraggableShips(gameboard);
  dragDropEventListeners(gameboard);
}

function dragDropEventListeners(gameboard) {
  // Drag and drop event listeners
  let thisDragElement;

  document.addEventListener('dragstart', (ev) => {
    thisDragElement = ev.target;
  });

  document.addEventListener('dragenter', (ev) => {
    if (ev.target.className === 'drag-square') {
      ev.target.style.backgroundColor = 'purple';
    }
  });

  document.addEventListener('dragleave', (ev) => {
    if (ev.target.className === 'drag-square') {
      ev.target.style.backgroundColor = '';
    }
  });

  document.addEventListener('dragover', (ev) => {
    // MDN says this is necessary to allow drop
    ev.preventDefault();
  });

  // Drag and drop to update position
  document.addEventListener('drop', (ev) => {
    ev.preventDefault();

    if (ev.target.className === 'drag-square') {
      ev.target.style.backgroundColor = '';

      const coords = [+ev.target.dataset.pos[0], +ev.target.dataset.pos[1]];

      const length = thisDragElement.dataset.length;
      const type = thisDragElement.dataset.type;
      const orientation = thisDragElement.dataset.orientation;

      console.log(coords, type, orientation);

      try {
        gameboard.isShipLegal(type, length, orientation, coords);
        console.log('this was a legal placement');

        updateGameboard(gameboard, type, coords, orientation);

        thisDragElement.parentNode.removeChild(thisDragElement);
        ev.target.appendChild(thisDragElement);

        thisDragElement.dataset.pos = ev.target.dataset.pos;
      } catch (error) {
        console.log(error);
        console.log('this was not a legal placement');
      }
    }
  });
}

/* Put draggable elements at each ship location */
function placeDraggableShips(gameboard) {
  for (let i = 0; i < 10; i++) {
    for (let j = 0; j < 10; j++) {
      const value = gameboard.boardArray[i][j];
      const boardSquare = document.querySelector(
        `.drag-square[data-pos="${i}${j}"]`
      );

      if (!value) {
        continue;
      } else if (value[1] === '1') {
        const [ship] = gameboard.fleet.filter((x) => x.type[0] == value[0]);

        const draggable = renderDraggableShip(ship);

        boardSquare.appendChild(draggable);

        // Click to change orientation event listener
        draggable.addEventListener('click', (ev) => {
          ev.stopPropagation();

          let newOrientation;

          if (ev.target.dataset.orientation === 'vertical') {
            newOrientation = 'horizontal';
          } else {
            console.log("changing to vertical")
          }
          const coords = [
            +draggable.parentNode.dataset.pos[0],
            +draggable.parentNode.dataset.pos[1],
          ];
          const type = draggable.dataset.type;
          const length = draggable.dataset.length;

          console.log(coords, type, newOrientation);

          try {
            gameboard.isShipLegal(type, length, newOrientation, coords);
            console.log('this was a legal placement');
    
            updateGameboard(gameboard, type, coords, newOrientation);

            draggable.classList.toggle('rotated');
            draggable.dataset.orientation = newOrientation;
          } catch (error) {
            console.log(error);
            console.log('this was not a legal placement');
          }
        });
      }
    }
  }
}


function renderDraggableShip(ship) {
  const shipRender = createNewElement(
    'div',
    ['draggable-ship', `${ship.type[0]}`],
    null,
    {
      draggable: 'true',
      'data-orientation': ship.orientation,
      'data-length': `${ship.length}`,
      'data-type': ship.type,
    }
  );

  if (ship.orientation === 'vertical') {
    shipRender.classList.add('rotated');
  }

  for (let i = 0; i < ship.length; i++) {
    shipRender.appendChild(createNewElement('div', ['ship-part']));
  }

  return shipRender;
}

function updateGameboard(gameboard, type, coords, orientation) {
  console.log("Gameboard being updated now")
  gameboard.clearShipFromBoard(type);
  gameboard.clearShipFromFleet(type);
  gameboard.placeShip(type, coords, orientation);
  console.log(gameboard.fleet);
}

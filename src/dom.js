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
    createNewElement('h2', ['subtitle', 'enemy-title'], 'Enemy Waters'),
    createNewElement('h3', ['announce-panel']),
    createNewElement('div', ['board', 'enemy-board']),
    createNewElement('div', ['sunk-fleet'])
  );

  ownContainer.append(
    createNewElement('h2', ['subtitle', 'own-title'], 'Friendly Waters'),
    createNewElement('h3', ['announce-panel']),
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

export function renderBoardExperimental(gameboard, section) {
  // Drag and drop event listeners
  let thisDragElement;

  document.addEventListener('dragstart', (ev) => {
    thisDragElement = ev.target;
  });

  document.addEventListener('dragenter', (ev) => {
    if (ev.target.className === 'square') {
      ev.target.style.backgroundColor = 'purple';
    }
  });

  document.addEventListener('dragleave', (ev) => {
    if (ev.target.className === 'square') {
      ev.target.style.backgroundColor = '';
    }
  });

  document.addEventListener('dragover', (ev) => {
    // MDN says this is necessary to allow drop
    ev.preventDefault();
  });

  document.addEventListener('drop', (ev) => {
    ev.preventDefault();

    if (ev.target.className === 'square') {
      ev.target.style.backgroundColor = '';

      const coords = [+ev.target.dataset.pos[0], +ev.target.dataset.pos[1]];

      const type = thisDragElement.dataset.type;
      const orientation = thisDragElement.dataset.orientation;

      console.log(coords, type, orientation);

      try {
        gameboard.placeShip(type, coords, orientation);
        console.log('this was a legal placement');

        thisDragElement.parentNode.removeChild(thisDragElement);
        ev.target.appendChild(thisDragElement);

        thisDragElement.dataset.pos = ev.target.dataset.pos;

        clearShipFromBoard(thisDragElement, gameboard);
        updateFleet(thisDragElement, gameboard);
        gameboard.placeShip(type, coords, orientation)

      } catch (error) {
        console.log(error);
        console.log('this was not a legal placement');
      }

      // console.log(thisDragElement.dataset);
    }
  });

  for (let i = 0; i < 10; i++) {
    for (let j = 0; j < 10; j++) {
      const value = gameboard.boardArray[i][j];
      const boardSquare = document.querySelector(
        `.${section}-board [data-pos="${i}${j}"]`
      );

      if (!value) {
        continue;
      } else if (value[1] === '1') {
        const [ship] = gameboard.fleet.filter((x) => x.type[0] == value[0]);

        const draggable = renderDraggableShip(ship);

        boardSquare.appendChild(draggable);

        draggable.addEventListener('click', (ev) => {
          ev.stopPropagation();

          let newOrientation;

          if (ev.target.dataset.orientation === 'vertical') {
            newOrientation = 'horizontal';
          } else {
            newOrientation = 'vertical';
          }

          const coords = [
            +draggable.parentNode.dataset.pos[0],
            +draggable.parentNode.dataset.pos[1],
          ];

          const type = draggable.dataset.type;

          console.log(type, coords, newOrientation);

          // I do wish I had written a function "is legal placement" instead of throwing an error within place ship... this makes it a lot harder
          try {
            gameboard.placeShip(type, coords, newOrientation);

            console.log('this was a legal placement');

            ev.target.classList.toggle('rotated');
            ev.target.dataset.orientation = newOrientation;

            clearShipFromBoard(draggable, gameboard);
            updateFleet(draggable, gameboard);

            gameboard.placeShip(type, coords, newOrientation);

          } catch (error) {
            console.log(error);
            console.log('this was not a legal placement');
          }
        });
      }
    }
  }
}

// 
function clearShipFromBoard(updatedShip, gameboard) {
  console.log('clearing');

  let newBoard = gameboard.boardArray.map((x) => [...x]);
  console.log(newBoard);

  for (let i = 0; i < 10; i++) {
    for (let j = 0; j < 10; j++) {
      let value = newBoard[i][j];

      if (!value) {
        continue;
      } else if (value[0] === updatedShip.dataset.type[0]) {
        console.log('Cleared value: ' + value);
        value = null;
      }
    }
  }
  console.log(newBoard);
  // added a setter to gameboard for this
  gameboard.boardArray = newBoard;
}

// For orientation; actually not needed until the end, right?
function updateFleet(updatedShip, gameboard) {
  let newFleet = gameboard.fleet;
  const targetShip = newFleet.filter(
    (x) => (x.type = updatedShip.dataset.type)
  );

  console.log(targetShip);
  console.log(gameboard.fleet);
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
  console.log('click attack');
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
  let visibleContainer;
  const gamePanel = document.querySelector('.game-announce');
  const boardsContainer = document.querySelector('main');
  const subtitles = document.querySelectorAll('.subtitle');

  subscribe('targetChange', changePanel);

  function changePanel(target) {
    panel = document.querySelector(`.${target} .announce-panel`);
    sunkFleet = document.querySelector(`.${target} .sunk-fleet`);
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

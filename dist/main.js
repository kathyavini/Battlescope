/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
var __webpack_exports__ = {};

;// CONCATENATED MODULE: ./src/utils.js
function createNewElement(
  type,
  classes = null,
  text = null,
  attributes = null
) {
  let createdElement = document.createElement(type);

  if (classes) {
    createdElement.classList.add(...classes);
  }

  if (text) {
    createdElement.textContent = text;
  }

  if (attributes) {
    for (let key in attributes) {
      createdElement.setAttribute(key, attributes[key]);
    }
  }

  return createdElement;
}

;// CONCATENATED MODULE: ./src/pubsub.js
/* This is adapted from Steve Griffith's PubSub Design Pattern in JS

Video: https://www.youtube.com/watch?v=aynSM8llOBs
Repo: https://github.com/prof3ssorSt3v3/pubsub-demo */

const events = {};

function getEvents() {
  return { ...events };
}

function subscribe(eventName, callback) {
  events[eventName] = events[eventName] || [];
  events[eventName].push(callback);
}

function unsubscribe(eventName, callback) {
  if (events[eventName]) {
    events[eventName] = events[eventName].filter((fn) => fn !== callback);
  }
}

function publish(eventName, data) {
  if (events[eventName]) {
    for (const callback of events[eventName]) {
      callback(data);
    }
  }
}

;// CONCATENATED MODULE: ./src/dom.js







/* For themeing */
const shipMapping = {
  carrier: 'octopus',
  battleship: 'pufferfish',
  destroyer: 'goldfish',
  submarine: 'seahorse',
  'patrol boat': 'betta fish',
};

function createContainers() {
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

function renderBoard(board, section) {
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

        // This is necessary only for the 2-player version where the boards are redrawn each turn; the square is disabled upon attack
        boardSquare.style.pointerEvents = 'none'; 

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
function clearBoards() {
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

function swapSunkFleets() {
  const ownBoardArea = document.querySelector(`.own .board-fleet`);
  const enemyBoardArea = document.querySelector(`.enemy .board-fleet`);

  enemyBoardArea.appendChild(document.querySelector(`.own .sunk-fleet`));
  ownBoardArea.appendChild(document.querySelector(`.enemy .sunk-fleet`));
}

// In the 1-player version, data about which kind of ship has been sunk is stored in classes on the board; in the 2-player version,  the boards are cleared each turn so the data is stored on the sunk fleet div and the classes reapplied to the board upon each turn
function reMarkSunkShips() {
  const sections = ['own', 'enemy'];
  for (const section of sections) {
    const mySunkShips = document.querySelectorAll(`.${section} .sunk-fleet .ship-render`)
    if (mySunkShips) {
      for (const ship of mySunkShips) {
        const loc = ship.dataset.loc;
        const type = ship.dataset.type[0];
        const sunkSquare = document.querySelector(`.${section} [data-pos="${loc}"`)
        sunkSquare.classList.add(type, 'hit', 'ship', 'tagged');
      }
    }
  }

}

function clickListener(player, section) {
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

function makeAnnouncements() {
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

    // A very weird workaround to storying sunk ship data for the two player version where the boards are redrawn (in the 1-player this is stored in classes)
    shipRender.dataset.loc = `${row}${column}`;
    shipRender.dataset.type = hitShip.type;
  }
}

function renderStartScreen() {
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

async function renderTurnScreen(player) {
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

;// CONCATENATED MODULE: ./src/dragDrop.js


function renderShipScreen(gameboard) {
  document.querySelector('main').style.display = 'none';

  // Hides title and disables overflow on mobile
  document.querySelector('.title').classList.add('hidden');
  document.querySelector('html').classList.add('dragging');

  const randomize = createNewElement('button', ['randomize'], 'Randomize');
  const start = createNewElement('button', ['start'], 'Start');

  const shipScreen = createNewElement('div', ['ship-screen']);
  shipScreen.append(
    createNewElement('h2', ['ship-subtitle'], 'Hide your wildlife'),
    createNewElement(
      'p',
      ['directions'],
      'Drag and drop to move, click to change orientation. Wildlife cannot be adjacent to other wildlife'
    ),
    randomize,
    start
  );

  document.querySelector('body').append(shipScreen);

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

  // I forget why I did this
  shipScreen.insertBefore(board, document.querySelector('.randomize'));

  // Create ship DOM elements
  placeDraggableShips(gameboard);

  // Add event listeners to board
  listenForDragDropEvents(gameboard); // mouse only
  listenForTouchEvents(gameboard); // touch

  // Button event listeners
  randomize.addEventListener('click', (ev) => {
    ev.preventDefault();
    gameboard.clearBoard();
    gameboard.placeAllShipsRandomly();
    clearDraggableShips();
    placeDraggableShips(gameboard);
  });

  return new Promise((resolve) => {
    start.addEventListener('click', (ev) => {
      ev.preventDefault();
      shipScreen.parentElement.removeChild(shipScreen);
      document.querySelector('main').style.display = 'flex';
      document.querySelector('html').classList.remove('dragging');
      document.querySelector('.title').classList.remove('hidden');
      resolve(true);
    });
  });
}

function listenForDragDropEvents(gameboard) {
  let thisDragElement;
  const dragBoard = document.querySelector('.drag-board');
  dragBoard.addEventListener('dragstart', (ev) => {
    ev.dataTransfer.effectAllowed = "move"; // To get rid of the green plus icon in Chrome
    ev.dataTransfer.dropEffect = "move";
    thisDragElement = ev.target;
  });

  dragBoard.addEventListener('dragenter', (ev) => {
    if (ev.target.className === 'drag-square') {
      ev.target.style.backgroundColor = 'purple';
    }
  });

  dragBoard.addEventListener('dragleave', (ev) => {
    if (ev.target.className === 'drag-square') {
      ev.target.style.backgroundColor = '';
    }
  });

  dragBoard.addEventListener('dragover', (ev) => {
    // MDN says this is necessary to allow drop
    ev.preventDefault();
  });

  // Drag and drop to update position
  dragBoard.addEventListener('drop', (ev) => {
    ev.preventDefault();

    if (ev.target.className === 'drag-square') {
      ev.target.style.backgroundColor = '';

      const coords = [+ev.target.dataset.pos[0], +ev.target.dataset.pos[1]];

      const length = thisDragElement.dataset.length;
      const type = thisDragElement.dataset.type;
      const orientation = thisDragElement.dataset.orientation;

        // console.log(coords, type, orientation);

      try {
        gameboard.isShipLegal(type, length, orientation, coords);
        // console.log('this was a legal placement');

        updateGameboard(gameboard, type, coords, orientation);

        ev.target.appendChild(thisDragElement);

        thisDragElement.dataset.pos = ev.target.dataset.pos;
      } catch (error) {
        // console.log(error);
        // console.log('this was not a legal placement');
      }
    }
  });
}

function listenForTouchEvents(gameboard) {
  const dragBoard = document.querySelector('.drag-board');
  let thisDragElement;

  let initialPos;
  let dragging = false;

  dragBoard.addEventListener('touchstart', (ev) => {
    if (ev.target.classList.contains('draggable-ship')) {
      thisDragElement = ev.target;
    }
    initialPos = [ev.touches[0].clientX, ev.touches[0].clientY];
  });

  dragBoard.addEventListener('touchmove', (ev) => {
    if (thisDragElement) {
      thisDragElement.style.opacity = '0.5';
      thisDragElement.style.transform = `translate(${
        ev.touches[0].clientX - initialPos[0]
      }px, ${ev.touches[0].clientY - initialPos[1]}px) ${
        thisDragElement.dataset.orientation === 'vertical'
          ? 'rotate(90deg)'
          : ''
      }`;
      dragging = true;
    }
  });

  dragBoard.addEventListener('touchend', (ev) => {
    if (dragging && thisDragElement) {
      const touchedDivs = document.elementsFromPoint(
        thisDragElement.getBoundingClientRect().x,
        thisDragElement.getBoundingClientRect().y
      );

      touchedDivs.forEach((div) => {
        const cornerDiv = div;

        if (cornerDiv.classList.contains('drag-square')) {
          const coords = [+cornerDiv.dataset.pos[0], +cornerDiv.dataset.pos[1]];

          const length = thisDragElement.dataset.length;
          const type = thisDragElement.dataset.type;
          const orientation = thisDragElement.dataset.orientation;

            // console.log(coords, type, orientation);

          try {
            gameboard.isShipLegal(type, length, orientation, coords);
            // console.log('this was a legal placement');

            updateGameboard(gameboard, type, coords, orientation);

            cornerDiv.appendChild(thisDragElement);

            thisDragElement.dataset.pos = cornerDiv.dataset.pos;
          } catch (error) {
            // console.log(error);
            // console.log('this was not a legal placement');
          } finally {
            thisDragElement.style.transform = '';
          }
        }
      });
      thisDragElement.style.opacity = '1';
      thisDragElement.style.transform = '';
      thisDragElement = undefined;
      dragging = false;
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
            newOrientation = 'vertical';
          }
          const coords = [
            +draggable.parentNode.dataset.pos[0],
            +draggable.parentNode.dataset.pos[1],
          ];
          const type = draggable.dataset.type;
          const length = draggable.dataset.length;

            // console.log(coords, type, newOrientation);

          try {
            gameboard.isShipLegal(type, length, newOrientation, coords);
            // console.log('this was a legal placement');

            updateGameboard(gameboard, type, coords, newOrientation);

            draggable.classList.toggle('rotated');
            draggable.dataset.orientation = newOrientation;
          } catch (error) {
            // console.log(error);
            // console.log('this was not a legal placement');
          }
        });
      }
    }
  }
}

function renderDraggableShip(ship) {
  const shipRender = createNewElement(
    'div',
    ['draggable-ship', 'ship-render', `${ship.type[0]}`],
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

function clearDraggableShips() {
  const ships = document.querySelectorAll('.draggable-ship');
  ships.forEach((ship) => {
    ship.parentElement.removeChild(ship);
  });
}

function updateGameboard(gameboard, type, coords, orientation) {
  gameboard.clearShipFromBoard(type);
  gameboard.clearShipFromFleet(type);
  gameboard.placeShip(type, coords, orientation);
}

;// CONCATENATED MODULE: ./src/player.js
function createPlayer() {
  let enemyBoard;

  let previousMoves = [];
  let shipHistory = ''; // for AI conditionals

  const aiMode = {
    columnAxis: true,
    posDirection: true,
  };

  function assignEnemyGameboard(gameboard) {
    enemyBoard = gameboard;
  }

  function makeAttack([row, col]) {
    return enemyBoard.receiveAttack([row, col]);
  }

  function aiPlay() {
    let thisMove = randomMove();

    while (playedPreviously(thisMove)) {
      thisMove = randomMove();
    }

    previousMoves.push({ move: thisMove });

    return thisMove;
  }

  function aiSmartPlay() {
    let thisMove;

    // First move
    if (!previousMoves[0]) {
      thisMove = randomMove();
      // All subsequent
    } else {
      evaluateLastMove();

      thisMove = smartMove();

      while (playedPreviously(thisMove)) {
        if (shipHistory) {
          const previousResult = queryPreviousResult(thisMove);
          // Within the deterministic attack sequence, any previously played move is recorded again as if it is being played now so the sequence can continue
          previousMoves.push({ move: thisMove, result: previousResult });
        }
        thisMove = smartMove();
      }
    }

    previousMoves.push({ move: thisMove });

    return thisMove;
  }

  function randomMove() {
    const move = [
      Math.floor(Math.random() * 10),
      Math.floor(Math.random() * 10),
    ];
    return move;
  }

  function playedPreviously(thisMove) {
    const checkMoves = previousMoves.filter(
      (turn) => turn.move[0] === thisMove[0] && turn.move[1] === thisMove[1]
    );

    if (checkMoves[0]) return true;

    return false;
  }

  function queryPreviousResult(thisMove) {
    const checkMoves = previousMoves.filter(
      (turn) => turn.move[0] === thisMove[0] && turn.move[1] === thisMove[1]
    );

    return checkMoves[0].result;
  }

  function evaluateLastMove() {
    const lastMove = previousMoves[previousMoves.length - 1].move;

    // Result is read off of the enemy gameboard
    const foundResult = enemyBoard.boardArray[lastMove[0]][lastMove[1]];

    // And stored in the previousMove array
    previousMoves[previousMoves.length - 1].result = foundResult;
  }

  function smartMove() {
    let nextMove;
    let lastMove = previousMoves[previousMoves.length - 1];

    // Reset after a ship is sunk
    if (lastMove.result === 'sunk') {
      shipHistory = '';

      aiMode.columnAxis = true;
      aiMode.posDirection = true;

      return randomMove();
    }

    // Attack sequence history begins with the first hit on a new ship
    if (shipHistory[0] === 'h' || lastMove.result === 'hit') {
      shipHistory = shipHistory + lastMove.result[0];
    }

    // If no history, a ship has not been discovered yet
    if (!shipHistory) return randomMove();


    let [secondLast, thirdLast, fourthLast, fifthLast] =
      definePreviousMoveVariables();

    /* Conditional logic for Deterministic AI */
    // Second parameter in the following functions is the previous move in reference to which the next move should be made

    if (lastMove.result === 'hit') {
      nextMove = continueSamePath(lastMove);

      // If hitting a boundary, calculate correct move to backtrack from
      if (outOfBounds(nextMove)) {
        let referenceMove;
        switch (shipHistory) {
          case 'hmhh':
            referenceMove = fourthLast.move;
            break;
          case 'hmh':
            referenceMove = thirdLast.move;
            break;
          default:
            referenceMove = lastMove.move;
        }
        switchDirectionAtEdges(nextMove);
        nextMove = moveAccordingToMode(referenceMove);
      }

      return nextMove;
    }

    if (fifthLast && fifthLast.result === 'hit') {
      return keepAxisSwitchDirection(nextMove, fifthLast);
    }
    if (fourthLast && fourthLast.result === 'hit') {
      return keepAxisSwitchDirection(nextMove, fourthLast);
    }
    if (thirdLast && shipHistory === 'hmm') {
      return switchAxisOrDirection(nextMove, thirdLast);
    }
    if (secondLast && secondLast.result === 'hit') {
      return switchAxisOrDirection(nextMove, secondLast);
    }

    // A failsafe reset for encountering a condition not listed above (should not be called)
    console.log('None of the above conditions apply');
    shipHistory = '';
    aiMode.columnAxis = true;
    aiMode.posDirection = true;

    return randomMove();
  }

  /* smartMove Helper Functions */
  function definePreviousMoveVariables() {
    let secondLast;
    let thirdLast;
    let fourthLast;
    let fifthLast;

    if (shipHistory.length >= 5) {
      fifthLast = previousMoves[previousMoves.length - 5];
    }
    if (shipHistory.length >= 4) {
      fourthLast = previousMoves[previousMoves.length - 4];
    }
    if (shipHistory.length >= 3) {
      thirdLast = previousMoves[previousMoves.length - 3];
    }
    if (shipHistory.length >= 2) {
      secondLast = previousMoves[previousMoves.length - 2];
    }

    return [secondLast, thirdLast, fourthLast, fifthLast];
  }

  function continueSamePath(lastMove) {
    return moveAccordingToMode(lastMove.move);
  }

  function keepAxisSwitchDirection(nextMove, referenceMove) {
    aiMode.posDirection = !aiMode.posDirection;
    nextMove = moveAccordingToMode(referenceMove.move);

    if (outOfBounds(nextMove)) {
      switchDirectionAtEdges(nextMove);
      nextMove = moveAccordingToMode(referenceMove.move);
    }

    return nextMove;
  }

  function switchAxisOrDirection(nextMove, referenceMove) {
    if (aiMode.columnAxis && aiMode.posDirection) {
      // initial switch upon first miss should be of direction
      aiMode.posDirection = !aiMode.posDirection;
    } else if (aiMode.columnAxis && !aiMode.posDirection) {
      // if direction is already switched row axis should be started
      aiMode.columnAxis = !aiMode.columnAxis;
      // If ship then missed to side, switch direction
    } else if (!aiMode.columnAxis && !aiMode.posDirection) {
      !aiMode.posDirection;
    }

    nextMove = moveAccordingToMode(referenceMove.move);

    if (outOfBounds(nextMove)) {
      switchDirectionAtEdges(nextMove);
      nextMove = moveAccordingToMode(referenceMove.move);
    }

    return nextMove;
  }

  function moveAccordingToMode([row, column]) {
    if (aiMode.columnAxis && aiMode.posDirection) {
      return [row + 1, column];
    } else if (aiMode.columnAxis) {
      return [row - 1, column];
    } else if (aiMode.posDirection) {
      return [row, column + 1];
    } else {
      return [row, column - 1];
    }
  }

  function outOfBounds([row, column]) {
    if (row > 9 || row < 0 || column > 9 || column < 0) {
      return true;
    }
  }

  function switchDirectionAtEdges([row, column]) {
    if (row > 9 && aiMode.columnAxis === true) {
      aiMode.posDirection = false;
    } else if (row < 0 && column == 0) {
      // ONLY happens with horizontal ship in top left corner
      aiMode.columnAxis = false;
      aiMode.posDirection = true;
    }else if (row < 0) {
      // if direction has already been switched
      aiMode.columnAxis = false;
    } else if (column < 0) {
      aiMode.posDirection = true;
    }
  }

  return {
    makeAttack,
    assignEnemyGameboard,
    aiPlay,
    aiSmartPlay,
    // Everything below is internal and was used only for testing
    get enemyBoard() {
      return enemyBoard;
    },
    get previousMoves() {
      return [...previousMoves];
    },
    // Only for testing would these ever be set
    set previousMoves(historyArray) {
      previousMoves = historyArray;
    },
    aiMode,
    set shipHistory(string) {
      shipHistory = string;
    },
  };
}

;// CONCATENATED MODULE: ./src/ships.js
function createShip(length) {
    const shipArray = Array(length).fill(0);

    function hit(position) {
        /* 0 - not hit; 1 - hit */
        shipArray[position - 1] = 1;
        return this;
    }

    function isSunk() {
        const hits = shipArray.filter(position =>
            position == 1);
        return hits.length == length
    }

    return {
        hit,
        get shipArray(){
            return [...shipArray]
        },
        get length() {
            return length
        },
        isSunk
    }
}


;// CONCATENATED MODULE: ./src/gameboard.js



function createGameboard() {
  let boardArray = Array(10)
    .fill(null)
    .map((x) => Array(10).fill(null));

  let fleet = [];

  /* From Wikipedia */
  const shipLengths = [5, 4, 3, 3, 2];
  const shipTypes = [
    'carrier',
    'battleship',
    'destroyer',
    'submarine',
    'patrol boat',
  ];

  function placeShip(type, [row, column], orientation) {
    const shipIndex = shipTypes.indexOf(type);
    const shipLength = shipLengths[shipIndex];

    /* Test legality of all positions before marking any */
    isShipLegal(type, shipLength, orientation, [row, column]);

    /* Mark board array */
    for (let i = 1; i <= shipLength; i++) {
      const shipMarker = type[0] + i;

      if (i === 1) {
        boardArray[row][column] = shipMarker;
        continue;
      }

      if (orientation === 'horizontal') {
        boardArray[row][column + (i - 1)] = shipMarker;
      } else {
        boardArray[row + (i - 1)][column] = shipMarker;
      }
    }

    let createdShip = createShip(shipLength);
    createdShip.type = type;
    createdShip.orientation = orientation; // for drag and drop

    fleet.push(createdShip);
  }

  function isShipLegal(type, shipLength, orientation, [row, column]) {
    for (let i = 0; i < shipLength; i++) {
      let testSquare;

      if (orientation === 'horizontal') {
        testSquare = [row, column + i];
      } else {
        testSquare = [row + i, column];
      }

      if (testSquare[0] > 9 || testSquare[1] > 9) {
        throw 'Ship outside bounds of board';
      }
      if (adjacentShip(testSquare, type)) {
        throw 'Ship adjacent to another ship';
      }
    }
  }

  function placeAllShipsRandomly() {
    for (const ship of shipTypes) {
      attemptPlacement(ship);
    }
  }

  const orientations = ['horizontal', 'vertical'];

  function randomPosition() {
    return [Math.floor(Math.random() * 10), Math.floor(Math.random() * 10)];
  }

  function attemptPlacement(ship) {
    let position = randomPosition();
    let orientation = orientations[Math.floor(Math.random() * 2)];
    try {
      placeShip(ship, position, orientation);
    } catch (error) {
      attemptPlacement(ship);
    }
  }

  /* Helper functions for testing ship legality */
  function adjacentShip([row, col], shipMarker) {
    const boundingSquares = defineBoundingBox([row, col]);
    for (const [sqRow, sqCol] of boundingSquares) {
      let test = boardArray[sqRow][sqCol];
      if (test && test[0] !== shipMarker[0]) {
        return true;
      }
    }
    return false;
  }

  function defineBoundingBox([row, col]) {
    const squares = [];
    // Clockwise circle from top left
    squares.push(
      [row - 1, col - 1],
      [row - 1, col],
      [row - 1, col + 1],
      [row, col + 1],
      [row + 1, col + 1],
      [row + 1, col],
      [row + 1, col - 1],
      [row, col - 1]
    );

    const withinBoard = squares.filter(([sqRow, sqCol]) => {
      return sqRow > -1 && sqRow < 10 && sqCol > -1 && sqCol < 10;
    });

    return withinBoard;
  }

  function receiveAttack([row, column]) {
    const valueAtPosition = boardArray[row][column];

    if (!valueAtPosition) {
      boardArray[row][column] = 'miss';
      publish('miss', [row, column]);
      return;
    }
    const hitShip = fleet.filter(
      (ship) => ship.type[0] === valueAtPosition[0]
    )[0];
    hitShip.hit(valueAtPosition[1]);
    boardArray[row][column] = 'hit';
    publish('hit', [row, column]);

    if (hitShip.isSunk()) {
      publish('shipSunk', [hitShip, [row, column]]);
      boardArray[row][column] = 'sunk';
    }
  }

  function isFleetSunk() {
    const sunkShips = fleet.filter((ship) => ship.isSunk() === true);
    return sunkShips.length === fleet.length;
  }

  function clearShipFromBoard(type) {
    for (let i = 0; i < 10; i++) {
      for (let j = 0; j < 10; j++) {
        if (boardArray[i][j] && boardArray[i][j][0] === type[0]) {
          boardArray[i][j] = null;
        }
      }
    }
  }

  function clearShipFromFleet(type) {
    fleet = fleet.filter((x) => x.type !== type);
  }

  function clearBoard() {
    fleet = [];
    boardArray = Array(10)
      .fill(null)
      .map((x) => Array(10).fill(null));
  }

  return {
    get boardArray() {
      /* 2D array so each element needs destructuring */
      return boardArray.map((x) => [...x]);
    },
    receiveAttack,
    placeShip,
    placeAllShipsRandomly,
    get fleet() {
      return [...fleet];
    },
    isFleetSunk,
    // The following implemented for use by the drag and drop ship placement. Also changed both board and fleet arrays to let instead of const for this
    isShipLegal,
    clearShipFromBoard,
    clearShipFromFleet,
    clearBoard,
  };
}

;// CONCATENATED MODULE: ./src/game.js






function newGame() {
  createContainers();

  const player1 = createPlayer();
  const player2 = createPlayer();

  const board1 = createGameboard();
  const board2 = createGameboard();

  player1.assignEnemyGameboard(board2);
  player2.assignEnemyGameboard(board1);

  board1.placeAllShipsRandomly();
  board2.placeAllShipsRandomly();

  // Event listeners to track game events
  makeAnnouncements();

  // Event listeners to select type of game
  const [singlePlayerButton, twoPlayerButton] = renderStartScreen();

  singlePlayerButton.addEventListener('click', (ev) => {
    ev.preventDefault();
    document.querySelector('.start-screen').style.display = 'none';

    playerVsAILoop({ player1, player2, board1, board2 });
  });

  twoPlayerButton.addEventListener('click', (ev) => {
    ev.preventDefault();
    document.querySelector('.start-screen').style.display = 'none';

    twoPlayerGameLoop({ player1, player2, board1, board2 });
  });
}

async function playerVsAILoop({ player1, player2, board1, board2 }) {
  await renderShipScreen(board1);
  renderBoard(board1.boardArray, 'own');
  renderBoard(board2.boardArray, 'enemy');

  // Make board clickable to human player
  clickListener(player1, 'enemy');

  subscribe('squareAttacked', humanAttack);

  function humanAttack([player, target]) {
    publish('targetChange', 'enemy');

    player.makeAttack([target[0], target[1]]);

    renderBoard(board2.boardArray, 'enemy');

    if (board2.isFleetSunk()) {
      publish('fleetSunk', ['Computer', 'Human']);
      return;
    }

    setTimeout(() => {
      publish('targetChange', 'own');

      player2.makeAttack(player2.aiSmartPlay());
      renderBoard(board1.boardArray, 'own');

      if (board1.isFleetSunk()) {
        publish('fleetSunk', ['Human', 'Computer']);
        return;
      }
    }, 1000);
  }
}

async function twoPlayerGameLoop({ player1, player2, board1, board2 }) {
  await renderTurnScreen('PLAYER 1');
  await renderShipScreen(board1);

  await renderTurnScreen('PLAYER 2');
  await renderShipScreen(board2);

  await renderTurnScreen('PLAYER 1');
  await playerTurn(board1, board2, player1, player2, 'PLAYER 1', 'PLAYER 2');

  // CSS selectors need adjusting in this loop due to the
  // boards being cleared between each turn
  document.querySelector('main').classList.add('two-player');
}

async function playerTurn(
  ownBoard,
  enemyBoard,
  thisPlayer,
  nextPlayer,
  thisPlayerStr,
  nextPlayerStr
) {
  let numAttacks = 0;

  clearBoards();
  swapSunkFleets();
  reMarkSunkShips();

  // Controls where hits/misses are announced and sunk ships shown
  publish('targetChange', 'enemy');

  renderBoard(ownBoard.boardArray, 'own');
  renderBoard(enemyBoard.boardArray, 'enemy');

  clickListener(thisPlayer, 'enemy');

  subscribe('squareAttacked', playerAttack);

  function playerAttack([player, target]) {
    player.makeAttack([target[0], target[1]]);

    renderBoard(enemyBoard.boardArray, 'enemy');

    if (enemyBoard.isFleetSunk()) {
      publish('fleetSunk', [nextPlayerStr, thisPlayerStr]);
      return;
    }
    numAttacks++;

    if (numAttacks === 5) {
      numAttacks = 0;
      unsubscribe('squareAttacked', playerAttack);

      setTimeout(() => {
        changePlayer(
          ownBoard,
          enemyBoard,
          thisPlayer,
          nextPlayer,
          thisPlayerStr,
          nextPlayerStr
        );
      }, 1000);
    }
  }
}

async function changePlayer(
  ownBoard,
  enemyBoard,
  thisPlayer,
  nextPlayer,
  thisPlayerStr,
  nextPlayerStr
) {
  await renderTurnScreen(nextPlayerStr);

  playerTurn(
    enemyBoard,
    ownBoard,
    nextPlayer,
    thisPlayer,
    nextPlayerStr,
    thisPlayerStr
  );
}

;// CONCATENATED MODULE: ./src/index.js


newGame();


/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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LE1BQU07QUFDTjs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLCtCQUErQix3Q0FBd0M7QUFDdkU7QUFDQTtBQUNBO0FBQ0E7O0FBRUEseUJBQXlCLGdCQUFnQjs7QUFFekM7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOzs7QUFHQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE1BQU07QUFDTjtBQUNBO0FBQ0E7QUFDQSxNQUFNO0FBQ047QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLE1BQU07QUFDTjtBQUNBLE1BQU07QUFDTjtBQUNBLE1BQU07QUFDTjtBQUNB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QUVBLElBQUksV0FBVzs7QUFFZjtBQUNBLE1BQU0sT0FBTztBQUNiO0FBQ0E7O0FBRUE7QUFDQSxNQUFNLE9BQU87O0FBRWI7QUFDQSxNQUFNLFdBQVc7O0FBRWpCO0FBQ0EsUUFBUSxPQUFPO0FBQ2Y7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBOztBQUVBLG1DQUFtQyxrQ0FBa0M7QUFDckUsUUFBUSxnQkFBZ0I7QUFDeEIsUUFBUSxnQkFBZ0I7O0FBRXhCLFFBQVEsZ0JBQWdCO0FBQ3hCLFFBQVEsZ0JBQWdCOztBQUV4QixRQUFRLGdCQUFnQjtBQUN4Qjs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsRUFBRSxXQUFXO0FBQ2IsRUFBRSxjQUFjO0FBQ2hCLEVBQUUsZUFBZTs7QUFFakI7QUFDQSxFQUFFLE9BQU87O0FBRVQsRUFBRSxXQUFXO0FBQ2IsRUFBRSxXQUFXOztBQUViLEVBQUUsYUFBYTs7QUFFZixFQUFFLFNBQVM7O0FBRVg7QUFDQTs7QUFFQSxJQUFJLFdBQVc7O0FBRWY7QUFDQSxNQUFNLE9BQU87QUFDYjtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLE1BQU0sV0FBVzs7QUFFakI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsT0FBTztBQUNQO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsUUFBUSxnQkFBZ0I7O0FBRXhCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDOUtvQzs7QUFFcEMsT0FBTyIsInNvdXJjZXMiOlsid2VicGFjazovL2JhdHRsZXNoaXAvLi9zcmMvdXRpbHMuanMiLCJ3ZWJwYWNrOi8vYmF0dGxlc2hpcC8uL3NyYy9wdWJzdWIuanMiLCJ3ZWJwYWNrOi8vYmF0dGxlc2hpcC8uL3NyYy9kb20uanMiLCJ3ZWJwYWNrOi8vYmF0dGxlc2hpcC8uL3NyYy9kcmFnRHJvcC5qcyIsIndlYnBhY2s6Ly9iYXR0bGVzaGlwLy4vc3JjL3BsYXllci5qcyIsIndlYnBhY2s6Ly9iYXR0bGVzaGlwLy4vc3JjL3NoaXBzLmpzIiwid2VicGFjazovL2JhdHRsZXNoaXAvLi9zcmMvZ2FtZWJvYXJkLmpzIiwid2VicGFjazovL2JhdHRsZXNoaXAvLi9zcmMvZ2FtZS5qcyIsIndlYnBhY2s6Ly9iYXR0bGVzaGlwLy4vc3JjL2luZGV4LmpzIl0sInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCBmdW5jdGlvbiBjcmVhdGVOZXdFbGVtZW50KFxuICB0eXBlLFxuICBjbGFzc2VzID0gbnVsbCxcbiAgdGV4dCA9IG51bGwsXG4gIGF0dHJpYnV0ZXMgPSBudWxsXG4pIHtcbiAgbGV0IGNyZWF0ZWRFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCh0eXBlKTtcblxuICBpZiAoY2xhc3Nlcykge1xuICAgIGNyZWF0ZWRFbGVtZW50LmNsYXNzTGlzdC5hZGQoLi4uY2xhc3Nlcyk7XG4gIH1cblxuICBpZiAodGV4dCkge1xuICAgIGNyZWF0ZWRFbGVtZW50LnRleHRDb250ZW50ID0gdGV4dDtcbiAgfVxuXG4gIGlmIChhdHRyaWJ1dGVzKSB7XG4gICAgZm9yIChsZXQga2V5IGluIGF0dHJpYnV0ZXMpIHtcbiAgICAgIGNyZWF0ZWRFbGVtZW50LnNldEF0dHJpYnV0ZShrZXksIGF0dHJpYnV0ZXNba2V5XSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGNyZWF0ZWRFbGVtZW50O1xufVxuIiwiLyogVGhpcyBpcyBhZGFwdGVkIGZyb20gU3RldmUgR3JpZmZpdGgncyBQdWJTdWIgRGVzaWduIFBhdHRlcm4gaW4gSlNcblxuVmlkZW86IGh0dHBzOi8vd3d3LnlvdXR1YmUuY29tL3dhdGNoP3Y9YXluU004bGxPQnNcblJlcG86IGh0dHBzOi8vZ2l0aHViLmNvbS9wcm9mM3Nzb3JTdDN2My9wdWJzdWItZGVtbyAqL1xuXG5jb25zdCBldmVudHMgPSB7fTtcblxuZXhwb3J0IGZ1bmN0aW9uIGdldEV2ZW50cygpIHtcbiAgcmV0dXJuIHsgLi4uZXZlbnRzIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzdWJzY3JpYmUoZXZlbnROYW1lLCBjYWxsYmFjaykge1xuICBldmVudHNbZXZlbnROYW1lXSA9IGV2ZW50c1tldmVudE5hbWVdIHx8IFtdO1xuICBldmVudHNbZXZlbnROYW1lXS5wdXNoKGNhbGxiYWNrKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHVuc3Vic2NyaWJlKGV2ZW50TmFtZSwgY2FsbGJhY2spIHtcbiAgaWYgKGV2ZW50c1tldmVudE5hbWVdKSB7XG4gICAgZXZlbnRzW2V2ZW50TmFtZV0gPSBldmVudHNbZXZlbnROYW1lXS5maWx0ZXIoKGZuKSA9PiBmbiAhPT0gY2FsbGJhY2spO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwdWJsaXNoKGV2ZW50TmFtZSwgZGF0YSkge1xuICBpZiAoZXZlbnRzW2V2ZW50TmFtZV0pIHtcbiAgICBmb3IgKGNvbnN0IGNhbGxiYWNrIG9mIGV2ZW50c1tldmVudE5hbWVdKSB7XG4gICAgICBjYWxsYmFjayhkYXRhKTtcbiAgICB9XG4gIH1cbn1cbiIsImltcG9ydCAnLi9jc3MvY29sb3JzLWFuZC1mb250cy5jc3MnO1xuaW1wb3J0ICcuL2Nzcy9kb20uY3NzJztcbmltcG9ydCAnLi9jc3MvZ2FtZS1zY3JlZW5zLmNzcyc7XG5pbXBvcnQgJy4vY3NzL21vYmlsZS5jc3MnO1xuaW1wb3J0IHsgY3JlYXRlTmV3RWxlbWVudCB9IGZyb20gJy4vdXRpbHMnO1xuaW1wb3J0IHsgc3Vic2NyaWJlLCBwdWJsaXNoIH0gZnJvbSAnLi9wdWJzdWInO1xuXG4vKiBGb3IgdGhlbWVpbmcgKi9cbmNvbnN0IHNoaXBNYXBwaW5nID0ge1xuICBjYXJyaWVyOiAnb2N0b3B1cycsXG4gIGJhdHRsZXNoaXA6ICdwdWZmZXJmaXNoJyxcbiAgZGVzdHJveWVyOiAnZ29sZGZpc2gnLFxuICBzdWJtYXJpbmU6ICdzZWFob3JzZScsXG4gICdwYXRyb2wgYm9hdCc6ICdiZXR0YSBmaXNoJyxcbn07XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVDb250YWluZXJzKCkge1xuICBjb25zdCBib2R5ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignYm9keScpO1xuICBjb25zdCBib2FyZHNDb250YWluZXIgPSBjcmVhdGVOZXdFbGVtZW50KCdtYWluJywgWydwbGF5LWFyZWEnXSk7XG4gIGNvbnN0IGVuZW15Q29udGFpbmVyID0gY3JlYXRlTmV3RWxlbWVudCgnc2VjdGlvbicsIFsnZW5lbXknXSk7XG4gIGNvbnN0IG93bkNvbnRhaW5lciA9IGNyZWF0ZU5ld0VsZW1lbnQoJ3NlY3Rpb24nLCBbJ293biddKTtcbiAgY29uc3QgZW5lbXlCb2FyZEZsZWV0ID0gY3JlYXRlTmV3RWxlbWVudCgnZGl2JywgWydib2FyZC1mbGVldCddKTtcbiAgY29uc3Qgb3duQm9hcmRGbGVldCA9IGNyZWF0ZU5ld0VsZW1lbnQoJ2RpdicsIFsnYm9hcmQtZmxlZXQnXSk7XG5cbiAgZW5lbXlDb250YWluZXIuYXBwZW5kKFxuICAgIGNyZWF0ZU5ld0VsZW1lbnQoJ2gyJywgWydzdWJ0aXRsZScsICdlbmVteS10aXRsZSddLCAnT3Bwb25lbnQgT2NlYW4nKSxcbiAgICBjcmVhdGVOZXdFbGVtZW50KCdoMycsIFsnYW5ub3VuY2UtcGFuZWwnXSksXG4gICAgZW5lbXlCb2FyZEZsZWV0XG4gICk7XG4gIGVuZW15Qm9hcmRGbGVldC5hcHBlbmQoXG4gICAgY3JlYXRlTmV3RWxlbWVudCgnZGl2JywgWydib2FyZCcsICdlbmVteS1ib2FyZCddKSxcbiAgICBjcmVhdGVOZXdFbGVtZW50KCdkaXYnLCBbJ3N1bmstZmxlZXQnXSlcbiAgKTtcblxuICBvd25Db250YWluZXIuYXBwZW5kKFxuICAgIGNyZWF0ZU5ld0VsZW1lbnQoJ2gyJywgWydzdWJ0aXRsZScsICdvd24tdGl0bGUnXSwgJ1lvdXIgT2NlYW4nKSxcbiAgICBjcmVhdGVOZXdFbGVtZW50KCdoMycsIFsnYW5ub3VuY2UtcGFuZWwnXSksXG4gICAgb3duQm9hcmRGbGVldFxuICApO1xuICBvd25Cb2FyZEZsZWV0LmFwcGVuZChcbiAgICBjcmVhdGVOZXdFbGVtZW50KCdkaXYnLCBbJ2JvYXJkJywgJ293bi1ib2FyZCddKSxcbiAgICBjcmVhdGVOZXdFbGVtZW50KCdkaXYnLCBbJ3N1bmstZmxlZXQnXSlcbiAgKTtcblxuICBib2FyZHNDb250YWluZXIuYXBwZW5kKGVuZW15Q29udGFpbmVyLCBvd25Db250YWluZXIpO1xuXG4gIGJvZHkuYXBwZW5kKFxuICAgIGNyZWF0ZU5ld0VsZW1lbnQoJ2gxJywgWyd0aXRsZSddLCAnQmF0dGxlc2NvcGUnKSxcbiAgICBjcmVhdGVOZXdFbGVtZW50KCdoMycsIFsnZ2FtZS1hbm5vdW5jZSddKSxcbiAgICBib2FyZHNDb250YWluZXJcbiAgKTtcblxuICAvKiBHYW1lYm9hcmQgc3F1YXJlcyAqL1xuICBjb25zdCBib2FyZHMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcuYm9hcmQnKTtcbiAgZm9yIChjb25zdCBib2FyZCBvZiBib2FyZHMpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IDEwOyBpKyspIHtcbiAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgMTA7IGorKykge1xuICAgICAgICBjb25zdCBkaXYgPSBjcmVhdGVOZXdFbGVtZW50KCdkaXYnLCBbJ3NxdWFyZSddLCBudWxsLCB7XG4gICAgICAgICAgJ2RhdGEtcG9zJzogYCR7aX0ke2p9YCxcbiAgICAgICAgfSk7XG4gICAgICAgIGJvYXJkLmFwcGVuZENoaWxkKGRpdik7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZW5kZXJCb2FyZChib2FyZCwgc2VjdGlvbikge1xuICBmb3IgKGxldCBpID0gMDsgaSA8IDEwOyBpKyspIHtcbiAgICBmb3IgKGxldCBqID0gMDsgaiA8IDEwOyBqKyspIHtcbiAgICAgIGNvbnN0IHZhbHVlID0gYm9hcmRbaV1bal07XG4gICAgICBjb25zdCBib2FyZFNxdWFyZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXG4gICAgICAgIGAuJHtzZWN0aW9ufS1ib2FyZCBbZGF0YS1wb3M9XCIke2l9JHtqfVwiXWBcbiAgICAgICk7XG4gICAgICBpZiAoIXZhbHVlKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfSBlbHNlIGlmICh2YWx1ZSA9PT0gJ2hpdCcgfHwgdmFsdWUgPT09ICdtaXNzJykge1xuICAgICAgICBib2FyZFNxdWFyZS5jbGFzc0xpc3QuYWRkKHZhbHVlKTtcblxuICAgICAgICAvLyBUaGlzIGlzIG5lY2Vzc2FyeSBvbmx5IGZvciB0aGUgMi1wbGF5ZXIgdmVyc2lvbiB3aGVyZSB0aGUgYm9hcmRzIGFyZSByZWRyYXduIGVhY2ggdHVybjsgdGhlIHNxdWFyZSBpcyBkaXNhYmxlZCB1cG9uIGF0dGFja1xuICAgICAgICBib2FyZFNxdWFyZS5zdHlsZS5wb2ludGVyRXZlbnRzID0gJ25vbmUnOyBcblxuICAgICAgfSBlbHNlIGlmICh2YWx1ZSA9PT0gJ3N1bmsnKSB7XG4gICAgICAgIGJvYXJkU3F1YXJlLmNsYXNzTGlzdC5hZGQodmFsdWUpO1xuICAgICAgICBib2FyZFNxdWFyZS5jbGFzc0xpc3QuYWRkKCdoaXQnKTtcbiAgICAgICAgYm9hcmRTcXVhcmUuc3R5bGUucG9pbnRlckV2ZW50cyA9ICdub25lJztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGJvYXJkU3F1YXJlLmNsYXNzTGlzdC5hZGQodmFsdWUpO1xuICAgICAgICBib2FyZFNxdWFyZS5jbGFzc0xpc3QuYWRkKCdzaGlwJyk7XG5cbiAgICAgICAgLy8gVGFnIG9uZSBzcXVhcmUgcGVyIChvd24pIHNoaXAgZm9yIHNob3dpbmcgdGhlIGFuaW1hbCBpbWFnZVxuICAgICAgICAvLyBFbmVteSBzaGlwcyBzaG93IHRoZWlyIGFuaW1hbCB0eXBlIHdoZW4gY2xhc3Mgc3VuayBpcyBhcHBsaWVkXG4gICAgICAgIGJvYXJkU3F1YXJlLmNsYXNzTGlzdC5hZGQoYCR7dmFsdWVbMF19YCk7XG5cbiAgICAgICAgaWYgKHZhbHVlWzBdID09PSAnYicgJiYgdmFsdWVbMV0gPT09ICcyJykge1xuICAgICAgICAgIGJvYXJkU3F1YXJlLmNsYXNzTGlzdC5hZGQoJ3RhZ2dlZCcpO1xuICAgICAgICB9IGVsc2UgaWYgKHZhbHVlWzBdID09PSAnYycgJiYgdmFsdWVbMV0gPT09ICczJykge1xuICAgICAgICAgIGJvYXJkU3F1YXJlLmNsYXNzTGlzdC5hZGQoJ3RhZ2dlZCcpO1xuICAgICAgICB9IGVsc2UgaWYgKCh2YWx1ZVswXSA9PT0gJ3MnIHx8IHZhbHVlWzBdID09PSAnZCcpICYmIHZhbHVlWzFdID09PSAnMicpIHtcbiAgICAgICAgICBib2FyZFNxdWFyZS5jbGFzc0xpc3QuYWRkKCd0YWdnZWQnKTtcbiAgICAgICAgfSBlbHNlIGlmICh2YWx1ZVswXSA9PT0gJ3AnICYmIHZhbHVlWzFdID09PSAnMScpIHtcbiAgICAgICAgICBib2FyZFNxdWFyZS5jbGFzc0xpc3QuYWRkKCd0YWdnZWQnKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG4vLyBGb3IgdHdvLXBsYXllciBtb2RlLCB3aGVyZSB0aGUgYm9hcmRzIGFyZSBjbGVhcmVkIGFuZCBzd2FwcGVkIGVhY2ggdHVybi9kZXZpY2UgcGFzc1xuZXhwb3J0IGZ1bmN0aW9uIGNsZWFyQm9hcmRzKCkge1xuICBjb25zdCBib2FyZHMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcuYm9hcmQnKTtcbiAgZm9yIChjb25zdCBib2FyZCBvZiBib2FyZHMpIHtcbiAgICBib2FyZC5pbm5lckhUTUwgPSAnJztcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IDEwOyBpKyspIHtcbiAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgMTA7IGorKykge1xuICAgICAgICBjb25zdCBkaXYgPSBjcmVhdGVOZXdFbGVtZW50KCdkaXYnLCBbJ3NxdWFyZSddLCBudWxsLCB7XG4gICAgICAgICAgJ2RhdGEtcG9zJzogYCR7aX0ke2p9YCxcbiAgICAgICAgfSk7XG4gICAgICAgIGJvYXJkLmFwcGVuZENoaWxkKGRpdik7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzd2FwU3Vua0ZsZWV0cygpIHtcbiAgY29uc3Qgb3duQm9hcmRBcmVhID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgLm93biAuYm9hcmQtZmxlZXRgKTtcbiAgY29uc3QgZW5lbXlCb2FyZEFyZWEgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAuZW5lbXkgLmJvYXJkLWZsZWV0YCk7XG5cbiAgZW5lbXlCb2FyZEFyZWEuYXBwZW5kQ2hpbGQoZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgLm93biAuc3Vuay1mbGVldGApKTtcbiAgb3duQm9hcmRBcmVhLmFwcGVuZENoaWxkKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYC5lbmVteSAuc3Vuay1mbGVldGApKTtcbn1cblxuLy8gSW4gdGhlIDEtcGxheWVyIHZlcnNpb24sIGRhdGEgYWJvdXQgd2hpY2gga2luZCBvZiBzaGlwIGhhcyBiZWVuIHN1bmsgaXMgc3RvcmVkIGluIGNsYXNzZXMgb24gdGhlIGJvYXJkOyBpbiB0aGUgMi1wbGF5ZXIgdmVyc2lvbiwgIHRoZSBib2FyZHMgYXJlIGNsZWFyZWQgZWFjaCB0dXJuIHNvIHRoZSBkYXRhIGlzIHN0b3JlZCBvbiB0aGUgc3VuayBmbGVldCBkaXYgYW5kIHRoZSBjbGFzc2VzIHJlYXBwbGllZCB0byB0aGUgYm9hcmQgdXBvbiBlYWNoIHR1cm5cbmV4cG9ydCBmdW5jdGlvbiByZU1hcmtTdW5rU2hpcHMoKSB7XG4gIGNvbnN0IHNlY3Rpb25zID0gWydvd24nLCAnZW5lbXknXTtcbiAgZm9yIChjb25zdCBzZWN0aW9uIG9mIHNlY3Rpb25zKSB7XG4gICAgY29uc3QgbXlTdW5rU2hpcHMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKGAuJHtzZWN0aW9ufSAuc3Vuay1mbGVldCAuc2hpcC1yZW5kZXJgKVxuICAgIGlmIChteVN1bmtTaGlwcykge1xuICAgICAgZm9yIChjb25zdCBzaGlwIG9mIG15U3Vua1NoaXBzKSB7XG4gICAgICAgIGNvbnN0IGxvYyA9IHNoaXAuZGF0YXNldC5sb2M7XG4gICAgICAgIGNvbnN0IHR5cGUgPSBzaGlwLmRhdGFzZXQudHlwZVswXTtcbiAgICAgICAgY29uc3Qgc3Vua1NxdWFyZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYC4ke3NlY3Rpb259IFtkYXRhLXBvcz1cIiR7bG9jfVwiYClcbiAgICAgICAgc3Vua1NxdWFyZS5jbGFzc0xpc3QuYWRkKHR5cGUsICdoaXQnLCAnc2hpcCcsICd0YWdnZWQnKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxufVxuXG5leHBvcnQgZnVuY3Rpb24gY2xpY2tMaXN0ZW5lcihwbGF5ZXIsIHNlY3Rpb24pIHtcbiAgY29uc3QgdGFyZ2V0Q29udGFpbmVyID0gZG9jdW1lbnQucXVlcnlTZWxlY3Rvcihgc2VjdGlvbi4ke3NlY3Rpb259YCk7XG5cbiAgY29uc3QgdGFyZ2V0U3F1YXJlcyA9IHRhcmdldENvbnRhaW5lci5xdWVyeVNlbGVjdG9yQWxsKCcuc3F1YXJlJyk7XG4gIHRhcmdldFNxdWFyZXMuZm9yRWFjaCgoc3F1YXJlKSA9PiB7XG4gICAgc3F1YXJlLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKGV2KSA9PiB7XG4gICAgICBjbGlja0F0dGFjayhldiwgcGxheWVyKTtcbiAgICB9KTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGNsaWNrQXR0YWNrKGV2LCBwbGF5ZXIpIHtcbiAgLy8gR2FtZWJvYXJkIGNvbnN1bWVzIHRoZSBldmVudCBlbWl0dGVkIGhlcmVcbiAgcHVibGlzaCgnc3F1YXJlQXR0YWNrZWQnLCBbcGxheWVyLCBldi50YXJnZXQuZGF0YXNldC5wb3NdKTtcblxuICAvLyBUaGF0IHNxdWFyZSBjYW4gbm8gbG9uZ2VyIGJlIHRhcmdldGVkXG4gIGV2LnRhcmdldC5zdHlsZS5wb2ludGVyRXZlbnRzID0gJ25vbmUnO1xuXG4gIC8vIFRpbWUgdW50aWwgbmV4dCBodW1hbiBjbGljayBjYW4gYmUgcmVnaXN0ZXJlZCBvbiBhbnkgc3F1YXJlXG4gIGV2LnRhcmdldC5wYXJlbnRFbGVtZW50LnN0eWxlLnBvaW50ZXJFdmVudHMgPSAnbm9uZSc7XG4gIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgIGV2LnRhcmdldC5wYXJlbnRFbGVtZW50LnN0eWxlLnBvaW50ZXJFdmVudHMgPSAnaW5pdGlhbCc7XG4gIH0sIDUwKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG1ha2VBbm5vdW5jZW1lbnRzKCkge1xuICBjb25zdCBnYW1lUGFuZWwgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuZ2FtZS1hbm5vdW5jZScpO1xuICBjb25zdCBib2FyZHNDb250YWluZXIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdtYWluJyk7XG5cbiAgbGV0IHBhbmVsO1xuICBsZXQgc3Vua0ZsZWV0O1xuXG4gIC8vIEdhbWUgbG9vcCBlbWl0cyBldmVudCB3aGVuIGFjdGl2ZSBwYW5lbCBpcyBzd2l0Y2hlZFxuICBzdWJzY3JpYmUoJ3RhcmdldENoYW5nZScsIGNoYW5nZVBhbmVsKTtcblxuICBmdW5jdGlvbiBjaGFuZ2VQYW5lbCh0YXJnZXQpIHtcbiAgICBwYW5lbCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYC4ke3RhcmdldH0gLmFubm91bmNlLXBhbmVsYCk7XG4gICAgc3Vua0ZsZWV0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgLiR7dGFyZ2V0fSAuc3Vuay1mbGVldGApO1xuICB9XG5cbiAgY29uc3QgYW5ub3VuY2VQYW5lbHMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcuYW5ub3VuY2UtcGFuZWwnKTtcblxuICAvLyBUaW1pbmcgb2YgYW5ub3VuY2VtZW50cyBhcmUgY29udHJvbGxlZCBieSBDU1MgdHJhbnNpdGlvbnNcbiAgZm9yIChjb25zdCBwYW5lbCBvZiBhbm5vdW5jZVBhbmVscykge1xuICAgIHBhbmVsLmFkZEV2ZW50TGlzdGVuZXIoJ3RyYW5zaXRpb25lbmQnLCAoKSA9PiB7XG4gICAgICBwYW5lbC5jbGFzc0xpc3QucmVtb3ZlKCd2aXNpYmxlJyk7XG4gICAgICBwYW5lbC5jbGFzc0xpc3QucmVtb3ZlKCdoaXQnKTtcbiAgICB9KTtcbiAgfVxuXG4gIHN1YnNjcmliZSgnaGl0JywgYW5ub3VuY2VIaXQpO1xuICBzdWJzY3JpYmUoJ21pc3MnLCBhbm5vdW5jZU1pc3MpO1xuICBzdWJzY3JpYmUoJ3NoaXBTdW5rJywgYW5ub3VuY2VTdW5rU2hpcCk7XG4gIHN1YnNjcmliZSgnZmxlZXRTdW5rJywgYW5ub3VuY2VXaW4pO1xuICBzdWJzY3JpYmUoJ2ZsZWV0U3VuaycsIGVuZEdhbWUpO1xuICBzdWJzY3JpYmUoJ3NoaXBTdW5rJywgcmVuZGVyU3Vua1NoaXApO1xuXG4gIC8vIFRoZXNlIGZ1bmN0aW9ucyB1c2VkIHRvIGFubm91bmNlIGhpdCBsb2NhdGlvbnMgYXMgd2VsbFxuICAvLyBmb3Igbm93IGxlYXZpbmcgbG9jYXRpb24gZGF0YSBhcyBhIHBhcmFtZXRlciBoZXJlIGluIGNhc2UgdGhhdCBpcyByZS1pbXBsZW1lbnRlZFxuICBmdW5jdGlvbiBhbm5vdW5jZUhpdChbcm93LCBjb2x1bW5dKSB7XG4gICAgcGFuZWwuY2xhc3NMaXN0LmFkZCgndmlzaWJsZScpO1xuICAgIHBhbmVsLmNsYXNzTGlzdC5hZGQoJ2hpdCcpO1xuICAgIHBhbmVsLnRleHRDb250ZW50ID0gYFNvbWV0aGluZydzIGJlZW4gc3BvdHRlZCFgO1xuICB9XG5cbiAgZnVuY3Rpb24gYW5ub3VuY2VNaXNzKCkge1xuICAgIHBhbmVsLmNsYXNzTGlzdC5hZGQoJ3Zpc2libGUnKTtcbiAgICBwYW5lbC50ZXh0Q29udGVudCA9IGBOb3RoaW5nIWA7XG4gIH1cblxuICBmdW5jdGlvbiBhbm5vdW5jZVN1bmtTaGlwKFtoaXRTaGlwLCBbcm93LCBjb2x1bW5dXSkge1xuICAgIHBhbmVsLmNsYXNzTGlzdC5hZGQoJ3Zpc2libGUnKTtcbiAgICBjb25zdCBjcmVhdHVyZSA9IHNoaXBNYXBwaW5nW2Ake2hpdFNoaXAudHlwZX1gXTtcbiAgICBwYW5lbC50ZXh0Q29udGVudCA9IGBJdCdzIGEgJHtjcmVhdHVyZX0hIWA7XG4gIH1cblxuICBmdW5jdGlvbiBhbm5vdW5jZVdpbihbbG9zZXIsIHdpbm5lcl0pIHtcbiAgICBnYW1lUGFuZWwuY2xhc3NMaXN0LmFkZCgnd2luJyk7XG4gICAgZ2FtZVBhbmVsLnRleHRDb250ZW50ID0gYCR7bG9zZXJ9J3Mgc2VhIGNyZWF0dXJlcyBoYXZlIGJlZW4gZm91bmQhICR7d2lubmVyfSB3aW5zIWA7XG4gIH1cblxuICBmdW5jdGlvbiBlbmRHYW1lKCkge1xuICAgIC8vIENvbGxhcHNlIGJvYXJkIGFubm91bmNlIHBhbmVsc1xuICAgIGZvciAoY29uc3QgcGFuZWwgb2YgYW5ub3VuY2VQYW5lbHMpIHtcbiAgICAgIHBhbmVsLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgfVxuICAgIC8vIERpc2FibGUgZnVydGhlciBjbGlja2luZ1xuICAgIGJvYXJkc0NvbnRhaW5lci5zdHlsZS5wb2ludGVyRXZlbnRzID0gJ25vbmUnO1xuXG4gICAgLy8gQnV0dG9uIHRvIHJlc3RhcnQgKHJlbG9hZCkgZ2FtZVxuICAgIGNvbnN0IHBsYXlBZ2FpbiA9IGNyZWF0ZU5ld0VsZW1lbnQoJ2J1dHRvbicsIFsncGxheS1hZ2FpbiddLCAnUGxheSBBZ2FpbicpO1xuXG4gICAgcGxheUFnYWluLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKGV2KSA9PiB7XG4gICAgICBldi5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgbG9jYXRpb24ucmVsb2FkKCk7XG4gICAgfSk7XG5cbiAgICBnYW1lUGFuZWwuYXBwZW5kQ2hpbGQocGxheUFnYWluKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlbmRlclN1bmtTaGlwKFtoaXRTaGlwLCBbcm93LCBjb2x1bW5dXSkge1xuICAgIGNvbnN0IHNoaXBSZW5kZXIgPSBjcmVhdGVOZXdFbGVtZW50KCdkaXYnLCBbXG4gICAgICAnc2hpcC1yZW5kZXInLFxuICAgICAgYCR7aGl0U2hpcC50eXBlWzBdfWAsXG4gICAgXSk7XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGhpdFNoaXAubGVuZ3RoOyBpKyspIHtcbiAgICAgIHNoaXBSZW5kZXIuYXBwZW5kQ2hpbGQoY3JlYXRlTmV3RWxlbWVudCgnZGl2JywgWydzaGlwLXBhcnQnXSkpO1xuICAgIH1cblxuICAgIHN1bmtGbGVldC5hcHBlbmRDaGlsZChzaGlwUmVuZGVyKTtcblxuICAgIC8vIEEgdmVyeSB3ZWlyZCB3b3JrYXJvdW5kIHRvIHN0b3J5aW5nIHN1bmsgc2hpcCBkYXRhIGZvciB0aGUgdHdvIHBsYXllciB2ZXJzaW9uIHdoZXJlIHRoZSBib2FyZHMgYXJlIHJlZHJhd24gKGluIHRoZSAxLXBsYXllciB0aGlzIGlzIHN0b3JlZCBpbiBjbGFzc2VzKVxuICAgIHNoaXBSZW5kZXIuZGF0YXNldC5sb2MgPSBgJHtyb3d9JHtjb2x1bW59YDtcbiAgICBzaGlwUmVuZGVyLmRhdGFzZXQudHlwZSA9IGhpdFNoaXAudHlwZTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVuZGVyU3RhcnRTY3JlZW4oKSB7XG4gIGNvbnN0IGJvZHkgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdib2R5Jyk7XG4gIGNvbnN0IHBsYXllcjEgPSBjcmVhdGVOZXdFbGVtZW50KFxuICAgICdidXR0b24nLFxuICAgIFsnc2luZ2xlLXBsYXllci1idXR0b24nXSxcbiAgICAnMS1QbGF5ZXInXG4gICk7XG4gIGNvbnN0IHBsYXllcjIgPSBjcmVhdGVOZXdFbGVtZW50KCdidXR0b24nLCBbJ3R3by1wbGF5ZXItYnV0dG9uJ10sICcyLVBsYXllcicpO1xuXG4gIGNvbnN0IHN0YXJ0U2NyZWVuID0gY3JlYXRlTmV3RWxlbWVudCgnZGl2JywgWydzdGFydC1zY3JlZW4nXSk7XG4gIHN0YXJ0U2NyZWVuLmFwcGVuZChcbiAgICBjcmVhdGVOZXdFbGVtZW50KCdoMScsIFsnc3RhcnQtdGl0bGUnXSwgJ0JhdHRsZVNDT1BFJyksXG4gICAgY3JlYXRlTmV3RWxlbWVudCgnZGl2JywgWydzY29wZSddKSxcbiAgICBjcmVhdGVOZXdFbGVtZW50KFxuICAgICAgJ2gyJyxcbiAgICAgIFsnc3RhcnQtc3VidGl0bGUnXSxcbiAgICAgICdBIGZyaWVuZGxpZXIgdGFrZSBvbiB0aGUgY2xhc3NpYyBnYW1lIEJhdHRsZXNoaXAnXG4gICAgKSxcbiAgICBjcmVhdGVOZXdFbGVtZW50KFxuICAgICAgJ3AnLFxuICAgICAgWydkaXJlY3Rpb25zJ10sXG4gICAgICBcIkRJUkVDVElPTlM6IEV4cGxvcmUgeW91ciBvcHBvbmVudCdzIG9jZWFuIHdpdGggeW91ciB1bmRlcndhdGVyIHNjb3BlLiBUaGUgZmlyc3QgdG8gc3BvdCBhbGwgZml2ZSBzZWEgY3JlYXR1cmVzIHdpbnMhIEluIDItUExBWUVSLU1PREUgZWFjaCB0dXJuIGdyYW50cyBmaXZlIHNjb3BlIGF0dGVtcHRzLlwiXG4gICAgKSxcbiAgICBwbGF5ZXIxLFxuICAgIHBsYXllcjJcbiAgKTtcblxuICBib2R5LmFwcGVuZChzdGFydFNjcmVlbik7XG5cbiAgcmV0dXJuIFtwbGF5ZXIxLCBwbGF5ZXIyXTsgLy8gdG8gY29udHJvbCBnYW1lIHR5cGUgZnJvbSBnYW1lIG1vZHVsZVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVuZGVyVHVyblNjcmVlbihwbGF5ZXIpIHtcbiAgY29uc3QgYm9keSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ2JvZHknKTtcbiAgY29uc3QgcmVhZHlCdXR0b24gPSBjcmVhdGVOZXdFbGVtZW50KCdidXR0b24nLCBbJ3JlYWR5LWJ1dHRvbiddLCAnUmVhZHknKTtcblxuICBjb25zdCB0dXJuU2NyZWVuID0gY3JlYXRlTmV3RWxlbWVudCgnZGl2JywgWyd0dXJuLXNjcmVlbiddKTtcbiAgdHVyblNjcmVlbi5hcHBlbmQoXG4gICAgY3JlYXRlTmV3RWxlbWVudChcbiAgICAgICdoMicsXG4gICAgICBbJ3R1cm4taW5zdHJ1Y3Rpb25zJ10sXG4gICAgICBgUGxlYXNlIHBhc3MgdGhlIGRldmljZSB0byAke3BsYXllcn0uIEhpdCByZWFkeSB3aGVuIGRldmljZSBpcyBwYXNzZWRgXG4gICAgKSxcbiAgICByZWFkeUJ1dHRvblxuICApO1xuXG4gIGJvZHkuYXBwZW5kKHR1cm5TY3JlZW4pO1xuXG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgIHJlYWR5QnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKGV2KSA9PiB7XG4gICAgICBldi5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgdHVyblNjcmVlbi5wYXJlbnRFbGVtZW50LnJlbW92ZUNoaWxkKHR1cm5TY3JlZW4pO1xuICAgICAgcmVzb2x2ZSh0cnVlKTtcbiAgICB9KTtcbiAgfSk7XG59XG4iLCJpbXBvcnQgeyBjcmVhdGVOZXdFbGVtZW50IH0gZnJvbSAnLi91dGlscyc7XG5cbmV4cG9ydCBmdW5jdGlvbiByZW5kZXJTaGlwU2NyZWVuKGdhbWVib2FyZCkge1xuICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdtYWluJykuc3R5bGUuZGlzcGxheSA9ICdub25lJztcblxuICAvLyBIaWRlcyB0aXRsZSBhbmQgZGlzYWJsZXMgb3ZlcmZsb3cgb24gbW9iaWxlXG4gIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy50aXRsZScpLmNsYXNzTGlzdC5hZGQoJ2hpZGRlbicpO1xuICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdodG1sJykuY2xhc3NMaXN0LmFkZCgnZHJhZ2dpbmcnKTtcblxuICBjb25zdCByYW5kb21pemUgPSBjcmVhdGVOZXdFbGVtZW50KCdidXR0b24nLCBbJ3JhbmRvbWl6ZSddLCAnUmFuZG9taXplJyk7XG4gIGNvbnN0IHN0YXJ0ID0gY3JlYXRlTmV3RWxlbWVudCgnYnV0dG9uJywgWydzdGFydCddLCAnU3RhcnQnKTtcblxuICBjb25zdCBzaGlwU2NyZWVuID0gY3JlYXRlTmV3RWxlbWVudCgnZGl2JywgWydzaGlwLXNjcmVlbiddKTtcbiAgc2hpcFNjcmVlbi5hcHBlbmQoXG4gICAgY3JlYXRlTmV3RWxlbWVudCgnaDInLCBbJ3NoaXAtc3VidGl0bGUnXSwgJ0hpZGUgeW91ciB3aWxkbGlmZScpLFxuICAgIGNyZWF0ZU5ld0VsZW1lbnQoXG4gICAgICAncCcsXG4gICAgICBbJ2RpcmVjdGlvbnMnXSxcbiAgICAgICdEcmFnIGFuZCBkcm9wIHRvIG1vdmUsIGNsaWNrIHRvIGNoYW5nZSBvcmllbnRhdGlvbi4gV2lsZGxpZmUgY2Fubm90IGJlIGFkamFjZW50IHRvIG90aGVyIHdpbGRsaWZlJ1xuICAgICksXG4gICAgcmFuZG9taXplLFxuICAgIHN0YXJ0XG4gICk7XG5cbiAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignYm9keScpLmFwcGVuZChzaGlwU2NyZWVuKTtcblxuICAvKiBDcmVhdGUgYmxhbmsgYm9hcmQgKi9cbiAgY29uc3QgYm9hcmQgPSBjcmVhdGVOZXdFbGVtZW50KCdkaXYnLCBbJ2RyYWctYm9hcmQnXSk7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgMTA7IGkrKykge1xuICAgIGZvciAobGV0IGogPSAwOyBqIDwgMTA7IGorKykge1xuICAgICAgY29uc3QgZGl2ID0gY3JlYXRlTmV3RWxlbWVudCgnZGl2JywgWydkcmFnLXNxdWFyZSddLCBudWxsLCB7XG4gICAgICAgICdkYXRhLXBvcyc6IGAke2l9JHtqfWAsXG4gICAgICB9KTtcbiAgICAgIGJvYXJkLmFwcGVuZENoaWxkKGRpdik7XG4gICAgfVxuICB9XG5cbiAgLy8gSSBmb3JnZXQgd2h5IEkgZGlkIHRoaXNcbiAgc2hpcFNjcmVlbi5pbnNlcnRCZWZvcmUoYm9hcmQsIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5yYW5kb21pemUnKSk7XG5cbiAgLy8gQ3JlYXRlIHNoaXAgRE9NIGVsZW1lbnRzXG4gIHBsYWNlRHJhZ2dhYmxlU2hpcHMoZ2FtZWJvYXJkKTtcblxuICAvLyBBZGQgZXZlbnQgbGlzdGVuZXJzIHRvIGJvYXJkXG4gIGxpc3RlbkZvckRyYWdEcm9wRXZlbnRzKGdhbWVib2FyZCk7IC8vIG1vdXNlIG9ubHlcbiAgbGlzdGVuRm9yVG91Y2hFdmVudHMoZ2FtZWJvYXJkKTsgLy8gdG91Y2hcblxuICAvLyBCdXR0b24gZXZlbnQgbGlzdGVuZXJzXG4gIHJhbmRvbWl6ZS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIChldikgPT4ge1xuICAgIGV2LnByZXZlbnREZWZhdWx0KCk7XG4gICAgZ2FtZWJvYXJkLmNsZWFyQm9hcmQoKTtcbiAgICBnYW1lYm9hcmQucGxhY2VBbGxTaGlwc1JhbmRvbWx5KCk7XG4gICAgY2xlYXJEcmFnZ2FibGVTaGlwcygpO1xuICAgIHBsYWNlRHJhZ2dhYmxlU2hpcHMoZ2FtZWJvYXJkKTtcbiAgfSk7XG5cbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgc3RhcnQuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoZXYpID0+IHtcbiAgICAgIGV2LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICBzaGlwU2NyZWVuLnBhcmVudEVsZW1lbnQucmVtb3ZlQ2hpbGQoc2hpcFNjcmVlbik7XG4gICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdtYWluJykuc3R5bGUuZGlzcGxheSA9ICdmbGV4JztcbiAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ2h0bWwnKS5jbGFzc0xpc3QucmVtb3ZlKCdkcmFnZ2luZycpO1xuICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLnRpdGxlJykuY2xhc3NMaXN0LnJlbW92ZSgnaGlkZGVuJyk7XG4gICAgICByZXNvbHZlKHRydWUpO1xuICAgIH0pO1xuICB9KTtcbn1cblxuZnVuY3Rpb24gbGlzdGVuRm9yRHJhZ0Ryb3BFdmVudHMoZ2FtZWJvYXJkKSB7XG4gIGxldCB0aGlzRHJhZ0VsZW1lbnQ7XG4gIGNvbnN0IGRyYWdCb2FyZCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5kcmFnLWJvYXJkJyk7XG4gIGRyYWdCb2FyZC5hZGRFdmVudExpc3RlbmVyKCdkcmFnc3RhcnQnLCAoZXYpID0+IHtcbiAgICBldi5kYXRhVHJhbnNmZXIuZWZmZWN0QWxsb3dlZCA9IFwibW92ZVwiOyAvLyBUbyBnZXQgcmlkIG9mIHRoZSBncmVlbiBwbHVzIGljb24gaW4gQ2hyb21lXG4gICAgZXYuZGF0YVRyYW5zZmVyLmRyb3BFZmZlY3QgPSBcIm1vdmVcIjtcbiAgICB0aGlzRHJhZ0VsZW1lbnQgPSBldi50YXJnZXQ7XG4gIH0pO1xuXG4gIGRyYWdCb2FyZC5hZGRFdmVudExpc3RlbmVyKCdkcmFnZW50ZXInLCAoZXYpID0+IHtcbiAgICBpZiAoZXYudGFyZ2V0LmNsYXNzTmFtZSA9PT0gJ2RyYWctc3F1YXJlJykge1xuICAgICAgZXYudGFyZ2V0LnN0eWxlLmJhY2tncm91bmRDb2xvciA9ICdwdXJwbGUnO1xuICAgIH1cbiAgfSk7XG5cbiAgZHJhZ0JvYXJkLmFkZEV2ZW50TGlzdGVuZXIoJ2RyYWdsZWF2ZScsIChldikgPT4ge1xuICAgIGlmIChldi50YXJnZXQuY2xhc3NOYW1lID09PSAnZHJhZy1zcXVhcmUnKSB7XG4gICAgICBldi50YXJnZXQuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gJyc7XG4gICAgfVxuICB9KTtcblxuICBkcmFnQm9hcmQuYWRkRXZlbnRMaXN0ZW5lcignZHJhZ292ZXInLCAoZXYpID0+IHtcbiAgICAvLyBNRE4gc2F5cyB0aGlzIGlzIG5lY2Vzc2FyeSB0byBhbGxvdyBkcm9wXG4gICAgZXYucHJldmVudERlZmF1bHQoKTtcbiAgfSk7XG5cbiAgLy8gRHJhZyBhbmQgZHJvcCB0byB1cGRhdGUgcG9zaXRpb25cbiAgZHJhZ0JvYXJkLmFkZEV2ZW50TGlzdGVuZXIoJ2Ryb3AnLCAoZXYpID0+IHtcbiAgICBldi5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgaWYgKGV2LnRhcmdldC5jbGFzc05hbWUgPT09ICdkcmFnLXNxdWFyZScpIHtcbiAgICAgIGV2LnRhcmdldC5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSAnJztcblxuICAgICAgY29uc3QgY29vcmRzID0gWytldi50YXJnZXQuZGF0YXNldC5wb3NbMF0sICtldi50YXJnZXQuZGF0YXNldC5wb3NbMV1dO1xuXG4gICAgICBjb25zdCBsZW5ndGggPSB0aGlzRHJhZ0VsZW1lbnQuZGF0YXNldC5sZW5ndGg7XG4gICAgICBjb25zdCB0eXBlID0gdGhpc0RyYWdFbGVtZW50LmRhdGFzZXQudHlwZTtcbiAgICAgIGNvbnN0IG9yaWVudGF0aW9uID0gdGhpc0RyYWdFbGVtZW50LmRhdGFzZXQub3JpZW50YXRpb247XG5cbiAgICAgICAgLy8gY29uc29sZS5sb2coY29vcmRzLCB0eXBlLCBvcmllbnRhdGlvbik7XG5cbiAgICAgIHRyeSB7XG4gICAgICAgIGdhbWVib2FyZC5pc1NoaXBMZWdhbCh0eXBlLCBsZW5ndGgsIG9yaWVudGF0aW9uLCBjb29yZHMpO1xuICAgICAgICAvLyBjb25zb2xlLmxvZygndGhpcyB3YXMgYSBsZWdhbCBwbGFjZW1lbnQnKTtcblxuICAgICAgICB1cGRhdGVHYW1lYm9hcmQoZ2FtZWJvYXJkLCB0eXBlLCBjb29yZHMsIG9yaWVudGF0aW9uKTtcblxuICAgICAgICBldi50YXJnZXQuYXBwZW5kQ2hpbGQodGhpc0RyYWdFbGVtZW50KTtcblxuICAgICAgICB0aGlzRHJhZ0VsZW1lbnQuZGF0YXNldC5wb3MgPSBldi50YXJnZXQuZGF0YXNldC5wb3M7XG4gICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhlcnJvcik7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKCd0aGlzIHdhcyBub3QgYSBsZWdhbCBwbGFjZW1lbnQnKTtcbiAgICAgIH1cbiAgICB9XG4gIH0pO1xufVxuXG5mdW5jdGlvbiBsaXN0ZW5Gb3JUb3VjaEV2ZW50cyhnYW1lYm9hcmQpIHtcbiAgY29uc3QgZHJhZ0JvYXJkID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLmRyYWctYm9hcmQnKTtcbiAgbGV0IHRoaXNEcmFnRWxlbWVudDtcblxuICBsZXQgaW5pdGlhbFBvcztcbiAgbGV0IGRyYWdnaW5nID0gZmFsc2U7XG5cbiAgZHJhZ0JvYXJkLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCAoZXYpID0+IHtcbiAgICBpZiAoZXYudGFyZ2V0LmNsYXNzTGlzdC5jb250YWlucygnZHJhZ2dhYmxlLXNoaXAnKSkge1xuICAgICAgdGhpc0RyYWdFbGVtZW50ID0gZXYudGFyZ2V0O1xuICAgIH1cbiAgICBpbml0aWFsUG9zID0gW2V2LnRvdWNoZXNbMF0uY2xpZW50WCwgZXYudG91Y2hlc1swXS5jbGllbnRZXTtcbiAgfSk7XG5cbiAgZHJhZ0JvYXJkLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNobW92ZScsIChldikgPT4ge1xuICAgIGlmICh0aGlzRHJhZ0VsZW1lbnQpIHtcbiAgICAgIHRoaXNEcmFnRWxlbWVudC5zdHlsZS5vcGFjaXR5ID0gJzAuNSc7XG4gICAgICB0aGlzRHJhZ0VsZW1lbnQuc3R5bGUudHJhbnNmb3JtID0gYHRyYW5zbGF0ZSgke1xuICAgICAgICBldi50b3VjaGVzWzBdLmNsaWVudFggLSBpbml0aWFsUG9zWzBdXG4gICAgICB9cHgsICR7ZXYudG91Y2hlc1swXS5jbGllbnRZIC0gaW5pdGlhbFBvc1sxXX1weCkgJHtcbiAgICAgICAgdGhpc0RyYWdFbGVtZW50LmRhdGFzZXQub3JpZW50YXRpb24gPT09ICd2ZXJ0aWNhbCdcbiAgICAgICAgICA/ICdyb3RhdGUoOTBkZWcpJ1xuICAgICAgICAgIDogJydcbiAgICAgIH1gO1xuICAgICAgZHJhZ2dpbmcgPSB0cnVlO1xuICAgIH1cbiAgfSk7XG5cbiAgZHJhZ0JvYXJkLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoZW5kJywgKGV2KSA9PiB7XG4gICAgaWYgKGRyYWdnaW5nICYmIHRoaXNEcmFnRWxlbWVudCkge1xuICAgICAgY29uc3QgdG91Y2hlZERpdnMgPSBkb2N1bWVudC5lbGVtZW50c0Zyb21Qb2ludChcbiAgICAgICAgdGhpc0RyYWdFbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLngsXG4gICAgICAgIHRoaXNEcmFnRWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS55XG4gICAgICApO1xuXG4gICAgICB0b3VjaGVkRGl2cy5mb3JFYWNoKChkaXYpID0+IHtcbiAgICAgICAgY29uc3QgY29ybmVyRGl2ID0gZGl2O1xuXG4gICAgICAgIGlmIChjb3JuZXJEaXYuY2xhc3NMaXN0LmNvbnRhaW5zKCdkcmFnLXNxdWFyZScpKSB7XG4gICAgICAgICAgY29uc3QgY29vcmRzID0gWytjb3JuZXJEaXYuZGF0YXNldC5wb3NbMF0sICtjb3JuZXJEaXYuZGF0YXNldC5wb3NbMV1dO1xuXG4gICAgICAgICAgY29uc3QgbGVuZ3RoID0gdGhpc0RyYWdFbGVtZW50LmRhdGFzZXQubGVuZ3RoO1xuICAgICAgICAgIGNvbnN0IHR5cGUgPSB0aGlzRHJhZ0VsZW1lbnQuZGF0YXNldC50eXBlO1xuICAgICAgICAgIGNvbnN0IG9yaWVudGF0aW9uID0gdGhpc0RyYWdFbGVtZW50LmRhdGFzZXQub3JpZW50YXRpb247XG5cbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGNvb3JkcywgdHlwZSwgb3JpZW50YXRpb24pO1xuXG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGdhbWVib2FyZC5pc1NoaXBMZWdhbCh0eXBlLCBsZW5ndGgsIG9yaWVudGF0aW9uLCBjb29yZHMpO1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coJ3RoaXMgd2FzIGEgbGVnYWwgcGxhY2VtZW50Jyk7XG5cbiAgICAgICAgICAgIHVwZGF0ZUdhbWVib2FyZChnYW1lYm9hcmQsIHR5cGUsIGNvb3Jkcywgb3JpZW50YXRpb24pO1xuXG4gICAgICAgICAgICBjb3JuZXJEaXYuYXBwZW5kQ2hpbGQodGhpc0RyYWdFbGVtZW50KTtcblxuICAgICAgICAgICAgdGhpc0RyYWdFbGVtZW50LmRhdGFzZXQucG9zID0gY29ybmVyRGl2LmRhdGFzZXQucG9zO1xuICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhlcnJvcik7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZygndGhpcyB3YXMgbm90IGEgbGVnYWwgcGxhY2VtZW50Jyk7XG4gICAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgIHRoaXNEcmFnRWxlbWVudC5zdHlsZS50cmFuc2Zvcm0gPSAnJztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgdGhpc0RyYWdFbGVtZW50LnN0eWxlLm9wYWNpdHkgPSAnMSc7XG4gICAgICB0aGlzRHJhZ0VsZW1lbnQuc3R5bGUudHJhbnNmb3JtID0gJyc7XG4gICAgICB0aGlzRHJhZ0VsZW1lbnQgPSB1bmRlZmluZWQ7XG4gICAgICBkcmFnZ2luZyA9IGZhbHNlO1xuICAgIH1cbiAgfSk7XG59XG5cbi8qIFB1dCBkcmFnZ2FibGUgZWxlbWVudHMgYXQgZWFjaCBzaGlwIGxvY2F0aW9uICovXG5mdW5jdGlvbiBwbGFjZURyYWdnYWJsZVNoaXBzKGdhbWVib2FyZCkge1xuICBmb3IgKGxldCBpID0gMDsgaSA8IDEwOyBpKyspIHtcbiAgICBmb3IgKGxldCBqID0gMDsgaiA8IDEwOyBqKyspIHtcbiAgICAgIGNvbnN0IHZhbHVlID0gZ2FtZWJvYXJkLmJvYXJkQXJyYXlbaV1bal07XG4gICAgICBjb25zdCBib2FyZFNxdWFyZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXG4gICAgICAgIGAuZHJhZy1zcXVhcmVbZGF0YS1wb3M9XCIke2l9JHtqfVwiXWBcbiAgICAgICk7XG5cbiAgICAgIGlmICghdmFsdWUpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9IGVsc2UgaWYgKHZhbHVlWzFdID09PSAnMScpIHtcbiAgICAgICAgY29uc3QgW3NoaXBdID0gZ2FtZWJvYXJkLmZsZWV0LmZpbHRlcigoeCkgPT4geC50eXBlWzBdID09IHZhbHVlWzBdKTtcblxuICAgICAgICBjb25zdCBkcmFnZ2FibGUgPSByZW5kZXJEcmFnZ2FibGVTaGlwKHNoaXApO1xuXG4gICAgICAgIGJvYXJkU3F1YXJlLmFwcGVuZENoaWxkKGRyYWdnYWJsZSk7XG5cbiAgICAgICAgLy8gQ2xpY2sgdG8gY2hhbmdlIG9yaWVudGF0aW9uIGV2ZW50IGxpc3RlbmVyXG4gICAgICAgIGRyYWdnYWJsZS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIChldikgPT4ge1xuICAgICAgICAgIGV2LnN0b3BQcm9wYWdhdGlvbigpO1xuXG4gICAgICAgICAgbGV0IG5ld09yaWVudGF0aW9uO1xuXG4gICAgICAgICAgaWYgKGV2LnRhcmdldC5kYXRhc2V0Lm9yaWVudGF0aW9uID09PSAndmVydGljYWwnKSB7XG4gICAgICAgICAgICBuZXdPcmllbnRhdGlvbiA9ICdob3Jpem9udGFsJztcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbmV3T3JpZW50YXRpb24gPSAndmVydGljYWwnO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjb25zdCBjb29yZHMgPSBbXG4gICAgICAgICAgICArZHJhZ2dhYmxlLnBhcmVudE5vZGUuZGF0YXNldC5wb3NbMF0sXG4gICAgICAgICAgICArZHJhZ2dhYmxlLnBhcmVudE5vZGUuZGF0YXNldC5wb3NbMV0sXG4gICAgICAgICAgXTtcbiAgICAgICAgICBjb25zdCB0eXBlID0gZHJhZ2dhYmxlLmRhdGFzZXQudHlwZTtcbiAgICAgICAgICBjb25zdCBsZW5ndGggPSBkcmFnZ2FibGUuZGF0YXNldC5sZW5ndGg7XG5cbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGNvb3JkcywgdHlwZSwgbmV3T3JpZW50YXRpb24pO1xuXG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGdhbWVib2FyZC5pc1NoaXBMZWdhbCh0eXBlLCBsZW5ndGgsIG5ld09yaWVudGF0aW9uLCBjb29yZHMpO1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coJ3RoaXMgd2FzIGEgbGVnYWwgcGxhY2VtZW50Jyk7XG5cbiAgICAgICAgICAgIHVwZGF0ZUdhbWVib2FyZChnYW1lYm9hcmQsIHR5cGUsIGNvb3JkcywgbmV3T3JpZW50YXRpb24pO1xuXG4gICAgICAgICAgICBkcmFnZ2FibGUuY2xhc3NMaXN0LnRvZ2dsZSgncm90YXRlZCcpO1xuICAgICAgICAgICAgZHJhZ2dhYmxlLmRhdGFzZXQub3JpZW50YXRpb24gPSBuZXdPcmllbnRhdGlvbjtcbiAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coZXJyb3IpO1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coJ3RoaXMgd2FzIG5vdCBhIGxlZ2FsIHBsYWNlbWVudCcpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIHJlbmRlckRyYWdnYWJsZVNoaXAoc2hpcCkge1xuICBjb25zdCBzaGlwUmVuZGVyID0gY3JlYXRlTmV3RWxlbWVudChcbiAgICAnZGl2JyxcbiAgICBbJ2RyYWdnYWJsZS1zaGlwJywgJ3NoaXAtcmVuZGVyJywgYCR7c2hpcC50eXBlWzBdfWBdLFxuICAgIG51bGwsXG4gICAge1xuICAgICAgZHJhZ2dhYmxlOiAndHJ1ZScsXG4gICAgICAnZGF0YS1vcmllbnRhdGlvbic6IHNoaXAub3JpZW50YXRpb24sXG4gICAgICAnZGF0YS1sZW5ndGgnOiBgJHtzaGlwLmxlbmd0aH1gLFxuICAgICAgJ2RhdGEtdHlwZSc6IHNoaXAudHlwZSxcbiAgICB9XG4gICk7XG5cbiAgaWYgKHNoaXAub3JpZW50YXRpb24gPT09ICd2ZXJ0aWNhbCcpIHtcbiAgICBzaGlwUmVuZGVyLmNsYXNzTGlzdC5hZGQoJ3JvdGF0ZWQnKTtcbiAgfVxuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgc2hpcC5sZW5ndGg7IGkrKykge1xuICAgIHNoaXBSZW5kZXIuYXBwZW5kQ2hpbGQoY3JlYXRlTmV3RWxlbWVudCgnZGl2JywgWydzaGlwLXBhcnQnXSkpO1xuICB9XG5cbiAgcmV0dXJuIHNoaXBSZW5kZXI7XG59XG5cbmZ1bmN0aW9uIGNsZWFyRHJhZ2dhYmxlU2hpcHMoKSB7XG4gIGNvbnN0IHNoaXBzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLmRyYWdnYWJsZS1zaGlwJyk7XG4gIHNoaXBzLmZvckVhY2goKHNoaXApID0+IHtcbiAgICBzaGlwLnBhcmVudEVsZW1lbnQucmVtb3ZlQ2hpbGQoc2hpcCk7XG4gIH0pO1xufVxuXG5mdW5jdGlvbiB1cGRhdGVHYW1lYm9hcmQoZ2FtZWJvYXJkLCB0eXBlLCBjb29yZHMsIG9yaWVudGF0aW9uKSB7XG4gIGdhbWVib2FyZC5jbGVhclNoaXBGcm9tQm9hcmQodHlwZSk7XG4gIGdhbWVib2FyZC5jbGVhclNoaXBGcm9tRmxlZXQodHlwZSk7XG4gIGdhbWVib2FyZC5wbGFjZVNoaXAodHlwZSwgY29vcmRzLCBvcmllbnRhdGlvbik7XG59XG4iLCJleHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBjcmVhdGVQbGF5ZXIoKSB7XG4gIGxldCBlbmVteUJvYXJkO1xuXG4gIGxldCBwcmV2aW91c01vdmVzID0gW107XG4gIGxldCBzaGlwSGlzdG9yeSA9ICcnOyAvLyBmb3IgQUkgY29uZGl0aW9uYWxzXG5cbiAgY29uc3QgYWlNb2RlID0ge1xuICAgIGNvbHVtbkF4aXM6IHRydWUsXG4gICAgcG9zRGlyZWN0aW9uOiB0cnVlLFxuICB9O1xuXG4gIGZ1bmN0aW9uIGFzc2lnbkVuZW15R2FtZWJvYXJkKGdhbWVib2FyZCkge1xuICAgIGVuZW15Qm9hcmQgPSBnYW1lYm9hcmQ7XG4gIH1cblxuICBmdW5jdGlvbiBtYWtlQXR0YWNrKFtyb3csIGNvbF0pIHtcbiAgICByZXR1cm4gZW5lbXlCb2FyZC5yZWNlaXZlQXR0YWNrKFtyb3csIGNvbF0pO1xuICB9XG5cbiAgZnVuY3Rpb24gYWlQbGF5KCkge1xuICAgIGxldCB0aGlzTW92ZSA9IHJhbmRvbU1vdmUoKTtcblxuICAgIHdoaWxlIChwbGF5ZWRQcmV2aW91c2x5KHRoaXNNb3ZlKSkge1xuICAgICAgdGhpc01vdmUgPSByYW5kb21Nb3ZlKCk7XG4gICAgfVxuXG4gICAgcHJldmlvdXNNb3Zlcy5wdXNoKHsgbW92ZTogdGhpc01vdmUgfSk7XG5cbiAgICByZXR1cm4gdGhpc01vdmU7XG4gIH1cblxuICBmdW5jdGlvbiBhaVNtYXJ0UGxheSgpIHtcbiAgICBsZXQgdGhpc01vdmU7XG5cbiAgICAvLyBGaXJzdCBtb3ZlXG4gICAgaWYgKCFwcmV2aW91c01vdmVzWzBdKSB7XG4gICAgICB0aGlzTW92ZSA9IHJhbmRvbU1vdmUoKTtcbiAgICAgIC8vIEFsbCBzdWJzZXF1ZW50XG4gICAgfSBlbHNlIHtcbiAgICAgIGV2YWx1YXRlTGFzdE1vdmUoKTtcblxuICAgICAgdGhpc01vdmUgPSBzbWFydE1vdmUoKTtcblxuICAgICAgd2hpbGUgKHBsYXllZFByZXZpb3VzbHkodGhpc01vdmUpKSB7XG4gICAgICAgIGlmIChzaGlwSGlzdG9yeSkge1xuICAgICAgICAgIGNvbnN0IHByZXZpb3VzUmVzdWx0ID0gcXVlcnlQcmV2aW91c1Jlc3VsdCh0aGlzTW92ZSk7XG4gICAgICAgICAgLy8gV2l0aGluIHRoZSBkZXRlcm1pbmlzdGljIGF0dGFjayBzZXF1ZW5jZSwgYW55IHByZXZpb3VzbHkgcGxheWVkIG1vdmUgaXMgcmVjb3JkZWQgYWdhaW4gYXMgaWYgaXQgaXMgYmVpbmcgcGxheWVkIG5vdyBzbyB0aGUgc2VxdWVuY2UgY2FuIGNvbnRpbnVlXG4gICAgICAgICAgcHJldmlvdXNNb3Zlcy5wdXNoKHsgbW92ZTogdGhpc01vdmUsIHJlc3VsdDogcHJldmlvdXNSZXN1bHQgfSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpc01vdmUgPSBzbWFydE1vdmUoKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBwcmV2aW91c01vdmVzLnB1c2goeyBtb3ZlOiB0aGlzTW92ZSB9KTtcblxuICAgIHJldHVybiB0aGlzTW92ZTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJhbmRvbU1vdmUoKSB7XG4gICAgY29uc3QgbW92ZSA9IFtcbiAgICAgIE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDEwKSxcbiAgICAgIE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDEwKSxcbiAgICBdO1xuICAgIHJldHVybiBtb3ZlO1xuICB9XG5cbiAgZnVuY3Rpb24gcGxheWVkUHJldmlvdXNseSh0aGlzTW92ZSkge1xuICAgIGNvbnN0IGNoZWNrTW92ZXMgPSBwcmV2aW91c01vdmVzLmZpbHRlcihcbiAgICAgICh0dXJuKSA9PiB0dXJuLm1vdmVbMF0gPT09IHRoaXNNb3ZlWzBdICYmIHR1cm4ubW92ZVsxXSA9PT0gdGhpc01vdmVbMV1cbiAgICApO1xuXG4gICAgaWYgKGNoZWNrTW92ZXNbMF0pIHJldHVybiB0cnVlO1xuXG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgZnVuY3Rpb24gcXVlcnlQcmV2aW91c1Jlc3VsdCh0aGlzTW92ZSkge1xuICAgIGNvbnN0IGNoZWNrTW92ZXMgPSBwcmV2aW91c01vdmVzLmZpbHRlcihcbiAgICAgICh0dXJuKSA9PiB0dXJuLm1vdmVbMF0gPT09IHRoaXNNb3ZlWzBdICYmIHR1cm4ubW92ZVsxXSA9PT0gdGhpc01vdmVbMV1cbiAgICApO1xuXG4gICAgcmV0dXJuIGNoZWNrTW92ZXNbMF0ucmVzdWx0O1xuICB9XG5cbiAgZnVuY3Rpb24gZXZhbHVhdGVMYXN0TW92ZSgpIHtcbiAgICBjb25zdCBsYXN0TW92ZSA9IHByZXZpb3VzTW92ZXNbcHJldmlvdXNNb3Zlcy5sZW5ndGggLSAxXS5tb3ZlO1xuXG4gICAgLy8gUmVzdWx0IGlzIHJlYWQgb2ZmIG9mIHRoZSBlbmVteSBnYW1lYm9hcmRcbiAgICBjb25zdCBmb3VuZFJlc3VsdCA9IGVuZW15Qm9hcmQuYm9hcmRBcnJheVtsYXN0TW92ZVswXV1bbGFzdE1vdmVbMV1dO1xuXG4gICAgLy8gQW5kIHN0b3JlZCBpbiB0aGUgcHJldmlvdXNNb3ZlIGFycmF5XG4gICAgcHJldmlvdXNNb3Zlc1twcmV2aW91c01vdmVzLmxlbmd0aCAtIDFdLnJlc3VsdCA9IGZvdW5kUmVzdWx0O1xuICB9XG5cbiAgZnVuY3Rpb24gc21hcnRNb3ZlKCkge1xuICAgIGxldCBuZXh0TW92ZTtcbiAgICBsZXQgbGFzdE1vdmUgPSBwcmV2aW91c01vdmVzW3ByZXZpb3VzTW92ZXMubGVuZ3RoIC0gMV07XG5cbiAgICAvLyBSZXNldCBhZnRlciBhIHNoaXAgaXMgc3Vua1xuICAgIGlmIChsYXN0TW92ZS5yZXN1bHQgPT09ICdzdW5rJykge1xuICAgICAgc2hpcEhpc3RvcnkgPSAnJztcblxuICAgICAgYWlNb2RlLmNvbHVtbkF4aXMgPSB0cnVlO1xuICAgICAgYWlNb2RlLnBvc0RpcmVjdGlvbiA9IHRydWU7XG5cbiAgICAgIHJldHVybiByYW5kb21Nb3ZlKCk7XG4gICAgfVxuXG4gICAgLy8gQXR0YWNrIHNlcXVlbmNlIGhpc3RvcnkgYmVnaW5zIHdpdGggdGhlIGZpcnN0IGhpdCBvbiBhIG5ldyBzaGlwXG4gICAgaWYgKHNoaXBIaXN0b3J5WzBdID09PSAnaCcgfHwgbGFzdE1vdmUucmVzdWx0ID09PSAnaGl0Jykge1xuICAgICAgc2hpcEhpc3RvcnkgPSBzaGlwSGlzdG9yeSArIGxhc3RNb3ZlLnJlc3VsdFswXTtcbiAgICB9XG5cbiAgICAvLyBJZiBubyBoaXN0b3J5LCBhIHNoaXAgaGFzIG5vdCBiZWVuIGRpc2NvdmVyZWQgeWV0XG4gICAgaWYgKCFzaGlwSGlzdG9yeSkgcmV0dXJuIHJhbmRvbU1vdmUoKTtcblxuXG4gICAgbGV0IFtzZWNvbmRMYXN0LCB0aGlyZExhc3QsIGZvdXJ0aExhc3QsIGZpZnRoTGFzdF0gPVxuICAgICAgZGVmaW5lUHJldmlvdXNNb3ZlVmFyaWFibGVzKCk7XG5cbiAgICAvKiBDb25kaXRpb25hbCBsb2dpYyBmb3IgRGV0ZXJtaW5pc3RpYyBBSSAqL1xuICAgIC8vIFNlY29uZCBwYXJhbWV0ZXIgaW4gdGhlIGZvbGxvd2luZyBmdW5jdGlvbnMgaXMgdGhlIHByZXZpb3VzIG1vdmUgaW4gcmVmZXJlbmNlIHRvIHdoaWNoIHRoZSBuZXh0IG1vdmUgc2hvdWxkIGJlIG1hZGVcblxuICAgIGlmIChsYXN0TW92ZS5yZXN1bHQgPT09ICdoaXQnKSB7XG4gICAgICBuZXh0TW92ZSA9IGNvbnRpbnVlU2FtZVBhdGgobGFzdE1vdmUpO1xuXG4gICAgICAvLyBJZiBoaXR0aW5nIGEgYm91bmRhcnksIGNhbGN1bGF0ZSBjb3JyZWN0IG1vdmUgdG8gYmFja3RyYWNrIGZyb21cbiAgICAgIGlmIChvdXRPZkJvdW5kcyhuZXh0TW92ZSkpIHtcbiAgICAgICAgbGV0IHJlZmVyZW5jZU1vdmU7XG4gICAgICAgIHN3aXRjaCAoc2hpcEhpc3RvcnkpIHtcbiAgICAgICAgICBjYXNlICdobWhoJzpcbiAgICAgICAgICAgIHJlZmVyZW5jZU1vdmUgPSBmb3VydGhMYXN0Lm1vdmU7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlICdobWgnOlxuICAgICAgICAgICAgcmVmZXJlbmNlTW92ZSA9IHRoaXJkTGFzdC5tb3ZlO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIHJlZmVyZW5jZU1vdmUgPSBsYXN0TW92ZS5tb3ZlO1xuICAgICAgICB9XG4gICAgICAgIHN3aXRjaERpcmVjdGlvbkF0RWRnZXMobmV4dE1vdmUpO1xuICAgICAgICBuZXh0TW92ZSA9IG1vdmVBY2NvcmRpbmdUb01vZGUocmVmZXJlbmNlTW92ZSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBuZXh0TW92ZTtcbiAgICB9XG5cbiAgICBpZiAoZmlmdGhMYXN0ICYmIGZpZnRoTGFzdC5yZXN1bHQgPT09ICdoaXQnKSB7XG4gICAgICByZXR1cm4ga2VlcEF4aXNTd2l0Y2hEaXJlY3Rpb24obmV4dE1vdmUsIGZpZnRoTGFzdCk7XG4gICAgfVxuICAgIGlmIChmb3VydGhMYXN0ICYmIGZvdXJ0aExhc3QucmVzdWx0ID09PSAnaGl0Jykge1xuICAgICAgcmV0dXJuIGtlZXBBeGlzU3dpdGNoRGlyZWN0aW9uKG5leHRNb3ZlLCBmb3VydGhMYXN0KTtcbiAgICB9XG4gICAgaWYgKHRoaXJkTGFzdCAmJiBzaGlwSGlzdG9yeSA9PT0gJ2htbScpIHtcbiAgICAgIHJldHVybiBzd2l0Y2hBeGlzT3JEaXJlY3Rpb24obmV4dE1vdmUsIHRoaXJkTGFzdCk7XG4gICAgfVxuICAgIGlmIChzZWNvbmRMYXN0ICYmIHNlY29uZExhc3QucmVzdWx0ID09PSAnaGl0Jykge1xuICAgICAgcmV0dXJuIHN3aXRjaEF4aXNPckRpcmVjdGlvbihuZXh0TW92ZSwgc2Vjb25kTGFzdCk7XG4gICAgfVxuXG4gICAgLy8gQSBmYWlsc2FmZSByZXNldCBmb3IgZW5jb3VudGVyaW5nIGEgY29uZGl0aW9uIG5vdCBsaXN0ZWQgYWJvdmUgKHNob3VsZCBub3QgYmUgY2FsbGVkKVxuICAgIGNvbnNvbGUubG9nKCdOb25lIG9mIHRoZSBhYm92ZSBjb25kaXRpb25zIGFwcGx5Jyk7XG4gICAgc2hpcEhpc3RvcnkgPSAnJztcbiAgICBhaU1vZGUuY29sdW1uQXhpcyA9IHRydWU7XG4gICAgYWlNb2RlLnBvc0RpcmVjdGlvbiA9IHRydWU7XG5cbiAgICByZXR1cm4gcmFuZG9tTW92ZSgpO1xuICB9XG5cbiAgLyogc21hcnRNb3ZlIEhlbHBlciBGdW5jdGlvbnMgKi9cbiAgZnVuY3Rpb24gZGVmaW5lUHJldmlvdXNNb3ZlVmFyaWFibGVzKCkge1xuICAgIGxldCBzZWNvbmRMYXN0O1xuICAgIGxldCB0aGlyZExhc3Q7XG4gICAgbGV0IGZvdXJ0aExhc3Q7XG4gICAgbGV0IGZpZnRoTGFzdDtcblxuICAgIGlmIChzaGlwSGlzdG9yeS5sZW5ndGggPj0gNSkge1xuICAgICAgZmlmdGhMYXN0ID0gcHJldmlvdXNNb3Zlc1twcmV2aW91c01vdmVzLmxlbmd0aCAtIDVdO1xuICAgIH1cbiAgICBpZiAoc2hpcEhpc3RvcnkubGVuZ3RoID49IDQpIHtcbiAgICAgIGZvdXJ0aExhc3QgPSBwcmV2aW91c01vdmVzW3ByZXZpb3VzTW92ZXMubGVuZ3RoIC0gNF07XG4gICAgfVxuICAgIGlmIChzaGlwSGlzdG9yeS5sZW5ndGggPj0gMykge1xuICAgICAgdGhpcmRMYXN0ID0gcHJldmlvdXNNb3Zlc1twcmV2aW91c01vdmVzLmxlbmd0aCAtIDNdO1xuICAgIH1cbiAgICBpZiAoc2hpcEhpc3RvcnkubGVuZ3RoID49IDIpIHtcbiAgICAgIHNlY29uZExhc3QgPSBwcmV2aW91c01vdmVzW3ByZXZpb3VzTW92ZXMubGVuZ3RoIC0gMl07XG4gICAgfVxuXG4gICAgcmV0dXJuIFtzZWNvbmRMYXN0LCB0aGlyZExhc3QsIGZvdXJ0aExhc3QsIGZpZnRoTGFzdF07XG4gIH1cblxuICBmdW5jdGlvbiBjb250aW51ZVNhbWVQYXRoKGxhc3RNb3ZlKSB7XG4gICAgcmV0dXJuIG1vdmVBY2NvcmRpbmdUb01vZGUobGFzdE1vdmUubW92ZSk7XG4gIH1cblxuICBmdW5jdGlvbiBrZWVwQXhpc1N3aXRjaERpcmVjdGlvbihuZXh0TW92ZSwgcmVmZXJlbmNlTW92ZSkge1xuICAgIGFpTW9kZS5wb3NEaXJlY3Rpb24gPSAhYWlNb2RlLnBvc0RpcmVjdGlvbjtcbiAgICBuZXh0TW92ZSA9IG1vdmVBY2NvcmRpbmdUb01vZGUocmVmZXJlbmNlTW92ZS5tb3ZlKTtcblxuICAgIGlmIChvdXRPZkJvdW5kcyhuZXh0TW92ZSkpIHtcbiAgICAgIHN3aXRjaERpcmVjdGlvbkF0RWRnZXMobmV4dE1vdmUpO1xuICAgICAgbmV4dE1vdmUgPSBtb3ZlQWNjb3JkaW5nVG9Nb2RlKHJlZmVyZW5jZU1vdmUubW92ZSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5leHRNb3ZlO1xuICB9XG5cbiAgZnVuY3Rpb24gc3dpdGNoQXhpc09yRGlyZWN0aW9uKG5leHRNb3ZlLCByZWZlcmVuY2VNb3ZlKSB7XG4gICAgaWYgKGFpTW9kZS5jb2x1bW5BeGlzICYmIGFpTW9kZS5wb3NEaXJlY3Rpb24pIHtcbiAgICAgIC8vIGluaXRpYWwgc3dpdGNoIHVwb24gZmlyc3QgbWlzcyBzaG91bGQgYmUgb2YgZGlyZWN0aW9uXG4gICAgICBhaU1vZGUucG9zRGlyZWN0aW9uID0gIWFpTW9kZS5wb3NEaXJlY3Rpb247XG4gICAgfSBlbHNlIGlmIChhaU1vZGUuY29sdW1uQXhpcyAmJiAhYWlNb2RlLnBvc0RpcmVjdGlvbikge1xuICAgICAgLy8gaWYgZGlyZWN0aW9uIGlzIGFscmVhZHkgc3dpdGNoZWQgcm93IGF4aXMgc2hvdWxkIGJlIHN0YXJ0ZWRcbiAgICAgIGFpTW9kZS5jb2x1bW5BeGlzID0gIWFpTW9kZS5jb2x1bW5BeGlzO1xuICAgICAgLy8gSWYgc2hpcCB0aGVuIG1pc3NlZCB0byBzaWRlLCBzd2l0Y2ggZGlyZWN0aW9uXG4gICAgfSBlbHNlIGlmICghYWlNb2RlLmNvbHVtbkF4aXMgJiYgIWFpTW9kZS5wb3NEaXJlY3Rpb24pIHtcbiAgICAgICFhaU1vZGUucG9zRGlyZWN0aW9uO1xuICAgIH1cblxuICAgIG5leHRNb3ZlID0gbW92ZUFjY29yZGluZ1RvTW9kZShyZWZlcmVuY2VNb3ZlLm1vdmUpO1xuXG4gICAgaWYgKG91dE9mQm91bmRzKG5leHRNb3ZlKSkge1xuICAgICAgc3dpdGNoRGlyZWN0aW9uQXRFZGdlcyhuZXh0TW92ZSk7XG4gICAgICBuZXh0TW92ZSA9IG1vdmVBY2NvcmRpbmdUb01vZGUocmVmZXJlbmNlTW92ZS5tb3ZlKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbmV4dE1vdmU7XG4gIH1cblxuICBmdW5jdGlvbiBtb3ZlQWNjb3JkaW5nVG9Nb2RlKFtyb3csIGNvbHVtbl0pIHtcbiAgICBpZiAoYWlNb2RlLmNvbHVtbkF4aXMgJiYgYWlNb2RlLnBvc0RpcmVjdGlvbikge1xuICAgICAgcmV0dXJuIFtyb3cgKyAxLCBjb2x1bW5dO1xuICAgIH0gZWxzZSBpZiAoYWlNb2RlLmNvbHVtbkF4aXMpIHtcbiAgICAgIHJldHVybiBbcm93IC0gMSwgY29sdW1uXTtcbiAgICB9IGVsc2UgaWYgKGFpTW9kZS5wb3NEaXJlY3Rpb24pIHtcbiAgICAgIHJldHVybiBbcm93LCBjb2x1bW4gKyAxXTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIFtyb3csIGNvbHVtbiAtIDFdO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIG91dE9mQm91bmRzKFtyb3csIGNvbHVtbl0pIHtcbiAgICBpZiAocm93ID4gOSB8fCByb3cgPCAwIHx8IGNvbHVtbiA+IDkgfHwgY29sdW1uIDwgMCkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gc3dpdGNoRGlyZWN0aW9uQXRFZGdlcyhbcm93LCBjb2x1bW5dKSB7XG4gICAgaWYgKHJvdyA+IDkgJiYgYWlNb2RlLmNvbHVtbkF4aXMgPT09IHRydWUpIHtcbiAgICAgIGFpTW9kZS5wb3NEaXJlY3Rpb24gPSBmYWxzZTtcbiAgICB9IGVsc2UgaWYgKHJvdyA8IDAgJiYgY29sdW1uID09IDApIHtcbiAgICAgIC8vIE9OTFkgaGFwcGVucyB3aXRoIGhvcml6b250YWwgc2hpcCBpbiB0b3AgbGVmdCBjb3JuZXJcbiAgICAgIGFpTW9kZS5jb2x1bW5BeGlzID0gZmFsc2U7XG4gICAgICBhaU1vZGUucG9zRGlyZWN0aW9uID0gdHJ1ZTtcbiAgICB9ZWxzZSBpZiAocm93IDwgMCkge1xuICAgICAgLy8gaWYgZGlyZWN0aW9uIGhhcyBhbHJlYWR5IGJlZW4gc3dpdGNoZWRcbiAgICAgIGFpTW9kZS5jb2x1bW5BeGlzID0gZmFsc2U7XG4gICAgfSBlbHNlIGlmIChjb2x1bW4gPCAwKSB7XG4gICAgICBhaU1vZGUucG9zRGlyZWN0aW9uID0gdHJ1ZTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4ge1xuICAgIG1ha2VBdHRhY2ssXG4gICAgYXNzaWduRW5lbXlHYW1lYm9hcmQsXG4gICAgYWlQbGF5LFxuICAgIGFpU21hcnRQbGF5LFxuICAgIC8vIEV2ZXJ5dGhpbmcgYmVsb3cgaXMgaW50ZXJuYWwgYW5kIHdhcyB1c2VkIG9ubHkgZm9yIHRlc3RpbmdcbiAgICBnZXQgZW5lbXlCb2FyZCgpIHtcbiAgICAgIHJldHVybiBlbmVteUJvYXJkO1xuICAgIH0sXG4gICAgZ2V0IHByZXZpb3VzTW92ZXMoKSB7XG4gICAgICByZXR1cm4gWy4uLnByZXZpb3VzTW92ZXNdO1xuICAgIH0sXG4gICAgLy8gT25seSBmb3IgdGVzdGluZyB3b3VsZCB0aGVzZSBldmVyIGJlIHNldFxuICAgIHNldCBwcmV2aW91c01vdmVzKGhpc3RvcnlBcnJheSkge1xuICAgICAgcHJldmlvdXNNb3ZlcyA9IGhpc3RvcnlBcnJheTtcbiAgICB9LFxuICAgIGFpTW9kZSxcbiAgICBzZXQgc2hpcEhpc3Rvcnkoc3RyaW5nKSB7XG4gICAgICBzaGlwSGlzdG9yeSA9IHN0cmluZztcbiAgICB9LFxuICB9O1xufVxuIiwiZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVNoaXAobGVuZ3RoKSB7XG4gICAgY29uc3Qgc2hpcEFycmF5ID0gQXJyYXkobGVuZ3RoKS5maWxsKDApO1xuXG4gICAgZnVuY3Rpb24gaGl0KHBvc2l0aW9uKSB7XG4gICAgICAgIC8qIDAgLSBub3QgaGl0OyAxIC0gaGl0ICovXG4gICAgICAgIHNoaXBBcnJheVtwb3NpdGlvbiAtIDFdID0gMTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaXNTdW5rKCkge1xuICAgICAgICBjb25zdCBoaXRzID0gc2hpcEFycmF5LmZpbHRlcihwb3NpdGlvbiA9PlxuICAgICAgICAgICAgcG9zaXRpb24gPT0gMSk7XG4gICAgICAgIHJldHVybiBoaXRzLmxlbmd0aCA9PSBsZW5ndGhcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBoaXQsXG4gICAgICAgIGdldCBzaGlwQXJyYXkoKXtcbiAgICAgICAgICAgIHJldHVybiBbLi4uc2hpcEFycmF5XVxuICAgICAgICB9LFxuICAgICAgICBnZXQgbGVuZ3RoKCkge1xuICAgICAgICAgICAgcmV0dXJuIGxlbmd0aFxuICAgICAgICB9LFxuICAgICAgICBpc1N1bmtcbiAgICB9XG59XG5cbiIsImltcG9ydCB7IGNyZWF0ZVNoaXAgfSBmcm9tICcuL3NoaXBzJztcbmltcG9ydCB7IHB1Ymxpc2ggfSBmcm9tICcuL3B1YnN1Yic7XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGNyZWF0ZUdhbWVib2FyZCgpIHtcbiAgbGV0IGJvYXJkQXJyYXkgPSBBcnJheSgxMClcbiAgICAuZmlsbChudWxsKVxuICAgIC5tYXAoKHgpID0+IEFycmF5KDEwKS5maWxsKG51bGwpKTtcblxuICBsZXQgZmxlZXQgPSBbXTtcblxuICAvKiBGcm9tIFdpa2lwZWRpYSAqL1xuICBjb25zdCBzaGlwTGVuZ3RocyA9IFs1LCA0LCAzLCAzLCAyXTtcbiAgY29uc3Qgc2hpcFR5cGVzID0gW1xuICAgICdjYXJyaWVyJyxcbiAgICAnYmF0dGxlc2hpcCcsXG4gICAgJ2Rlc3Ryb3llcicsXG4gICAgJ3N1Ym1hcmluZScsXG4gICAgJ3BhdHJvbCBib2F0JyxcbiAgXTtcblxuICBmdW5jdGlvbiBwbGFjZVNoaXAodHlwZSwgW3JvdywgY29sdW1uXSwgb3JpZW50YXRpb24pIHtcbiAgICBjb25zdCBzaGlwSW5kZXggPSBzaGlwVHlwZXMuaW5kZXhPZih0eXBlKTtcbiAgICBjb25zdCBzaGlwTGVuZ3RoID0gc2hpcExlbmd0aHNbc2hpcEluZGV4XTtcblxuICAgIC8qIFRlc3QgbGVnYWxpdHkgb2YgYWxsIHBvc2l0aW9ucyBiZWZvcmUgbWFya2luZyBhbnkgKi9cbiAgICBpc1NoaXBMZWdhbCh0eXBlLCBzaGlwTGVuZ3RoLCBvcmllbnRhdGlvbiwgW3JvdywgY29sdW1uXSk7XG5cbiAgICAvKiBNYXJrIGJvYXJkIGFycmF5ICovXG4gICAgZm9yIChsZXQgaSA9IDE7IGkgPD0gc2hpcExlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBzaGlwTWFya2VyID0gdHlwZVswXSArIGk7XG5cbiAgICAgIGlmIChpID09PSAxKSB7XG4gICAgICAgIGJvYXJkQXJyYXlbcm93XVtjb2x1bW5dID0gc2hpcE1hcmtlcjtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGlmIChvcmllbnRhdGlvbiA9PT0gJ2hvcml6b250YWwnKSB7XG4gICAgICAgIGJvYXJkQXJyYXlbcm93XVtjb2x1bW4gKyAoaSAtIDEpXSA9IHNoaXBNYXJrZXI7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBib2FyZEFycmF5W3JvdyArIChpIC0gMSldW2NvbHVtbl0gPSBzaGlwTWFya2VyO1xuICAgICAgfVxuICAgIH1cblxuICAgIGxldCBjcmVhdGVkU2hpcCA9IGNyZWF0ZVNoaXAoc2hpcExlbmd0aCk7XG4gICAgY3JlYXRlZFNoaXAudHlwZSA9IHR5cGU7XG4gICAgY3JlYXRlZFNoaXAub3JpZW50YXRpb24gPSBvcmllbnRhdGlvbjsgLy8gZm9yIGRyYWcgYW5kIGRyb3BcblxuICAgIGZsZWV0LnB1c2goY3JlYXRlZFNoaXApO1xuICB9XG5cbiAgZnVuY3Rpb24gaXNTaGlwTGVnYWwodHlwZSwgc2hpcExlbmd0aCwgb3JpZW50YXRpb24sIFtyb3csIGNvbHVtbl0pIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNoaXBMZW5ndGg7IGkrKykge1xuICAgICAgbGV0IHRlc3RTcXVhcmU7XG5cbiAgICAgIGlmIChvcmllbnRhdGlvbiA9PT0gJ2hvcml6b250YWwnKSB7XG4gICAgICAgIHRlc3RTcXVhcmUgPSBbcm93LCBjb2x1bW4gKyBpXTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRlc3RTcXVhcmUgPSBbcm93ICsgaSwgY29sdW1uXTtcbiAgICAgIH1cblxuICAgICAgaWYgKHRlc3RTcXVhcmVbMF0gPiA5IHx8IHRlc3RTcXVhcmVbMV0gPiA5KSB7XG4gICAgICAgIHRocm93ICdTaGlwIG91dHNpZGUgYm91bmRzIG9mIGJvYXJkJztcbiAgICAgIH1cbiAgICAgIGlmIChhZGphY2VudFNoaXAodGVzdFNxdWFyZSwgdHlwZSkpIHtcbiAgICAgICAgdGhyb3cgJ1NoaXAgYWRqYWNlbnQgdG8gYW5vdGhlciBzaGlwJztcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBwbGFjZUFsbFNoaXBzUmFuZG9tbHkoKSB7XG4gICAgZm9yIChjb25zdCBzaGlwIG9mIHNoaXBUeXBlcykge1xuICAgICAgYXR0ZW1wdFBsYWNlbWVudChzaGlwKTtcbiAgICB9XG4gIH1cblxuICBjb25zdCBvcmllbnRhdGlvbnMgPSBbJ2hvcml6b250YWwnLCAndmVydGljYWwnXTtcblxuICBmdW5jdGlvbiByYW5kb21Qb3NpdGlvbigpIHtcbiAgICByZXR1cm4gW01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDEwKSwgTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogMTApXTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGF0dGVtcHRQbGFjZW1lbnQoc2hpcCkge1xuICAgIGxldCBwb3NpdGlvbiA9IHJhbmRvbVBvc2l0aW9uKCk7XG4gICAgbGV0IG9yaWVudGF0aW9uID0gb3JpZW50YXRpb25zW01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDIpXTtcbiAgICB0cnkge1xuICAgICAgcGxhY2VTaGlwKHNoaXAsIHBvc2l0aW9uLCBvcmllbnRhdGlvbik7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGF0dGVtcHRQbGFjZW1lbnQoc2hpcCk7XG4gICAgfVxuICB9XG5cbiAgLyogSGVscGVyIGZ1bmN0aW9ucyBmb3IgdGVzdGluZyBzaGlwIGxlZ2FsaXR5ICovXG4gIGZ1bmN0aW9uIGFkamFjZW50U2hpcChbcm93LCBjb2xdLCBzaGlwTWFya2VyKSB7XG4gICAgY29uc3QgYm91bmRpbmdTcXVhcmVzID0gZGVmaW5lQm91bmRpbmdCb3goW3JvdywgY29sXSk7XG4gICAgZm9yIChjb25zdCBbc3FSb3csIHNxQ29sXSBvZiBib3VuZGluZ1NxdWFyZXMpIHtcbiAgICAgIGxldCB0ZXN0ID0gYm9hcmRBcnJheVtzcVJvd11bc3FDb2xdO1xuICAgICAgaWYgKHRlc3QgJiYgdGVzdFswXSAhPT0gc2hpcE1hcmtlclswXSkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgZnVuY3Rpb24gZGVmaW5lQm91bmRpbmdCb3goW3JvdywgY29sXSkge1xuICAgIGNvbnN0IHNxdWFyZXMgPSBbXTtcbiAgICAvLyBDbG9ja3dpc2UgY2lyY2xlIGZyb20gdG9wIGxlZnRcbiAgICBzcXVhcmVzLnB1c2goXG4gICAgICBbcm93IC0gMSwgY29sIC0gMV0sXG4gICAgICBbcm93IC0gMSwgY29sXSxcbiAgICAgIFtyb3cgLSAxLCBjb2wgKyAxXSxcbiAgICAgIFtyb3csIGNvbCArIDFdLFxuICAgICAgW3JvdyArIDEsIGNvbCArIDFdLFxuICAgICAgW3JvdyArIDEsIGNvbF0sXG4gICAgICBbcm93ICsgMSwgY29sIC0gMV0sXG4gICAgICBbcm93LCBjb2wgLSAxXVxuICAgICk7XG5cbiAgICBjb25zdCB3aXRoaW5Cb2FyZCA9IHNxdWFyZXMuZmlsdGVyKChbc3FSb3csIHNxQ29sXSkgPT4ge1xuICAgICAgcmV0dXJuIHNxUm93ID4gLTEgJiYgc3FSb3cgPCAxMCAmJiBzcUNvbCA+IC0xICYmIHNxQ29sIDwgMTA7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gd2l0aGluQm9hcmQ7XG4gIH1cblxuICBmdW5jdGlvbiByZWNlaXZlQXR0YWNrKFtyb3csIGNvbHVtbl0pIHtcbiAgICBjb25zdCB2YWx1ZUF0UG9zaXRpb24gPSBib2FyZEFycmF5W3Jvd11bY29sdW1uXTtcblxuICAgIGlmICghdmFsdWVBdFBvc2l0aW9uKSB7XG4gICAgICBib2FyZEFycmF5W3Jvd11bY29sdW1uXSA9ICdtaXNzJztcbiAgICAgIHB1Ymxpc2goJ21pc3MnLCBbcm93LCBjb2x1bW5dKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgaGl0U2hpcCA9IGZsZWV0LmZpbHRlcihcbiAgICAgIChzaGlwKSA9PiBzaGlwLnR5cGVbMF0gPT09IHZhbHVlQXRQb3NpdGlvblswXVxuICAgIClbMF07XG4gICAgaGl0U2hpcC5oaXQodmFsdWVBdFBvc2l0aW9uWzFdKTtcbiAgICBib2FyZEFycmF5W3Jvd11bY29sdW1uXSA9ICdoaXQnO1xuICAgIHB1Ymxpc2goJ2hpdCcsIFtyb3csIGNvbHVtbl0pO1xuXG4gICAgaWYgKGhpdFNoaXAuaXNTdW5rKCkpIHtcbiAgICAgIHB1Ymxpc2goJ3NoaXBTdW5rJywgW2hpdFNoaXAsIFtyb3csIGNvbHVtbl1dKTtcbiAgICAgIGJvYXJkQXJyYXlbcm93XVtjb2x1bW5dID0gJ3N1bmsnO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGlzRmxlZXRTdW5rKCkge1xuICAgIGNvbnN0IHN1bmtTaGlwcyA9IGZsZWV0LmZpbHRlcigoc2hpcCkgPT4gc2hpcC5pc1N1bmsoKSA9PT0gdHJ1ZSk7XG4gICAgcmV0dXJuIHN1bmtTaGlwcy5sZW5ndGggPT09IGZsZWV0Lmxlbmd0aDtcbiAgfVxuXG4gIGZ1bmN0aW9uIGNsZWFyU2hpcEZyb21Cb2FyZCh0eXBlKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCAxMDsgaSsrKSB7XG4gICAgICBmb3IgKGxldCBqID0gMDsgaiA8IDEwOyBqKyspIHtcbiAgICAgICAgaWYgKGJvYXJkQXJyYXlbaV1bal0gJiYgYm9hcmRBcnJheVtpXVtqXVswXSA9PT0gdHlwZVswXSkge1xuICAgICAgICAgIGJvYXJkQXJyYXlbaV1bal0gPSBudWxsO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gY2xlYXJTaGlwRnJvbUZsZWV0KHR5cGUpIHtcbiAgICBmbGVldCA9IGZsZWV0LmZpbHRlcigoeCkgPT4geC50eXBlICE9PSB0eXBlKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGNsZWFyQm9hcmQoKSB7XG4gICAgZmxlZXQgPSBbXTtcbiAgICBib2FyZEFycmF5ID0gQXJyYXkoMTApXG4gICAgICAuZmlsbChudWxsKVxuICAgICAgLm1hcCgoeCkgPT4gQXJyYXkoMTApLmZpbGwobnVsbCkpO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBnZXQgYm9hcmRBcnJheSgpIHtcbiAgICAgIC8qIDJEIGFycmF5IHNvIGVhY2ggZWxlbWVudCBuZWVkcyBkZXN0cnVjdHVyaW5nICovXG4gICAgICByZXR1cm4gYm9hcmRBcnJheS5tYXAoKHgpID0+IFsuLi54XSk7XG4gICAgfSxcbiAgICByZWNlaXZlQXR0YWNrLFxuICAgIHBsYWNlU2hpcCxcbiAgICBwbGFjZUFsbFNoaXBzUmFuZG9tbHksXG4gICAgZ2V0IGZsZWV0KCkge1xuICAgICAgcmV0dXJuIFsuLi5mbGVldF07XG4gICAgfSxcbiAgICBpc0ZsZWV0U3VuayxcbiAgICAvLyBUaGUgZm9sbG93aW5nIGltcGxlbWVudGVkIGZvciB1c2UgYnkgdGhlIGRyYWcgYW5kIGRyb3Agc2hpcCBwbGFjZW1lbnQuIEFsc28gY2hhbmdlZCBib3RoIGJvYXJkIGFuZCBmbGVldCBhcnJheXMgdG8gbGV0IGluc3RlYWQgb2YgY29uc3QgZm9yIHRoaXNcbiAgICBpc1NoaXBMZWdhbCxcbiAgICBjbGVhclNoaXBGcm9tQm9hcmQsXG4gICAgY2xlYXJTaGlwRnJvbUZsZWV0LFxuICAgIGNsZWFyQm9hcmQsXG4gIH07XG59XG4iLCJpbXBvcnQge1xuICBjcmVhdGVDb250YWluZXJzLFxuICBtYWtlQW5ub3VuY2VtZW50cyxcbiAgY2xpY2tMaXN0ZW5lcixcbiAgcmVuZGVyQm9hcmQsXG4gIHJlbmRlclR1cm5TY3JlZW4sXG4gIHJlbmRlclN0YXJ0U2NyZWVuLFxuICBjbGVhckJvYXJkcyxcbiAgc3dhcFN1bmtGbGVldHMsXG4gIHJlTWFya1N1bmtTaGlwc1xufSBmcm9tICcuL2RvbSc7XG5pbXBvcnQgeyByZW5kZXJTaGlwU2NyZWVuIH0gZnJvbSAnLi9kcmFnRHJvcCc7XG5pbXBvcnQgY3JlYXRlUGxheWVyIGZyb20gJy4vcGxheWVyJztcbmltcG9ydCBjcmVhdGVHYW1lYm9hcmQgZnJvbSAnLi9nYW1lYm9hcmQnO1xuaW1wb3J0IHsgc3Vic2NyaWJlLCBwdWJsaXNoLCB1bnN1YnNjcmliZSB9IGZyb20gJy4vcHVic3ViJztcblxuZXhwb3J0IGZ1bmN0aW9uIG5ld0dhbWUoKSB7XG4gIGNyZWF0ZUNvbnRhaW5lcnMoKTtcblxuICBjb25zdCBwbGF5ZXIxID0gY3JlYXRlUGxheWVyKCk7XG4gIGNvbnN0IHBsYXllcjIgPSBjcmVhdGVQbGF5ZXIoKTtcblxuICBjb25zdCBib2FyZDEgPSBjcmVhdGVHYW1lYm9hcmQoKTtcbiAgY29uc3QgYm9hcmQyID0gY3JlYXRlR2FtZWJvYXJkKCk7XG5cbiAgcGxheWVyMS5hc3NpZ25FbmVteUdhbWVib2FyZChib2FyZDIpO1xuICBwbGF5ZXIyLmFzc2lnbkVuZW15R2FtZWJvYXJkKGJvYXJkMSk7XG5cbiAgYm9hcmQxLnBsYWNlQWxsU2hpcHNSYW5kb21seSgpO1xuICBib2FyZDIucGxhY2VBbGxTaGlwc1JhbmRvbWx5KCk7XG5cbiAgLy8gRXZlbnQgbGlzdGVuZXJzIHRvIHRyYWNrIGdhbWUgZXZlbnRzXG4gIG1ha2VBbm5vdW5jZW1lbnRzKCk7XG5cbiAgLy8gRXZlbnQgbGlzdGVuZXJzIHRvIHNlbGVjdCB0eXBlIG9mIGdhbWVcbiAgY29uc3QgW3NpbmdsZVBsYXllckJ1dHRvbiwgdHdvUGxheWVyQnV0dG9uXSA9IHJlbmRlclN0YXJ0U2NyZWVuKCk7XG5cbiAgc2luZ2xlUGxheWVyQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKGV2KSA9PiB7XG4gICAgZXYucHJldmVudERlZmF1bHQoKTtcbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuc3RhcnQtc2NyZWVuJykuc3R5bGUuZGlzcGxheSA9ICdub25lJztcblxuICAgIHBsYXllclZzQUlMb29wKHsgcGxheWVyMSwgcGxheWVyMiwgYm9hcmQxLCBib2FyZDIgfSk7XG4gIH0pO1xuXG4gIHR3b1BsYXllckJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIChldikgPT4ge1xuICAgIGV2LnByZXZlbnREZWZhdWx0KCk7XG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLnN0YXJ0LXNjcmVlbicpLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG5cbiAgICB0d29QbGF5ZXJHYW1lTG9vcCh7IHBsYXllcjEsIHBsYXllcjIsIGJvYXJkMSwgYm9hcmQyIH0pO1xuICB9KTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gcGxheWVyVnNBSUxvb3AoeyBwbGF5ZXIxLCBwbGF5ZXIyLCBib2FyZDEsIGJvYXJkMiB9KSB7XG4gIGF3YWl0IHJlbmRlclNoaXBTY3JlZW4oYm9hcmQxKTtcbiAgcmVuZGVyQm9hcmQoYm9hcmQxLmJvYXJkQXJyYXksICdvd24nKTtcbiAgcmVuZGVyQm9hcmQoYm9hcmQyLmJvYXJkQXJyYXksICdlbmVteScpO1xuXG4gIC8vIE1ha2UgYm9hcmQgY2xpY2thYmxlIHRvIGh1bWFuIHBsYXllclxuICBjbGlja0xpc3RlbmVyKHBsYXllcjEsICdlbmVteScpO1xuXG4gIHN1YnNjcmliZSgnc3F1YXJlQXR0YWNrZWQnLCBodW1hbkF0dGFjayk7XG5cbiAgZnVuY3Rpb24gaHVtYW5BdHRhY2soW3BsYXllciwgdGFyZ2V0XSkge1xuICAgIHB1Ymxpc2goJ3RhcmdldENoYW5nZScsICdlbmVteScpO1xuXG4gICAgcGxheWVyLm1ha2VBdHRhY2soW3RhcmdldFswXSwgdGFyZ2V0WzFdXSk7XG5cbiAgICByZW5kZXJCb2FyZChib2FyZDIuYm9hcmRBcnJheSwgJ2VuZW15Jyk7XG5cbiAgICBpZiAoYm9hcmQyLmlzRmxlZXRTdW5rKCkpIHtcbiAgICAgIHB1Ymxpc2goJ2ZsZWV0U3VuaycsIFsnQ29tcHV0ZXInLCAnSHVtYW4nXSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICBwdWJsaXNoKCd0YXJnZXRDaGFuZ2UnLCAnb3duJyk7XG5cbiAgICAgIHBsYXllcjIubWFrZUF0dGFjayhwbGF5ZXIyLmFpU21hcnRQbGF5KCkpO1xuICAgICAgcmVuZGVyQm9hcmQoYm9hcmQxLmJvYXJkQXJyYXksICdvd24nKTtcblxuICAgICAgaWYgKGJvYXJkMS5pc0ZsZWV0U3VuaygpKSB7XG4gICAgICAgIHB1Ymxpc2goJ2ZsZWV0U3VuaycsIFsnSHVtYW4nLCAnQ29tcHV0ZXInXSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9LCAxMDAwKTtcbiAgfVxufVxuXG5hc3luYyBmdW5jdGlvbiB0d29QbGF5ZXJHYW1lTG9vcCh7IHBsYXllcjEsIHBsYXllcjIsIGJvYXJkMSwgYm9hcmQyIH0pIHtcbiAgYXdhaXQgcmVuZGVyVHVyblNjcmVlbignUExBWUVSIDEnKTtcbiAgYXdhaXQgcmVuZGVyU2hpcFNjcmVlbihib2FyZDEpO1xuXG4gIGF3YWl0IHJlbmRlclR1cm5TY3JlZW4oJ1BMQVlFUiAyJyk7XG4gIGF3YWl0IHJlbmRlclNoaXBTY3JlZW4oYm9hcmQyKTtcblxuICBhd2FpdCByZW5kZXJUdXJuU2NyZWVuKCdQTEFZRVIgMScpO1xuICBhd2FpdCBwbGF5ZXJUdXJuKGJvYXJkMSwgYm9hcmQyLCBwbGF5ZXIxLCBwbGF5ZXIyLCAnUExBWUVSIDEnLCAnUExBWUVSIDInKTtcblxuICAvLyBDU1Mgc2VsZWN0b3JzIG5lZWQgYWRqdXN0aW5nIGluIHRoaXMgbG9vcCBkdWUgdG8gdGhlXG4gIC8vIGJvYXJkcyBiZWluZyBjbGVhcmVkIGJldHdlZW4gZWFjaCB0dXJuXG4gIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ21haW4nKS5jbGFzc0xpc3QuYWRkKCd0d28tcGxheWVyJyk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHBsYXllclR1cm4oXG4gIG93bkJvYXJkLFxuICBlbmVteUJvYXJkLFxuICB0aGlzUGxheWVyLFxuICBuZXh0UGxheWVyLFxuICB0aGlzUGxheWVyU3RyLFxuICBuZXh0UGxheWVyU3RyXG4pIHtcbiAgbGV0IG51bUF0dGFja3MgPSAwO1xuXG4gIGNsZWFyQm9hcmRzKCk7XG4gIHN3YXBTdW5rRmxlZXRzKCk7XG4gIHJlTWFya1N1bmtTaGlwcygpO1xuXG4gIC8vIENvbnRyb2xzIHdoZXJlIGhpdHMvbWlzc2VzIGFyZSBhbm5vdW5jZWQgYW5kIHN1bmsgc2hpcHMgc2hvd25cbiAgcHVibGlzaCgndGFyZ2V0Q2hhbmdlJywgJ2VuZW15Jyk7XG5cbiAgcmVuZGVyQm9hcmQob3duQm9hcmQuYm9hcmRBcnJheSwgJ293bicpO1xuICByZW5kZXJCb2FyZChlbmVteUJvYXJkLmJvYXJkQXJyYXksICdlbmVteScpO1xuXG4gIGNsaWNrTGlzdGVuZXIodGhpc1BsYXllciwgJ2VuZW15Jyk7XG5cbiAgc3Vic2NyaWJlKCdzcXVhcmVBdHRhY2tlZCcsIHBsYXllckF0dGFjayk7XG5cbiAgZnVuY3Rpb24gcGxheWVyQXR0YWNrKFtwbGF5ZXIsIHRhcmdldF0pIHtcbiAgICBwbGF5ZXIubWFrZUF0dGFjayhbdGFyZ2V0WzBdLCB0YXJnZXRbMV1dKTtcblxuICAgIHJlbmRlckJvYXJkKGVuZW15Qm9hcmQuYm9hcmRBcnJheSwgJ2VuZW15Jyk7XG5cbiAgICBpZiAoZW5lbXlCb2FyZC5pc0ZsZWV0U3VuaygpKSB7XG4gICAgICBwdWJsaXNoKCdmbGVldFN1bmsnLCBbbmV4dFBsYXllclN0ciwgdGhpc1BsYXllclN0cl0pO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBudW1BdHRhY2tzKys7XG5cbiAgICBpZiAobnVtQXR0YWNrcyA9PT0gNSkge1xuICAgICAgbnVtQXR0YWNrcyA9IDA7XG4gICAgICB1bnN1YnNjcmliZSgnc3F1YXJlQXR0YWNrZWQnLCBwbGF5ZXJBdHRhY2spO1xuXG4gICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgY2hhbmdlUGxheWVyKFxuICAgICAgICAgIG93bkJvYXJkLFxuICAgICAgICAgIGVuZW15Qm9hcmQsXG4gICAgICAgICAgdGhpc1BsYXllcixcbiAgICAgICAgICBuZXh0UGxheWVyLFxuICAgICAgICAgIHRoaXNQbGF5ZXJTdHIsXG4gICAgICAgICAgbmV4dFBsYXllclN0clxuICAgICAgICApO1xuICAgICAgfSwgMTAwMCk7XG4gICAgfVxuICB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGNoYW5nZVBsYXllcihcbiAgb3duQm9hcmQsXG4gIGVuZW15Qm9hcmQsXG4gIHRoaXNQbGF5ZXIsXG4gIG5leHRQbGF5ZXIsXG4gIHRoaXNQbGF5ZXJTdHIsXG4gIG5leHRQbGF5ZXJTdHJcbikge1xuICBhd2FpdCByZW5kZXJUdXJuU2NyZWVuKG5leHRQbGF5ZXJTdHIpO1xuXG4gIHBsYXllclR1cm4oXG4gICAgZW5lbXlCb2FyZCxcbiAgICBvd25Cb2FyZCxcbiAgICBuZXh0UGxheWVyLFxuICAgIHRoaXNQbGF5ZXIsXG4gICAgbmV4dFBsYXllclN0cixcbiAgICB0aGlzUGxheWVyU3RyXG4gICk7XG59XG4iLCJpbXBvcnQgeyBuZXdHYW1lIH0gZnJvbSAnLi9nYW1lLmpzJztcblxubmV3R2FtZSgpO1xuXG4iXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=
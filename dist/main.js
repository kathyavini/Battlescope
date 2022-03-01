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
  // for testing suite
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
        boardSquare.style.pointerEvents = 'none'; // necessary for the 2-player version where the boards are redrawn each turn
      } else if (value === 'sunk') {
        boardSquare.classList.add(value);
        boardSquare.classList.add('hit');
        boardSquare.style.pointerEvents = 'none';
      } else {
        boardSquare.classList.add(value);
        boardSquare.classList.add('ship');

        // Tag one square per (own) ship for showing the animal image
        // Enemy ships show their animal type when they are sunk
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

function clearBoards() {
  // for two-player mode
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
  // For two player mode, where the boards are switched each turn
  const ownBoardArea = document.querySelector(`.own .board-fleet`);
  const enemyBoardArea = document.querySelector(`.enemy .board-fleet`);

  enemyBoardArea.appendChild(document.querySelector(`.own .sunk-fleet`));
  ownBoardArea.appendChild(document.querySelector(`.enemy .sunk-fleet`));
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

  // These functions used to announce hit locations as well; for now leaving location data here in case that is re-implemented
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
      "DIRECTIONS: Explore your opponent's ocean with your underwater scope. The first to spot all five sea creatures wins! In 2-PLAYER-MODE each turn grants three scope attempts."
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
      resolve(true);
    });
  });
}

function listenForDragDropEvents(gameboard) {
  let thisDragElement;
  const dragBoard = document.querySelector('.drag-board');
  dragBoard.addEventListener('dragstart', (ev) => {
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

        thisDragElement.parentNode.removeChild(thisDragElement);
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

            thisDragElement.parentNode.removeChild(thisDragElement);
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

  await playerTurn(board1, board2, player1, player2, 'Player 1', 'Player 2');

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
      publish('fleetSunk', ['Computer', 'Human']);
      return;
    }
    numAttacks++;

    if (numAttacks === 3) {
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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OztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7OztBQUdBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsTUFBTTtBQUNOO0FBQ0E7QUFDQTtBQUNBLE1BQU07QUFDTjtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsTUFBTTtBQUNOO0FBQ0EsTUFBTTtBQUNOO0FBQ0EsTUFBTTtBQUNOO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLE1BQU07QUFDTjtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBLE1BQU07QUFDTjtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFD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QUFnQjtBQUN4QixRQUFRLGdCQUFnQjs7QUFFeEIsUUFBUSxnQkFBZ0I7QUFDeEIsUUFBUSxnQkFBZ0I7O0FBRXhCOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxFQUFFLFdBQVc7QUFDYixFQUFFLGNBQWM7O0FBRWhCO0FBQ0EsRUFBRSxPQUFPOztBQUVULEVBQUUsV0FBVztBQUNiLEVBQUUsV0FBVzs7QUFFYixFQUFFLGFBQWE7O0FBRWYsRUFBRSxTQUFTOztBQUVYO0FBQ0E7O0FBRUEsSUFBSSxXQUFXOztBQUVmO0FBQ0EsTUFBTSxPQUFPO0FBQ2I7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSxNQUFNLFdBQVc7O0FBRWpCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE9BQU87QUFDUDtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFFBQVEsZ0JBQWdCOztBQUV4QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQzNLb0M7O0FBRXBDLE9BQU8iLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9iYXR0bGVzaGlwLy4vc3JjL3V0aWxzLmpzIiwid2VicGFjazovL2JhdHRsZXNoaXAvLi9zcmMvcHVic3ViLmpzIiwid2VicGFjazovL2JhdHRsZXNoaXAvLi9zcmMvZG9tLmpzIiwid2VicGFjazovL2JhdHRsZXNoaXAvLi9zcmMvZHJhZ0Ryb3AuanMiLCJ3ZWJwYWNrOi8vYmF0dGxlc2hpcC8uL3NyYy9wbGF5ZXIuanMiLCJ3ZWJwYWNrOi8vYmF0dGxlc2hpcC8uL3NyYy9zaGlwcy5qcyIsIndlYnBhY2s6Ly9iYXR0bGVzaGlwLy4vc3JjL2dhbWVib2FyZC5qcyIsIndlYnBhY2s6Ly9iYXR0bGVzaGlwLy4vc3JjL2dhbWUuanMiLCJ3ZWJwYWNrOi8vYmF0dGxlc2hpcC8uL3NyYy9pbmRleC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgZnVuY3Rpb24gY3JlYXRlTmV3RWxlbWVudChcbiAgdHlwZSxcbiAgY2xhc3NlcyA9IG51bGwsXG4gIHRleHQgPSBudWxsLFxuICBhdHRyaWJ1dGVzID0gbnVsbFxuKSB7XG4gIGxldCBjcmVhdGVkRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQodHlwZSk7XG5cbiAgaWYgKGNsYXNzZXMpIHtcbiAgICBjcmVhdGVkRWxlbWVudC5jbGFzc0xpc3QuYWRkKC4uLmNsYXNzZXMpO1xuICB9XG5cbiAgaWYgKHRleHQpIHtcbiAgICBjcmVhdGVkRWxlbWVudC50ZXh0Q29udGVudCA9IHRleHQ7XG4gIH1cblxuICBpZiAoYXR0cmlidXRlcykge1xuICAgIGZvciAobGV0IGtleSBpbiBhdHRyaWJ1dGVzKSB7XG4gICAgICBjcmVhdGVkRWxlbWVudC5zZXRBdHRyaWJ1dGUoa2V5LCBhdHRyaWJ1dGVzW2tleV0pO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBjcmVhdGVkRWxlbWVudDtcbn1cbiIsIi8qIFRoaXMgaXMgYWRhcHRlZCBmcm9tIFN0ZXZlIEdyaWZmaXRoJ3MgUHViU3ViIERlc2lnbiBQYXR0ZXJuIGluIEpTXG5cblZpZGVvOiBodHRwczovL3d3dy55b3V0dWJlLmNvbS93YXRjaD92PWF5blNNOGxsT0JzXG5SZXBvOiBodHRwczovL2dpdGh1Yi5jb20vcHJvZjNzc29yU3QzdjMvcHVic3ViLWRlbW8gKi9cblxuY29uc3QgZXZlbnRzID0ge307XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRFdmVudHMoKSB7XG4gIC8vIGZvciB0ZXN0aW5nIHN1aXRlXG4gIHJldHVybiB7IC4uLmV2ZW50cyB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc3Vic2NyaWJlKGV2ZW50TmFtZSwgY2FsbGJhY2spIHtcbiAgZXZlbnRzW2V2ZW50TmFtZV0gPSBldmVudHNbZXZlbnROYW1lXSB8fCBbXTtcbiAgZXZlbnRzW2V2ZW50TmFtZV0ucHVzaChjYWxsYmFjayk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB1bnN1YnNjcmliZShldmVudE5hbWUsIGNhbGxiYWNrKSB7XG4gIGlmIChldmVudHNbZXZlbnROYW1lXSkge1xuICAgIGV2ZW50c1tldmVudE5hbWVdID0gZXZlbnRzW2V2ZW50TmFtZV0uZmlsdGVyKChmbikgPT4gZm4gIT09IGNhbGxiYWNrKTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gcHVibGlzaChldmVudE5hbWUsIGRhdGEpIHtcbiAgaWYgKGV2ZW50c1tldmVudE5hbWVdKSB7XG4gICAgZm9yIChjb25zdCBjYWxsYmFjayBvZiBldmVudHNbZXZlbnROYW1lXSkge1xuICAgICAgY2FsbGJhY2soZGF0YSk7XG4gICAgfVxuICB9XG59XG4iLCJpbXBvcnQgJy4vY3NzL2NvbG9ycy1hbmQtZm9udHMuY3NzJztcbmltcG9ydCAnLi9jc3MvZG9tLmNzcyc7XG5pbXBvcnQgJy4vY3NzL21vYmlsZS5jc3MnO1xuaW1wb3J0IHsgY3JlYXRlTmV3RWxlbWVudCB9IGZyb20gJy4vdXRpbHMnO1xuaW1wb3J0IHsgc3Vic2NyaWJlLCBwdWJsaXNoIH0gZnJvbSAnLi9wdWJzdWInO1xuXG4vKiBGb3IgdGhlbWVpbmcgKi9cbmNvbnN0IHNoaXBNYXBwaW5nID0ge1xuICBjYXJyaWVyOiAnb2N0b3B1cycsXG4gIGJhdHRsZXNoaXA6ICdwdWZmZXJmaXNoJyxcbiAgZGVzdHJveWVyOiAnZ29sZGZpc2gnLFxuICBzdWJtYXJpbmU6ICdzZWFob3JzZScsXG4gICdwYXRyb2wgYm9hdCc6ICdiZXR0YSBmaXNoJyxcbn07XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVDb250YWluZXJzKCkge1xuICBjb25zdCBib2R5ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignYm9keScpO1xuICBjb25zdCBib2FyZHNDb250YWluZXIgPSBjcmVhdGVOZXdFbGVtZW50KCdtYWluJywgWydwbGF5LWFyZWEnXSk7XG4gIGNvbnN0IGVuZW15Q29udGFpbmVyID0gY3JlYXRlTmV3RWxlbWVudCgnc2VjdGlvbicsIFsnZW5lbXknXSk7XG4gIGNvbnN0IG93bkNvbnRhaW5lciA9IGNyZWF0ZU5ld0VsZW1lbnQoJ3NlY3Rpb24nLCBbJ293biddKTtcbiAgY29uc3QgZW5lbXlCb2FyZEZsZWV0ID0gY3JlYXRlTmV3RWxlbWVudCgnZGl2JywgWydib2FyZC1mbGVldCddKTtcbiAgY29uc3Qgb3duQm9hcmRGbGVldCA9IGNyZWF0ZU5ld0VsZW1lbnQoJ2RpdicsIFsnYm9hcmQtZmxlZXQnXSk7XG5cbiAgZW5lbXlDb250YWluZXIuYXBwZW5kKFxuICAgIGNyZWF0ZU5ld0VsZW1lbnQoJ2gyJywgWydzdWJ0aXRsZScsICdlbmVteS10aXRsZSddLCAnT3Bwb25lbnQgT2NlYW4nKSxcbiAgICBjcmVhdGVOZXdFbGVtZW50KCdoMycsIFsnYW5ub3VuY2UtcGFuZWwnXSksXG4gICAgZW5lbXlCb2FyZEZsZWV0XG4gICk7XG4gIGVuZW15Qm9hcmRGbGVldC5hcHBlbmQoXG4gICAgY3JlYXRlTmV3RWxlbWVudCgnZGl2JywgWydib2FyZCcsICdlbmVteS1ib2FyZCddKSxcbiAgICBjcmVhdGVOZXdFbGVtZW50KCdkaXYnLCBbJ3N1bmstZmxlZXQnXSlcbiAgKTtcblxuICBvd25Db250YWluZXIuYXBwZW5kKFxuICAgIGNyZWF0ZU5ld0VsZW1lbnQoJ2gyJywgWydzdWJ0aXRsZScsICdvd24tdGl0bGUnXSwgJ1lvdXIgT2NlYW4nKSxcbiAgICBjcmVhdGVOZXdFbGVtZW50KCdoMycsIFsnYW5ub3VuY2UtcGFuZWwnXSksXG4gICAgb3duQm9hcmRGbGVldFxuICApO1xuICBvd25Cb2FyZEZsZWV0LmFwcGVuZChcbiAgICBjcmVhdGVOZXdFbGVtZW50KCdkaXYnLCBbJ2JvYXJkJywgJ293bi1ib2FyZCddKSxcbiAgICBjcmVhdGVOZXdFbGVtZW50KCdkaXYnLCBbJ3N1bmstZmxlZXQnXSlcbiAgKTtcblxuICBib2FyZHNDb250YWluZXIuYXBwZW5kKGVuZW15Q29udGFpbmVyLCBvd25Db250YWluZXIpO1xuXG4gIGJvZHkuYXBwZW5kKFxuICAgIGNyZWF0ZU5ld0VsZW1lbnQoJ2gxJywgWyd0aXRsZSddLCAnQmF0dGxlc2NvcGUnKSxcbiAgICBjcmVhdGVOZXdFbGVtZW50KCdoMycsIFsnZ2FtZS1hbm5vdW5jZSddKSxcbiAgICBib2FyZHNDb250YWluZXJcbiAgKTtcblxuICAvKiBHYW1lYm9hcmQgc3F1YXJlcyAqL1xuICBjb25zdCBib2FyZHMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcuYm9hcmQnKTtcbiAgZm9yIChjb25zdCBib2FyZCBvZiBib2FyZHMpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IDEwOyBpKyspIHtcbiAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgMTA7IGorKykge1xuICAgICAgICBjb25zdCBkaXYgPSBjcmVhdGVOZXdFbGVtZW50KCdkaXYnLCBbJ3NxdWFyZSddLCBudWxsLCB7XG4gICAgICAgICAgJ2RhdGEtcG9zJzogYCR7aX0ke2p9YCxcbiAgICAgICAgfSk7XG4gICAgICAgIGJvYXJkLmFwcGVuZENoaWxkKGRpdik7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZW5kZXJCb2FyZChib2FyZCwgc2VjdGlvbikge1xuICBmb3IgKGxldCBpID0gMDsgaSA8IDEwOyBpKyspIHtcbiAgICBmb3IgKGxldCBqID0gMDsgaiA8IDEwOyBqKyspIHtcbiAgICAgIGNvbnN0IHZhbHVlID0gYm9hcmRbaV1bal07XG4gICAgICBjb25zdCBib2FyZFNxdWFyZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXG4gICAgICAgIGAuJHtzZWN0aW9ufS1ib2FyZCBbZGF0YS1wb3M9XCIke2l9JHtqfVwiXWBcbiAgICAgICk7XG4gICAgICBpZiAoIXZhbHVlKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfSBlbHNlIGlmICh2YWx1ZSA9PT0gJ2hpdCcgfHwgdmFsdWUgPT09ICdtaXNzJykge1xuICAgICAgICBib2FyZFNxdWFyZS5jbGFzc0xpc3QuYWRkKHZhbHVlKTtcbiAgICAgICAgYm9hcmRTcXVhcmUuc3R5bGUucG9pbnRlckV2ZW50cyA9ICdub25lJzsgLy8gbmVjZXNzYXJ5IGZvciB0aGUgMi1wbGF5ZXIgdmVyc2lvbiB3aGVyZSB0aGUgYm9hcmRzIGFyZSByZWRyYXduIGVhY2ggdHVyblxuICAgICAgfSBlbHNlIGlmICh2YWx1ZSA9PT0gJ3N1bmsnKSB7XG4gICAgICAgIGJvYXJkU3F1YXJlLmNsYXNzTGlzdC5hZGQodmFsdWUpO1xuICAgICAgICBib2FyZFNxdWFyZS5jbGFzc0xpc3QuYWRkKCdoaXQnKTtcbiAgICAgICAgYm9hcmRTcXVhcmUuc3R5bGUucG9pbnRlckV2ZW50cyA9ICdub25lJztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGJvYXJkU3F1YXJlLmNsYXNzTGlzdC5hZGQodmFsdWUpO1xuICAgICAgICBib2FyZFNxdWFyZS5jbGFzc0xpc3QuYWRkKCdzaGlwJyk7XG5cbiAgICAgICAgLy8gVGFnIG9uZSBzcXVhcmUgcGVyIChvd24pIHNoaXAgZm9yIHNob3dpbmcgdGhlIGFuaW1hbCBpbWFnZVxuICAgICAgICAvLyBFbmVteSBzaGlwcyBzaG93IHRoZWlyIGFuaW1hbCB0eXBlIHdoZW4gdGhleSBhcmUgc3Vua1xuICAgICAgICBib2FyZFNxdWFyZS5jbGFzc0xpc3QuYWRkKGAke3ZhbHVlWzBdfWApO1xuXG4gICAgICAgIGlmICh2YWx1ZVswXSA9PT0gJ2InICYmIHZhbHVlWzFdID09PSAnMicpIHtcbiAgICAgICAgICBib2FyZFNxdWFyZS5jbGFzc0xpc3QuYWRkKCd0YWdnZWQnKTtcbiAgICAgICAgfSBlbHNlIGlmICh2YWx1ZVswXSA9PT0gJ2MnICYmIHZhbHVlWzFdID09PSAnMycpIHtcbiAgICAgICAgICBib2FyZFNxdWFyZS5jbGFzc0xpc3QuYWRkKCd0YWdnZWQnKTtcbiAgICAgICAgfSBlbHNlIGlmICgodmFsdWVbMF0gPT09ICdzJyB8fCB2YWx1ZVswXSA9PT0gJ2QnKSAmJiB2YWx1ZVsxXSA9PT0gJzInKSB7XG4gICAgICAgICAgYm9hcmRTcXVhcmUuY2xhc3NMaXN0LmFkZCgndGFnZ2VkJyk7XG4gICAgICAgIH0gZWxzZSBpZiAodmFsdWVbMF0gPT09ICdwJyAmJiB2YWx1ZVsxXSA9PT0gJzEnKSB7XG4gICAgICAgICAgYm9hcmRTcXVhcmUuY2xhc3NMaXN0LmFkZCgndGFnZ2VkJyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNsZWFyQm9hcmRzKCkge1xuICAvLyBmb3IgdHdvLXBsYXllciBtb2RlXG4gIGNvbnN0IGJvYXJkcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5ib2FyZCcpO1xuICBmb3IgKGNvbnN0IGJvYXJkIG9mIGJvYXJkcykge1xuICAgIGJvYXJkLmlubmVySFRNTCA9ICcnO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgMTA7IGkrKykge1xuICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCAxMDsgaisrKSB7XG4gICAgICAgIGNvbnN0IGRpdiA9IGNyZWF0ZU5ld0VsZW1lbnQoJ2RpdicsIFsnc3F1YXJlJ10sIG51bGwsIHtcbiAgICAgICAgICAnZGF0YS1wb3MnOiBgJHtpfSR7an1gLFxuICAgICAgICB9KTtcbiAgICAgICAgYm9hcmQuYXBwZW5kQ2hpbGQoZGl2KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHN3YXBTdW5rRmxlZXRzKCkge1xuICAvLyBGb3IgdHdvIHBsYXllciBtb2RlLCB3aGVyZSB0aGUgYm9hcmRzIGFyZSBzd2l0Y2hlZCBlYWNoIHR1cm5cbiAgY29uc3Qgb3duQm9hcmRBcmVhID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgLm93biAuYm9hcmQtZmxlZXRgKTtcbiAgY29uc3QgZW5lbXlCb2FyZEFyZWEgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAuZW5lbXkgLmJvYXJkLWZsZWV0YCk7XG5cbiAgZW5lbXlCb2FyZEFyZWEuYXBwZW5kQ2hpbGQoZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgLm93biAuc3Vuay1mbGVldGApKTtcbiAgb3duQm9hcmRBcmVhLmFwcGVuZENoaWxkKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYC5lbmVteSAuc3Vuay1mbGVldGApKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNsaWNrTGlzdGVuZXIocGxheWVyLCBzZWN0aW9uKSB7XG4gIGNvbnN0IHRhcmdldENvbnRhaW5lciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYHNlY3Rpb24uJHtzZWN0aW9ufWApO1xuXG4gIGNvbnN0IHRhcmdldFNxdWFyZXMgPSB0YXJnZXRDb250YWluZXIucXVlcnlTZWxlY3RvckFsbCgnLnNxdWFyZScpO1xuICB0YXJnZXRTcXVhcmVzLmZvckVhY2goKHNxdWFyZSkgPT4ge1xuICAgIHNxdWFyZS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIChldikgPT4ge1xuICAgICAgY2xpY2tBdHRhY2soZXYsIHBsYXllcik7XG4gICAgfSk7XG4gIH0pO1xufVxuXG5mdW5jdGlvbiBjbGlja0F0dGFjayhldiwgcGxheWVyKSB7XG4gIC8vIEdhbWVib2FyZCBjb25zdW1lcyB0aGUgZXZlbnQgZW1pdHRlZCBoZXJlXG4gIHB1Ymxpc2goJ3NxdWFyZUF0dGFja2VkJywgW3BsYXllciwgZXYudGFyZ2V0LmRhdGFzZXQucG9zXSk7XG5cbiAgLy8gVGhhdCBzcXVhcmUgY2FuIG5vIGxvbmdlciBiZSB0YXJnZXRlZFxuICBldi50YXJnZXQuc3R5bGUucG9pbnRlckV2ZW50cyA9ICdub25lJztcblxuICAvLyBUaW1lIHVudGlsIG5leHQgaHVtYW4gY2xpY2sgY2FuIGJlIHJlZ2lzdGVyZWQgb24gYW55IHNxdWFyZVxuICBldi50YXJnZXQucGFyZW50RWxlbWVudC5zdHlsZS5wb2ludGVyRXZlbnRzID0gJ25vbmUnO1xuICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICBldi50YXJnZXQucGFyZW50RWxlbWVudC5zdHlsZS5wb2ludGVyRXZlbnRzID0gJ2luaXRpYWwnO1xuICB9LCA1MCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBtYWtlQW5ub3VuY2VtZW50cygpIHtcbiAgY29uc3QgZ2FtZVBhbmVsID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLmdhbWUtYW5ub3VuY2UnKTtcbiAgY29uc3QgYm9hcmRzQ29udGFpbmVyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignbWFpbicpO1xuXG4gIGxldCBwYW5lbDtcbiAgbGV0IHN1bmtGbGVldDtcblxuICAvLyBHYW1lIGxvb3AgZW1pdHMgZXZlbnQgd2hlbiBhY3RpdmUgcGFuZWwgaXMgc3dpdGNoZWRcbiAgc3Vic2NyaWJlKCd0YXJnZXRDaGFuZ2UnLCBjaGFuZ2VQYW5lbCk7XG5cbiAgZnVuY3Rpb24gY2hhbmdlUGFuZWwodGFyZ2V0KSB7XG4gICAgcGFuZWwgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAuJHt0YXJnZXR9IC5hbm5vdW5jZS1wYW5lbGApO1xuICAgIHN1bmtGbGVldCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYC4ke3RhcmdldH0gLnN1bmstZmxlZXRgKTtcbiAgfVxuXG4gIGNvbnN0IGFubm91bmNlUGFuZWxzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLmFubm91bmNlLXBhbmVsJyk7XG5cbiAgLy8gVGltaW5nIG9mIGFubm91bmNlbWVudHMgYXJlIGNvbnRyb2xsZWQgYnkgQ1NTIHRyYW5zaXRpb25zXG4gIGZvciAoY29uc3QgcGFuZWwgb2YgYW5ub3VuY2VQYW5lbHMpIHtcbiAgICBwYW5lbC5hZGRFdmVudExpc3RlbmVyKCd0cmFuc2l0aW9uZW5kJywgKCkgPT4ge1xuICAgICAgcGFuZWwuY2xhc3NMaXN0LnJlbW92ZSgndmlzaWJsZScpO1xuICAgICAgcGFuZWwuY2xhc3NMaXN0LnJlbW92ZSgnaGl0Jyk7XG4gICAgfSk7XG4gIH1cblxuICBzdWJzY3JpYmUoJ2hpdCcsIGFubm91bmNlSGl0KTtcbiAgc3Vic2NyaWJlKCdtaXNzJywgYW5ub3VuY2VNaXNzKTtcbiAgc3Vic2NyaWJlKCdzaGlwU3VuaycsIGFubm91bmNlU3Vua1NoaXApO1xuICBzdWJzY3JpYmUoJ2ZsZWV0U3VuaycsIGFubm91bmNlV2luKTtcbiAgc3Vic2NyaWJlKCdmbGVldFN1bmsnLCBlbmRHYW1lKTtcbiAgc3Vic2NyaWJlKCdzaGlwU3VuaycsIHJlbmRlclN1bmtTaGlwKTtcblxuICAvLyBUaGVzZSBmdW5jdGlvbnMgdXNlZCB0byBhbm5vdW5jZSBoaXQgbG9jYXRpb25zIGFzIHdlbGw7IGZvciBub3cgbGVhdmluZyBsb2NhdGlvbiBkYXRhIGhlcmUgaW4gY2FzZSB0aGF0IGlzIHJlLWltcGxlbWVudGVkXG4gIGZ1bmN0aW9uIGFubm91bmNlSGl0KFtyb3csIGNvbHVtbl0pIHtcbiAgICBwYW5lbC5jbGFzc0xpc3QuYWRkKCd2aXNpYmxlJyk7XG4gICAgcGFuZWwuY2xhc3NMaXN0LmFkZCgnaGl0Jyk7XG4gICAgcGFuZWwudGV4dENvbnRlbnQgPSBgU29tZXRoaW5nJ3MgYmVlbiBzcG90dGVkIWA7XG4gIH1cblxuICBmdW5jdGlvbiBhbm5vdW5jZU1pc3MoKSB7XG4gICAgcGFuZWwuY2xhc3NMaXN0LmFkZCgndmlzaWJsZScpO1xuICAgIHBhbmVsLnRleHRDb250ZW50ID0gYE5vdGhpbmchYDtcbiAgfVxuXG4gIGZ1bmN0aW9uIGFubm91bmNlU3Vua1NoaXAoW2hpdFNoaXAsIFtyb3csIGNvbHVtbl1dKSB7XG4gICAgcGFuZWwuY2xhc3NMaXN0LmFkZCgndmlzaWJsZScpO1xuICAgIGNvbnN0IGNyZWF0dXJlID0gc2hpcE1hcHBpbmdbYCR7aGl0U2hpcC50eXBlfWBdO1xuICAgIHBhbmVsLnRleHRDb250ZW50ID0gYEl0J3MgYSAke2NyZWF0dXJlfSEhYDtcbiAgfVxuXG4gIGZ1bmN0aW9uIGFubm91bmNlV2luKFtsb3Nlciwgd2lubmVyXSkge1xuICAgIGdhbWVQYW5lbC5jbGFzc0xpc3QuYWRkKCd3aW4nKTtcbiAgICBnYW1lUGFuZWwudGV4dENvbnRlbnQgPSBgJHtsb3Nlcn0ncyBzZWEgY3JlYXR1cmVzIGhhdmUgYmVlbiBmb3VuZCEgJHt3aW5uZXJ9IHdpbnMhYDtcbiAgfVxuXG4gIGZ1bmN0aW9uIGVuZEdhbWUoKSB7XG4gICAgLy8gQ29sbGFwc2UgYm9hcmQgYW5ub3VuY2UgcGFuZWxzXG4gICAgZm9yIChjb25zdCBwYW5lbCBvZiBhbm5vdW5jZVBhbmVscykge1xuICAgICAgcGFuZWwuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICB9XG4gICAgLy8gRGlzYWJsZSBmdXJ0aGVyIGNsaWNraW5nXG4gICAgYm9hcmRzQ29udGFpbmVyLnN0eWxlLnBvaW50ZXJFdmVudHMgPSAnbm9uZSc7XG5cbiAgICAvLyBCdXR0b24gdG8gcmVzdGFydCAocmVsb2FkKSBnYW1lXG4gICAgY29uc3QgcGxheUFnYWluID0gY3JlYXRlTmV3RWxlbWVudCgnYnV0dG9uJywgWydwbGF5LWFnYWluJ10sICdQbGF5IEFnYWluJyk7XG5cbiAgICBwbGF5QWdhaW4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoZXYpID0+IHtcbiAgICAgIGV2LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICBsb2NhdGlvbi5yZWxvYWQoKTtcbiAgICB9KTtcblxuICAgIGdhbWVQYW5lbC5hcHBlbmRDaGlsZChwbGF5QWdhaW4pO1xuICB9XG5cbiAgZnVuY3Rpb24gcmVuZGVyU3Vua1NoaXAoW2hpdFNoaXAsIFtyb3csIGNvbHVtbl1dKSB7XG4gICAgY29uc3Qgc2hpcFJlbmRlciA9IGNyZWF0ZU5ld0VsZW1lbnQoJ2RpdicsIFtcbiAgICAgICdzaGlwLXJlbmRlcicsXG4gICAgICBgJHtoaXRTaGlwLnR5cGVbMF19YCxcbiAgICBdKTtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaGl0U2hpcC5sZW5ndGg7IGkrKykge1xuICAgICAgc2hpcFJlbmRlci5hcHBlbmRDaGlsZChjcmVhdGVOZXdFbGVtZW50KCdkaXYnLCBbJ3NoaXAtcGFydCddKSk7XG4gICAgfVxuXG4gICAgc3Vua0ZsZWV0LmFwcGVuZENoaWxkKHNoaXBSZW5kZXIpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZW5kZXJTdGFydFNjcmVlbigpIHtcbiAgY29uc3QgYm9keSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ2JvZHknKTtcbiAgY29uc3QgcGxheWVyMSA9IGNyZWF0ZU5ld0VsZW1lbnQoXG4gICAgJ2J1dHRvbicsXG4gICAgWydzaW5nbGUtcGxheWVyLWJ1dHRvbiddLFxuICAgICcxLVBsYXllcidcbiAgKTtcbiAgY29uc3QgcGxheWVyMiA9IGNyZWF0ZU5ld0VsZW1lbnQoJ2J1dHRvbicsIFsndHdvLXBsYXllci1idXR0b24nXSwgJzItUGxheWVyJyk7XG5cbiAgY29uc3Qgc3RhcnRTY3JlZW4gPSBjcmVhdGVOZXdFbGVtZW50KCdkaXYnLCBbJ3N0YXJ0LXNjcmVlbiddKTtcbiAgc3RhcnRTY3JlZW4uYXBwZW5kKFxuICAgIGNyZWF0ZU5ld0VsZW1lbnQoJ2gxJywgWydzdGFydC10aXRsZSddLCAnQmF0dGxlU0NPUEUnKSxcbiAgICBjcmVhdGVOZXdFbGVtZW50KCdkaXYnLCBbJ3Njb3BlJ10pLFxuICAgIGNyZWF0ZU5ld0VsZW1lbnQoXG4gICAgICAnaDInLFxuICAgICAgWydzdGFydC1zdWJ0aXRsZSddLFxuICAgICAgJ0EgZnJpZW5kbGllciB0YWtlIG9uIHRoZSBjbGFzc2ljIGdhbWUgQmF0dGxlc2hpcCdcbiAgICApLFxuICAgIGNyZWF0ZU5ld0VsZW1lbnQoXG4gICAgICAncCcsXG4gICAgICBbJ2RpcmVjdGlvbnMnXSxcbiAgICAgIFwiRElSRUNUSU9OUzogRXhwbG9yZSB5b3VyIG9wcG9uZW50J3Mgb2NlYW4gd2l0aCB5b3VyIHVuZGVyd2F0ZXIgc2NvcGUuIFRoZSBmaXJzdCB0byBzcG90IGFsbCBmaXZlIHNlYSBjcmVhdHVyZXMgd2lucyEgSW4gMi1QTEFZRVItTU9ERSBlYWNoIHR1cm4gZ3JhbnRzIHRocmVlIHNjb3BlIGF0dGVtcHRzLlwiXG4gICAgKSxcbiAgICBwbGF5ZXIxLFxuICAgIHBsYXllcjJcbiAgKTtcblxuICBib2R5LmFwcGVuZChzdGFydFNjcmVlbik7XG5cbiAgcmV0dXJuIFtwbGF5ZXIxLCBwbGF5ZXIyXTsgLy8gdG8gY29udHJvbCBnYW1lIHR5cGUgZnJvbSBnYW1lIG1vZHVsZVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVuZGVyVHVyblNjcmVlbihwbGF5ZXIpIHtcbiAgY29uc3QgYm9keSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ2JvZHknKTtcbiAgY29uc3QgcmVhZHlCdXR0b24gPSBjcmVhdGVOZXdFbGVtZW50KCdidXR0b24nLCBbJ3JlYWR5LWJ1dHRvbiddLCAnUmVhZHknKTtcblxuICBjb25zdCB0dXJuU2NyZWVuID0gY3JlYXRlTmV3RWxlbWVudCgnZGl2JywgWyd0dXJuLXNjcmVlbiddKTtcbiAgdHVyblNjcmVlbi5hcHBlbmQoXG4gICAgY3JlYXRlTmV3RWxlbWVudChcbiAgICAgICdoMicsXG4gICAgICBbJ3R1cm4taW5zdHJ1Y3Rpb25zJ10sXG4gICAgICBgUGxlYXNlIHBhc3MgdGhlIGRldmljZSB0byAke3BsYXllcn0uIEhpdCByZWFkeSB3aGVuIGRldmljZSBpcyBwYXNzZWRgXG4gICAgKSxcbiAgICByZWFkeUJ1dHRvblxuICApO1xuXG4gIGJvZHkuYXBwZW5kKHR1cm5TY3JlZW4pO1xuXG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgIHJlYWR5QnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKGV2KSA9PiB7XG4gICAgICBldi5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgdHVyblNjcmVlbi5wYXJlbnRFbGVtZW50LnJlbW92ZUNoaWxkKHR1cm5TY3JlZW4pO1xuICAgICAgcmVzb2x2ZSh0cnVlKTtcbiAgICB9KTtcbiAgfSk7XG59XG4iLCJpbXBvcnQgeyBjcmVhdGVOZXdFbGVtZW50IH0gZnJvbSAnLi91dGlscyc7XG5cbmV4cG9ydCBmdW5jdGlvbiByZW5kZXJTaGlwU2NyZWVuKGdhbWVib2FyZCkge1xuICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdtYWluJykuc3R5bGUuZGlzcGxheSA9ICdub25lJztcblxuICAvLyBIaWRlcyB0aXRsZSBhbmQgZGlzYWJsZXMgb3ZlcmZsb3cgb24gbW9iaWxlXG4gIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy50aXRsZScpLmNsYXNzTGlzdC5hZGQoJ2hpZGRlbicpO1xuICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdodG1sJykuY2xhc3NMaXN0LmFkZCgnZHJhZ2dpbmcnKTtcblxuICBjb25zdCByYW5kb21pemUgPSBjcmVhdGVOZXdFbGVtZW50KCdidXR0b24nLCBbJ3JhbmRvbWl6ZSddLCAnUmFuZG9taXplJyk7XG4gIGNvbnN0IHN0YXJ0ID0gY3JlYXRlTmV3RWxlbWVudCgnYnV0dG9uJywgWydzdGFydCddLCAnU3RhcnQnKTtcblxuICBjb25zdCBzaGlwU2NyZWVuID0gY3JlYXRlTmV3RWxlbWVudCgnZGl2JywgWydzaGlwLXNjcmVlbiddKTtcbiAgc2hpcFNjcmVlbi5hcHBlbmQoXG4gICAgY3JlYXRlTmV3RWxlbWVudCgnaDInLCBbJ3NoaXAtc3VidGl0bGUnXSwgJ0hpZGUgeW91ciB3aWxkbGlmZScpLFxuICAgIGNyZWF0ZU5ld0VsZW1lbnQoXG4gICAgICAncCcsXG4gICAgICBbJ2RpcmVjdGlvbnMnXSxcbiAgICAgICdEcmFnIGFuZCBkcm9wIHRvIG1vdmUsIGNsaWNrIHRvIGNoYW5nZSBvcmllbnRhdGlvbi4gV2lsZGxpZmUgY2Fubm90IGJlIGFkamFjZW50IHRvIG90aGVyIHdpbGRsaWZlJ1xuICAgICksXG4gICAgcmFuZG9taXplLFxuICAgIHN0YXJ0XG4gICk7XG5cbiAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignYm9keScpLmFwcGVuZChzaGlwU2NyZWVuKTtcblxuICAvKiBDcmVhdGUgYmxhbmsgYm9hcmQgKi9cbiAgY29uc3QgYm9hcmQgPSBjcmVhdGVOZXdFbGVtZW50KCdkaXYnLCBbJ2RyYWctYm9hcmQnXSk7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgMTA7IGkrKykge1xuICAgIGZvciAobGV0IGogPSAwOyBqIDwgMTA7IGorKykge1xuICAgICAgY29uc3QgZGl2ID0gY3JlYXRlTmV3RWxlbWVudCgnZGl2JywgWydkcmFnLXNxdWFyZSddLCBudWxsLCB7XG4gICAgICAgICdkYXRhLXBvcyc6IGAke2l9JHtqfWAsXG4gICAgICB9KTtcbiAgICAgIGJvYXJkLmFwcGVuZENoaWxkKGRpdik7XG4gICAgfVxuICB9XG5cbiAgLy8gSSBmb3JnZXQgd2h5IEkgZGlkIHRoaXNcbiAgc2hpcFNjcmVlbi5pbnNlcnRCZWZvcmUoYm9hcmQsIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5yYW5kb21pemUnKSk7XG5cbiAgLy8gQ3JlYXRlIHNoaXAgRE9NIGVsZW1lbnRzXG4gIHBsYWNlRHJhZ2dhYmxlU2hpcHMoZ2FtZWJvYXJkKTtcblxuICAvLyBBZGQgZXZlbnQgbGlzdGVuZXJzIHRvIGJvYXJkXG4gIGxpc3RlbkZvckRyYWdEcm9wRXZlbnRzKGdhbWVib2FyZCk7IC8vIG1vdXNlIG9ubHlcbiAgbGlzdGVuRm9yVG91Y2hFdmVudHMoZ2FtZWJvYXJkKTsgLy8gdG91Y2hcblxuICAvLyBCdXR0b24gZXZlbnQgbGlzdGVuZXJzXG4gIHJhbmRvbWl6ZS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIChldikgPT4ge1xuICAgIGV2LnByZXZlbnREZWZhdWx0KCk7XG4gICAgZ2FtZWJvYXJkLmNsZWFyQm9hcmQoKTtcbiAgICBnYW1lYm9hcmQucGxhY2VBbGxTaGlwc1JhbmRvbWx5KCk7XG4gICAgY2xlYXJEcmFnZ2FibGVTaGlwcygpO1xuICAgIHBsYWNlRHJhZ2dhYmxlU2hpcHMoZ2FtZWJvYXJkKTtcbiAgfSk7XG5cbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgc3RhcnQuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoZXYpID0+IHtcbiAgICAgIGV2LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICBzaGlwU2NyZWVuLnBhcmVudEVsZW1lbnQucmVtb3ZlQ2hpbGQoc2hpcFNjcmVlbik7XG4gICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdtYWluJykuc3R5bGUuZGlzcGxheSA9ICdmbGV4JztcbiAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ2h0bWwnKS5jbGFzc0xpc3QucmVtb3ZlKCdkcmFnZ2luZycpO1xuICAgICAgcmVzb2x2ZSh0cnVlKTtcbiAgICB9KTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGxpc3RlbkZvckRyYWdEcm9wRXZlbnRzKGdhbWVib2FyZCkge1xuICBsZXQgdGhpc0RyYWdFbGVtZW50O1xuICBjb25zdCBkcmFnQm9hcmQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuZHJhZy1ib2FyZCcpO1xuICBkcmFnQm9hcmQuYWRkRXZlbnRMaXN0ZW5lcignZHJhZ3N0YXJ0JywgKGV2KSA9PiB7XG4gICAgdGhpc0RyYWdFbGVtZW50ID0gZXYudGFyZ2V0O1xuICB9KTtcblxuICBkcmFnQm9hcmQuYWRkRXZlbnRMaXN0ZW5lcignZHJhZ2VudGVyJywgKGV2KSA9PiB7XG4gICAgaWYgKGV2LnRhcmdldC5jbGFzc05hbWUgPT09ICdkcmFnLXNxdWFyZScpIHtcbiAgICAgIGV2LnRhcmdldC5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSAncHVycGxlJztcbiAgICB9XG4gIH0pO1xuXG4gIGRyYWdCb2FyZC5hZGRFdmVudExpc3RlbmVyKCdkcmFnbGVhdmUnLCAoZXYpID0+IHtcbiAgICBpZiAoZXYudGFyZ2V0LmNsYXNzTmFtZSA9PT0gJ2RyYWctc3F1YXJlJykge1xuICAgICAgZXYudGFyZ2V0LnN0eWxlLmJhY2tncm91bmRDb2xvciA9ICcnO1xuICAgIH1cbiAgfSk7XG5cbiAgZHJhZ0JvYXJkLmFkZEV2ZW50TGlzdGVuZXIoJ2RyYWdvdmVyJywgKGV2KSA9PiB7XG4gICAgLy8gTUROIHNheXMgdGhpcyBpcyBuZWNlc3NhcnkgdG8gYWxsb3cgZHJvcFxuICAgIGV2LnByZXZlbnREZWZhdWx0KCk7XG4gIH0pO1xuXG4gIC8vIERyYWcgYW5kIGRyb3AgdG8gdXBkYXRlIHBvc2l0aW9uXG4gIGRyYWdCb2FyZC5hZGRFdmVudExpc3RlbmVyKCdkcm9wJywgKGV2KSA9PiB7XG4gICAgZXYucHJldmVudERlZmF1bHQoKTtcblxuICAgIGlmIChldi50YXJnZXQuY2xhc3NOYW1lID09PSAnZHJhZy1zcXVhcmUnKSB7XG4gICAgICBldi50YXJnZXQuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gJyc7XG5cbiAgICAgIGNvbnN0IGNvb3JkcyA9IFsrZXYudGFyZ2V0LmRhdGFzZXQucG9zWzBdLCArZXYudGFyZ2V0LmRhdGFzZXQucG9zWzFdXTtcblxuICAgICAgY29uc3QgbGVuZ3RoID0gdGhpc0RyYWdFbGVtZW50LmRhdGFzZXQubGVuZ3RoO1xuICAgICAgY29uc3QgdHlwZSA9IHRoaXNEcmFnRWxlbWVudC5kYXRhc2V0LnR5cGU7XG4gICAgICBjb25zdCBvcmllbnRhdGlvbiA9IHRoaXNEcmFnRWxlbWVudC5kYXRhc2V0Lm9yaWVudGF0aW9uO1xuXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGNvb3JkcywgdHlwZSwgb3JpZW50YXRpb24pO1xuXG4gICAgICB0cnkge1xuICAgICAgICBnYW1lYm9hcmQuaXNTaGlwTGVnYWwodHlwZSwgbGVuZ3RoLCBvcmllbnRhdGlvbiwgY29vcmRzKTtcbiAgICAgICAgLy8gY29uc29sZS5sb2coJ3RoaXMgd2FzIGEgbGVnYWwgcGxhY2VtZW50Jyk7XG5cbiAgICAgICAgdXBkYXRlR2FtZWJvYXJkKGdhbWVib2FyZCwgdHlwZSwgY29vcmRzLCBvcmllbnRhdGlvbik7XG5cbiAgICAgICAgdGhpc0RyYWdFbGVtZW50LnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQodGhpc0RyYWdFbGVtZW50KTtcbiAgICAgICAgZXYudGFyZ2V0LmFwcGVuZENoaWxkKHRoaXNEcmFnRWxlbWVudCk7XG5cbiAgICAgICAgdGhpc0RyYWdFbGVtZW50LmRhdGFzZXQucG9zID0gZXYudGFyZ2V0LmRhdGFzZXQucG9zO1xuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coZXJyb3IpO1xuICAgICAgICAvLyBjb25zb2xlLmxvZygndGhpcyB3YXMgbm90IGEgbGVnYWwgcGxhY2VtZW50Jyk7XG4gICAgICB9XG4gICAgfVxuICB9KTtcbn1cblxuZnVuY3Rpb24gbGlzdGVuRm9yVG91Y2hFdmVudHMoZ2FtZWJvYXJkKSB7XG4gIGNvbnN0IGRyYWdCb2FyZCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5kcmFnLWJvYXJkJyk7XG4gIGxldCB0aGlzRHJhZ0VsZW1lbnQ7XG5cbiAgbGV0IGluaXRpYWxQb3M7XG4gIGxldCBkcmFnZ2luZyA9IGZhbHNlO1xuXG4gIGRyYWdCb2FyZC5hZGRFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgKGV2KSA9PiB7XG4gICAgaWYgKGV2LnRhcmdldC5jbGFzc0xpc3QuY29udGFpbnMoJ2RyYWdnYWJsZS1zaGlwJykpIHtcbiAgICAgIHRoaXNEcmFnRWxlbWVudCA9IGV2LnRhcmdldDtcbiAgICB9XG4gICAgaW5pdGlhbFBvcyA9IFtldi50b3VjaGVzWzBdLmNsaWVudFgsIGV2LnRvdWNoZXNbMF0uY2xpZW50WV07XG4gIH0pO1xuXG4gIGRyYWdCb2FyZC5hZGRFdmVudExpc3RlbmVyKCd0b3VjaG1vdmUnLCAoZXYpID0+IHtcbiAgICBpZiAodGhpc0RyYWdFbGVtZW50KSB7XG4gICAgICB0aGlzRHJhZ0VsZW1lbnQuc3R5bGUub3BhY2l0eSA9ICcwLjUnO1xuICAgICAgdGhpc0RyYWdFbGVtZW50LnN0eWxlLnRyYW5zZm9ybSA9IGB0cmFuc2xhdGUoJHtcbiAgICAgICAgZXYudG91Y2hlc1swXS5jbGllbnRYIC0gaW5pdGlhbFBvc1swXVxuICAgICAgfXB4LCAke2V2LnRvdWNoZXNbMF0uY2xpZW50WSAtIGluaXRpYWxQb3NbMV19cHgpICR7XG4gICAgICAgIHRoaXNEcmFnRWxlbWVudC5kYXRhc2V0Lm9yaWVudGF0aW9uID09PSAndmVydGljYWwnXG4gICAgICAgICAgPyAncm90YXRlKDkwZGVnKSdcbiAgICAgICAgICA6ICcnXG4gICAgICB9YDtcbiAgICAgIGRyYWdnaW5nID0gdHJ1ZTtcbiAgICB9XG4gIH0pO1xuXG4gIGRyYWdCb2FyZC5hZGRFdmVudExpc3RlbmVyKCd0b3VjaGVuZCcsIChldikgPT4ge1xuICAgIGlmIChkcmFnZ2luZyAmJiB0aGlzRHJhZ0VsZW1lbnQpIHtcbiAgICAgIGNvbnN0IHRvdWNoZWREaXZzID0gZG9jdW1lbnQuZWxlbWVudHNGcm9tUG9pbnQoXG4gICAgICAgIHRoaXNEcmFnRWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS54LFxuICAgICAgICB0aGlzRHJhZ0VsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkueVxuICAgICAgKTtcblxuICAgICAgdG91Y2hlZERpdnMuZm9yRWFjaCgoZGl2KSA9PiB7XG4gICAgICAgIGNvbnN0IGNvcm5lckRpdiA9IGRpdjtcblxuICAgICAgICBpZiAoY29ybmVyRGl2LmNsYXNzTGlzdC5jb250YWlucygnZHJhZy1zcXVhcmUnKSkge1xuICAgICAgICAgIGNvbnN0IGNvb3JkcyA9IFsrY29ybmVyRGl2LmRhdGFzZXQucG9zWzBdLCArY29ybmVyRGl2LmRhdGFzZXQucG9zWzFdXTtcblxuICAgICAgICAgIGNvbnN0IGxlbmd0aCA9IHRoaXNEcmFnRWxlbWVudC5kYXRhc2V0Lmxlbmd0aDtcbiAgICAgICAgICBjb25zdCB0eXBlID0gdGhpc0RyYWdFbGVtZW50LmRhdGFzZXQudHlwZTtcbiAgICAgICAgICBjb25zdCBvcmllbnRhdGlvbiA9IHRoaXNEcmFnRWxlbWVudC5kYXRhc2V0Lm9yaWVudGF0aW9uO1xuXG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhjb29yZHMsIHR5cGUsIG9yaWVudGF0aW9uKTtcblxuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBnYW1lYm9hcmQuaXNTaGlwTGVnYWwodHlwZSwgbGVuZ3RoLCBvcmllbnRhdGlvbiwgY29vcmRzKTtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCd0aGlzIHdhcyBhIGxlZ2FsIHBsYWNlbWVudCcpO1xuXG4gICAgICAgICAgICB1cGRhdGVHYW1lYm9hcmQoZ2FtZWJvYXJkLCB0eXBlLCBjb29yZHMsIG9yaWVudGF0aW9uKTtcblxuICAgICAgICAgICAgdGhpc0RyYWdFbGVtZW50LnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQodGhpc0RyYWdFbGVtZW50KTtcbiAgICAgICAgICAgIGNvcm5lckRpdi5hcHBlbmRDaGlsZCh0aGlzRHJhZ0VsZW1lbnQpO1xuXG4gICAgICAgICAgICB0aGlzRHJhZ0VsZW1lbnQuZGF0YXNldC5wb3MgPSBjb3JuZXJEaXYuZGF0YXNldC5wb3M7XG4gICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGVycm9yKTtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCd0aGlzIHdhcyBub3QgYSBsZWdhbCBwbGFjZW1lbnQnKTtcbiAgICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgdGhpc0RyYWdFbGVtZW50LnN0eWxlLnRyYW5zZm9ybSA9ICcnO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICB0aGlzRHJhZ0VsZW1lbnQuc3R5bGUub3BhY2l0eSA9ICcxJztcbiAgICAgIHRoaXNEcmFnRWxlbWVudC5zdHlsZS50cmFuc2Zvcm0gPSAnJztcbiAgICAgIHRoaXNEcmFnRWxlbWVudCA9IHVuZGVmaW5lZDtcbiAgICAgIGRyYWdnaW5nID0gZmFsc2U7XG4gICAgfVxuICB9KTtcbn1cblxuLyogUHV0IGRyYWdnYWJsZSBlbGVtZW50cyBhdCBlYWNoIHNoaXAgbG9jYXRpb24gKi9cbmZ1bmN0aW9uIHBsYWNlRHJhZ2dhYmxlU2hpcHMoZ2FtZWJvYXJkKSB7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgMTA7IGkrKykge1xuICAgIGZvciAobGV0IGogPSAwOyBqIDwgMTA7IGorKykge1xuICAgICAgY29uc3QgdmFsdWUgPSBnYW1lYm9hcmQuYm9hcmRBcnJheVtpXVtqXTtcbiAgICAgIGNvbnN0IGJvYXJkU3F1YXJlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcbiAgICAgICAgYC5kcmFnLXNxdWFyZVtkYXRhLXBvcz1cIiR7aX0ke2p9XCJdYFxuICAgICAgKTtcblxuICAgICAgaWYgKCF2YWx1ZSkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH0gZWxzZSBpZiAodmFsdWVbMV0gPT09ICcxJykge1xuICAgICAgICBjb25zdCBbc2hpcF0gPSBnYW1lYm9hcmQuZmxlZXQuZmlsdGVyKCh4KSA9PiB4LnR5cGVbMF0gPT0gdmFsdWVbMF0pO1xuXG4gICAgICAgIGNvbnN0IGRyYWdnYWJsZSA9IHJlbmRlckRyYWdnYWJsZVNoaXAoc2hpcCk7XG5cbiAgICAgICAgYm9hcmRTcXVhcmUuYXBwZW5kQ2hpbGQoZHJhZ2dhYmxlKTtcblxuICAgICAgICAvLyBDbGljayB0byBjaGFuZ2Ugb3JpZW50YXRpb24gZXZlbnQgbGlzdGVuZXJcbiAgICAgICAgZHJhZ2dhYmxlLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKGV2KSA9PiB7XG4gICAgICAgICAgZXYuc3RvcFByb3BhZ2F0aW9uKCk7XG5cbiAgICAgICAgICBsZXQgbmV3T3JpZW50YXRpb247XG5cbiAgICAgICAgICBpZiAoZXYudGFyZ2V0LmRhdGFzZXQub3JpZW50YXRpb24gPT09ICd2ZXJ0aWNhbCcpIHtcbiAgICAgICAgICAgIG5ld09yaWVudGF0aW9uID0gJ2hvcml6b250YWwnO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBuZXdPcmllbnRhdGlvbiA9ICd2ZXJ0aWNhbCc7XG4gICAgICAgICAgfVxuICAgICAgICAgIGNvbnN0IGNvb3JkcyA9IFtcbiAgICAgICAgICAgICtkcmFnZ2FibGUucGFyZW50Tm9kZS5kYXRhc2V0LnBvc1swXSxcbiAgICAgICAgICAgICtkcmFnZ2FibGUucGFyZW50Tm9kZS5kYXRhc2V0LnBvc1sxXSxcbiAgICAgICAgICBdO1xuICAgICAgICAgIGNvbnN0IHR5cGUgPSBkcmFnZ2FibGUuZGF0YXNldC50eXBlO1xuICAgICAgICAgIGNvbnN0IGxlbmd0aCA9IGRyYWdnYWJsZS5kYXRhc2V0Lmxlbmd0aDtcblxuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coY29vcmRzLCB0eXBlLCBuZXdPcmllbnRhdGlvbik7XG5cbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgZ2FtZWJvYXJkLmlzU2hpcExlZ2FsKHR5cGUsIGxlbmd0aCwgbmV3T3JpZW50YXRpb24sIGNvb3Jkcyk7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZygndGhpcyB3YXMgYSBsZWdhbCBwbGFjZW1lbnQnKTtcblxuICAgICAgICAgICAgdXBkYXRlR2FtZWJvYXJkKGdhbWVib2FyZCwgdHlwZSwgY29vcmRzLCBuZXdPcmllbnRhdGlvbik7XG5cbiAgICAgICAgICAgIGRyYWdnYWJsZS5jbGFzc0xpc3QudG9nZ2xlKCdyb3RhdGVkJyk7XG4gICAgICAgICAgICBkcmFnZ2FibGUuZGF0YXNldC5vcmllbnRhdGlvbiA9IG5ld09yaWVudGF0aW9uO1xuICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhlcnJvcik7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZygndGhpcyB3YXMgbm90IGEgbGVnYWwgcGxhY2VtZW50Jyk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gcmVuZGVyRHJhZ2dhYmxlU2hpcChzaGlwKSB7XG4gIGNvbnN0IHNoaXBSZW5kZXIgPSBjcmVhdGVOZXdFbGVtZW50KFxuICAgICdkaXYnLFxuICAgIFsnZHJhZ2dhYmxlLXNoaXAnLCAnc2hpcC1yZW5kZXInLCBgJHtzaGlwLnR5cGVbMF19YF0sXG4gICAgbnVsbCxcbiAgICB7XG4gICAgICBkcmFnZ2FibGU6ICd0cnVlJyxcbiAgICAgICdkYXRhLW9yaWVudGF0aW9uJzogc2hpcC5vcmllbnRhdGlvbixcbiAgICAgICdkYXRhLWxlbmd0aCc6IGAke3NoaXAubGVuZ3RofWAsXG4gICAgICAnZGF0YS10eXBlJzogc2hpcC50eXBlLFxuICAgIH1cbiAgKTtcblxuICBpZiAoc2hpcC5vcmllbnRhdGlvbiA9PT0gJ3ZlcnRpY2FsJykge1xuICAgIHNoaXBSZW5kZXIuY2xhc3NMaXN0LmFkZCgncm90YXRlZCcpO1xuICB9XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBzaGlwLmxlbmd0aDsgaSsrKSB7XG4gICAgc2hpcFJlbmRlci5hcHBlbmRDaGlsZChjcmVhdGVOZXdFbGVtZW50KCdkaXYnLCBbJ3NoaXAtcGFydCddKSk7XG4gIH1cblxuICByZXR1cm4gc2hpcFJlbmRlcjtcbn1cblxuZnVuY3Rpb24gY2xlYXJEcmFnZ2FibGVTaGlwcygpIHtcbiAgY29uc3Qgc2hpcHMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcuZHJhZ2dhYmxlLXNoaXAnKTtcbiAgc2hpcHMuZm9yRWFjaCgoc2hpcCkgPT4ge1xuICAgIHNoaXAucGFyZW50RWxlbWVudC5yZW1vdmVDaGlsZChzaGlwKTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZUdhbWVib2FyZChnYW1lYm9hcmQsIHR5cGUsIGNvb3Jkcywgb3JpZW50YXRpb24pIHtcbiAgZ2FtZWJvYXJkLmNsZWFyU2hpcEZyb21Cb2FyZCh0eXBlKTtcbiAgZ2FtZWJvYXJkLmNsZWFyU2hpcEZyb21GbGVldCh0eXBlKTtcbiAgZ2FtZWJvYXJkLnBsYWNlU2hpcCh0eXBlLCBjb29yZHMsIG9yaWVudGF0aW9uKTtcbn1cbiIsImV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGNyZWF0ZVBsYXllcigpIHtcbiAgbGV0IGVuZW15Qm9hcmQ7XG5cbiAgbGV0IHByZXZpb3VzTW92ZXMgPSBbXTtcbiAgbGV0IHNoaXBIaXN0b3J5ID0gJyc7IC8vIGZvciBBSSBjb25kaXRpb25hbHNcblxuICBjb25zdCBhaU1vZGUgPSB7XG4gICAgY29sdW1uQXhpczogdHJ1ZSxcbiAgICBwb3NEaXJlY3Rpb246IHRydWUsXG4gIH07XG5cbiAgZnVuY3Rpb24gYXNzaWduRW5lbXlHYW1lYm9hcmQoZ2FtZWJvYXJkKSB7XG4gICAgZW5lbXlCb2FyZCA9IGdhbWVib2FyZDtcbiAgfVxuXG4gIGZ1bmN0aW9uIG1ha2VBdHRhY2soW3JvdywgY29sXSkge1xuICAgIHJldHVybiBlbmVteUJvYXJkLnJlY2VpdmVBdHRhY2soW3JvdywgY29sXSk7XG4gIH1cblxuICBmdW5jdGlvbiBhaVBsYXkoKSB7XG4gICAgbGV0IHRoaXNNb3ZlID0gcmFuZG9tTW92ZSgpO1xuXG4gICAgd2hpbGUgKHBsYXllZFByZXZpb3VzbHkodGhpc01vdmUpKSB7XG4gICAgICB0aGlzTW92ZSA9IHJhbmRvbU1vdmUoKTtcbiAgICB9XG5cbiAgICBwcmV2aW91c01vdmVzLnB1c2goeyBtb3ZlOiB0aGlzTW92ZSB9KTtcblxuICAgIHJldHVybiB0aGlzTW92ZTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGFpU21hcnRQbGF5KCkge1xuICAgIGxldCB0aGlzTW92ZTtcblxuICAgIC8vIEZpcnN0IG1vdmVcbiAgICBpZiAoIXByZXZpb3VzTW92ZXNbMF0pIHtcbiAgICAgIHRoaXNNb3ZlID0gcmFuZG9tTW92ZSgpO1xuICAgICAgLy8gQWxsIHN1YnNlcXVlbnRcbiAgICB9IGVsc2Uge1xuICAgICAgZXZhbHVhdGVMYXN0TW92ZSgpO1xuXG4gICAgICB0aGlzTW92ZSA9IHNtYXJ0TW92ZSgpO1xuXG4gICAgICB3aGlsZSAocGxheWVkUHJldmlvdXNseSh0aGlzTW92ZSkpIHtcbiAgICAgICAgaWYgKHNoaXBIaXN0b3J5KSB7XG4gICAgICAgICAgY29uc3QgcHJldmlvdXNSZXN1bHQgPSBxdWVyeVByZXZpb3VzUmVzdWx0KHRoaXNNb3ZlKTtcbiAgICAgICAgICAvLyBXaXRoaW4gdGhlIGRldGVybWluaXN0aWMgYXR0YWNrIHNlcXVlbmNlLCBhbnkgcHJldmlvdXNseSBwbGF5ZWQgbW92ZSBpcyByZWNvcmRlZCBhZ2FpbiBhcyBpZiBpdCBpcyBiZWluZyBwbGF5ZWQgbm93IHNvIHRoZSBzZXF1ZW5jZSBjYW4gY29udGludWVcbiAgICAgICAgICBwcmV2aW91c01vdmVzLnB1c2goeyBtb3ZlOiB0aGlzTW92ZSwgcmVzdWx0OiBwcmV2aW91c1Jlc3VsdCB9KTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzTW92ZSA9IHNtYXJ0TW92ZSgpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHByZXZpb3VzTW92ZXMucHVzaCh7IG1vdmU6IHRoaXNNb3ZlIH0pO1xuXG4gICAgcmV0dXJuIHRoaXNNb3ZlO1xuICB9XG5cbiAgZnVuY3Rpb24gcmFuZG9tTW92ZSgpIHtcbiAgICBjb25zdCBtb3ZlID0gW1xuICAgICAgTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogMTApLFxuICAgICAgTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogMTApLFxuICAgIF07XG4gICAgcmV0dXJuIG1vdmU7XG4gIH1cblxuICBmdW5jdGlvbiBwbGF5ZWRQcmV2aW91c2x5KHRoaXNNb3ZlKSB7XG4gICAgY29uc3QgY2hlY2tNb3ZlcyA9IHByZXZpb3VzTW92ZXMuZmlsdGVyKFxuICAgICAgKHR1cm4pID0+IHR1cm4ubW92ZVswXSA9PT0gdGhpc01vdmVbMF0gJiYgdHVybi5tb3ZlWzFdID09PSB0aGlzTW92ZVsxXVxuICAgICk7XG5cbiAgICBpZiAoY2hlY2tNb3Zlc1swXSkgcmV0dXJuIHRydWU7XG5cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBmdW5jdGlvbiBxdWVyeVByZXZpb3VzUmVzdWx0KHRoaXNNb3ZlKSB7XG4gICAgY29uc3QgY2hlY2tNb3ZlcyA9IHByZXZpb3VzTW92ZXMuZmlsdGVyKFxuICAgICAgKHR1cm4pID0+IHR1cm4ubW92ZVswXSA9PT0gdGhpc01vdmVbMF0gJiYgdHVybi5tb3ZlWzFdID09PSB0aGlzTW92ZVsxXVxuICAgICk7XG5cbiAgICByZXR1cm4gY2hlY2tNb3Zlc1swXS5yZXN1bHQ7XG4gIH1cblxuICBmdW5jdGlvbiBldmFsdWF0ZUxhc3RNb3ZlKCkge1xuICAgIGNvbnN0IGxhc3RNb3ZlID0gcHJldmlvdXNNb3Zlc1twcmV2aW91c01vdmVzLmxlbmd0aCAtIDFdLm1vdmU7XG5cbiAgICAvLyBSZXN1bHQgaXMgcmVhZCBvZmYgb2YgdGhlIGVuZW15IGdhbWVib2FyZFxuICAgIGNvbnN0IGZvdW5kUmVzdWx0ID0gZW5lbXlCb2FyZC5ib2FyZEFycmF5W2xhc3RNb3ZlWzBdXVtsYXN0TW92ZVsxXV07XG5cbiAgICAvLyBBbmQgc3RvcmVkIGluIHRoZSBwcmV2aW91c01vdmUgYXJyYXlcbiAgICBwcmV2aW91c01vdmVzW3ByZXZpb3VzTW92ZXMubGVuZ3RoIC0gMV0ucmVzdWx0ID0gZm91bmRSZXN1bHQ7XG4gIH1cblxuICBmdW5jdGlvbiBzbWFydE1vdmUoKSB7XG4gICAgbGV0IG5leHRNb3ZlO1xuICAgIGxldCBsYXN0TW92ZSA9IHByZXZpb3VzTW92ZXNbcHJldmlvdXNNb3Zlcy5sZW5ndGggLSAxXTtcblxuICAgIC8vIFJlc2V0IGFmdGVyIGEgc2hpcCBpcyBzdW5rXG4gICAgaWYgKGxhc3RNb3ZlLnJlc3VsdCA9PT0gJ3N1bmsnKSB7XG4gICAgICBzaGlwSGlzdG9yeSA9ICcnO1xuXG4gICAgICBhaU1vZGUuY29sdW1uQXhpcyA9IHRydWU7XG4gICAgICBhaU1vZGUucG9zRGlyZWN0aW9uID0gdHJ1ZTtcblxuICAgICAgcmV0dXJuIHJhbmRvbU1vdmUoKTtcbiAgICB9XG5cbiAgICAvLyBBdHRhY2sgc2VxdWVuY2UgaGlzdG9yeSBiZWdpbnMgd2l0aCB0aGUgZmlyc3QgaGl0IG9uIGEgbmV3IHNoaXBcbiAgICBpZiAoc2hpcEhpc3RvcnlbMF0gPT09ICdoJyB8fCBsYXN0TW92ZS5yZXN1bHQgPT09ICdoaXQnKSB7XG4gICAgICBzaGlwSGlzdG9yeSA9IHNoaXBIaXN0b3J5ICsgbGFzdE1vdmUucmVzdWx0WzBdO1xuICAgIH1cblxuICAgIC8vIElmIG5vIGhpc3RvcnksIGEgc2hpcCBoYXMgbm90IGJlZW4gZGlzY292ZXJlZCB5ZXRcbiAgICBpZiAoIXNoaXBIaXN0b3J5KSByZXR1cm4gcmFuZG9tTW92ZSgpO1xuXG5cbiAgICBsZXQgW3NlY29uZExhc3QsIHRoaXJkTGFzdCwgZm91cnRoTGFzdCwgZmlmdGhMYXN0XSA9XG4gICAgICBkZWZpbmVQcmV2aW91c01vdmVWYXJpYWJsZXMoKTtcblxuICAgIC8qIENvbmRpdGlvbmFsIGxvZ2ljIGZvciBEZXRlcm1pbmlzdGljIEFJICovXG4gICAgLy8gU2Vjb25kIHBhcmFtZXRlciBpbiB0aGUgZm9sbG93aW5nIGZ1bmN0aW9ucyBpcyB0aGUgcHJldmlvdXMgbW92ZSBpbiByZWZlcmVuY2UgdG8gd2hpY2ggdGhlIG5leHQgbW92ZSBzaG91bGQgYmUgbWFkZVxuXG4gICAgaWYgKGxhc3RNb3ZlLnJlc3VsdCA9PT0gJ2hpdCcpIHtcbiAgICAgIG5leHRNb3ZlID0gY29udGludWVTYW1lUGF0aChsYXN0TW92ZSk7XG5cbiAgICAgIC8vIElmIGhpdHRpbmcgYSBib3VuZGFyeSwgY2FsY3VsYXRlIGNvcnJlY3QgbW92ZSB0byBiYWNrdHJhY2sgZnJvbVxuICAgICAgaWYgKG91dE9mQm91bmRzKG5leHRNb3ZlKSkge1xuICAgICAgICBsZXQgcmVmZXJlbmNlTW92ZTtcbiAgICAgICAgc3dpdGNoIChzaGlwSGlzdG9yeSkge1xuICAgICAgICAgIGNhc2UgJ2htaGgnOlxuICAgICAgICAgICAgcmVmZXJlbmNlTW92ZSA9IGZvdXJ0aExhc3QubW92ZTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgJ2htaCc6XG4gICAgICAgICAgICByZWZlcmVuY2VNb3ZlID0gdGhpcmRMYXN0Lm1vdmU7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgcmVmZXJlbmNlTW92ZSA9IGxhc3RNb3ZlLm1vdmU7XG4gICAgICAgIH1cbiAgICAgICAgc3dpdGNoRGlyZWN0aW9uQXRFZGdlcyhuZXh0TW92ZSk7XG4gICAgICAgIG5leHRNb3ZlID0gbW92ZUFjY29yZGluZ1RvTW9kZShyZWZlcmVuY2VNb3ZlKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIG5leHRNb3ZlO1xuICAgIH1cblxuICAgIGlmIChmaWZ0aExhc3QgJiYgZmlmdGhMYXN0LnJlc3VsdCA9PT0gJ2hpdCcpIHtcbiAgICAgIHJldHVybiBrZWVwQXhpc1N3aXRjaERpcmVjdGlvbihuZXh0TW92ZSwgZmlmdGhMYXN0KTtcbiAgICB9XG4gICAgaWYgKGZvdXJ0aExhc3QgJiYgZm91cnRoTGFzdC5yZXN1bHQgPT09ICdoaXQnKSB7XG4gICAgICByZXR1cm4ga2VlcEF4aXNTd2l0Y2hEaXJlY3Rpb24obmV4dE1vdmUsIGZvdXJ0aExhc3QpO1xuICAgIH1cbiAgICBpZiAodGhpcmRMYXN0ICYmIHNoaXBIaXN0b3J5ID09PSAnaG1tJykge1xuICAgICAgcmV0dXJuIHN3aXRjaEF4aXNPckRpcmVjdGlvbihuZXh0TW92ZSwgdGhpcmRMYXN0KTtcbiAgICB9XG4gICAgaWYgKHNlY29uZExhc3QgJiYgc2Vjb25kTGFzdC5yZXN1bHQgPT09ICdoaXQnKSB7XG4gICAgICByZXR1cm4gc3dpdGNoQXhpc09yRGlyZWN0aW9uKG5leHRNb3ZlLCBzZWNvbmRMYXN0KTtcbiAgICB9XG5cbiAgICAvLyBBIGZhaWxzYWZlIHJlc2V0IGZvciBlbmNvdW50ZXJpbmcgYSBjb25kaXRpb24gbm90IGxpc3RlZCBhYm92ZSAoc2hvdWxkIG5vdCBiZSBjYWxsZWQpXG4gICAgY29uc29sZS5sb2coJ05vbmUgb2YgdGhlIGFib3ZlIGNvbmRpdGlvbnMgYXBwbHknKTtcbiAgICBzaGlwSGlzdG9yeSA9ICcnO1xuICAgIGFpTW9kZS5jb2x1bW5BeGlzID0gdHJ1ZTtcbiAgICBhaU1vZGUucG9zRGlyZWN0aW9uID0gdHJ1ZTtcblxuICAgIHJldHVybiByYW5kb21Nb3ZlKCk7XG4gIH1cblxuICAvKiBzbWFydE1vdmUgSGVscGVyIEZ1bmN0aW9ucyAqL1xuICBmdW5jdGlvbiBkZWZpbmVQcmV2aW91c01vdmVWYXJpYWJsZXMoKSB7XG4gICAgbGV0IHNlY29uZExhc3Q7XG4gICAgbGV0IHRoaXJkTGFzdDtcbiAgICBsZXQgZm91cnRoTGFzdDtcbiAgICBsZXQgZmlmdGhMYXN0O1xuXG4gICAgaWYgKHNoaXBIaXN0b3J5Lmxlbmd0aCA+PSA1KSB7XG4gICAgICBmaWZ0aExhc3QgPSBwcmV2aW91c01vdmVzW3ByZXZpb3VzTW92ZXMubGVuZ3RoIC0gNV07XG4gICAgfVxuICAgIGlmIChzaGlwSGlzdG9yeS5sZW5ndGggPj0gNCkge1xuICAgICAgZm91cnRoTGFzdCA9IHByZXZpb3VzTW92ZXNbcHJldmlvdXNNb3Zlcy5sZW5ndGggLSA0XTtcbiAgICB9XG4gICAgaWYgKHNoaXBIaXN0b3J5Lmxlbmd0aCA+PSAzKSB7XG4gICAgICB0aGlyZExhc3QgPSBwcmV2aW91c01vdmVzW3ByZXZpb3VzTW92ZXMubGVuZ3RoIC0gM107XG4gICAgfVxuICAgIGlmIChzaGlwSGlzdG9yeS5sZW5ndGggPj0gMikge1xuICAgICAgc2Vjb25kTGFzdCA9IHByZXZpb3VzTW92ZXNbcHJldmlvdXNNb3Zlcy5sZW5ndGggLSAyXTtcbiAgICB9XG5cbiAgICByZXR1cm4gW3NlY29uZExhc3QsIHRoaXJkTGFzdCwgZm91cnRoTGFzdCwgZmlmdGhMYXN0XTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGNvbnRpbnVlU2FtZVBhdGgobGFzdE1vdmUpIHtcbiAgICByZXR1cm4gbW92ZUFjY29yZGluZ1RvTW9kZShsYXN0TW92ZS5tb3ZlKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGtlZXBBeGlzU3dpdGNoRGlyZWN0aW9uKG5leHRNb3ZlLCByZWZlcmVuY2VNb3ZlKSB7XG4gICAgYWlNb2RlLnBvc0RpcmVjdGlvbiA9ICFhaU1vZGUucG9zRGlyZWN0aW9uO1xuICAgIG5leHRNb3ZlID0gbW92ZUFjY29yZGluZ1RvTW9kZShyZWZlcmVuY2VNb3ZlLm1vdmUpO1xuXG4gICAgaWYgKG91dE9mQm91bmRzKG5leHRNb3ZlKSkge1xuICAgICAgc3dpdGNoRGlyZWN0aW9uQXRFZGdlcyhuZXh0TW92ZSk7XG4gICAgICBuZXh0TW92ZSA9IG1vdmVBY2NvcmRpbmdUb01vZGUocmVmZXJlbmNlTW92ZS5tb3ZlKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbmV4dE1vdmU7XG4gIH1cblxuICBmdW5jdGlvbiBzd2l0Y2hBeGlzT3JEaXJlY3Rpb24obmV4dE1vdmUsIHJlZmVyZW5jZU1vdmUpIHtcbiAgICBpZiAoYWlNb2RlLmNvbHVtbkF4aXMgJiYgYWlNb2RlLnBvc0RpcmVjdGlvbikge1xuICAgICAgLy8gaW5pdGlhbCBzd2l0Y2ggdXBvbiBmaXJzdCBtaXNzIHNob3VsZCBiZSBvZiBkaXJlY3Rpb25cbiAgICAgIGFpTW9kZS5wb3NEaXJlY3Rpb24gPSAhYWlNb2RlLnBvc0RpcmVjdGlvbjtcbiAgICB9IGVsc2UgaWYgKGFpTW9kZS5jb2x1bW5BeGlzICYmICFhaU1vZGUucG9zRGlyZWN0aW9uKSB7XG4gICAgICAvLyBpZiBkaXJlY3Rpb24gaXMgYWxyZWFkeSBzd2l0Y2hlZCByb3cgYXhpcyBzaG91bGQgYmUgc3RhcnRlZFxuICAgICAgYWlNb2RlLmNvbHVtbkF4aXMgPSAhYWlNb2RlLmNvbHVtbkF4aXM7XG4gICAgICAvLyBJZiBzaGlwIHRoZW4gbWlzc2VkIHRvIHNpZGUsIHN3aXRjaCBkaXJlY3Rpb25cbiAgICB9IGVsc2UgaWYgKCFhaU1vZGUuY29sdW1uQXhpcyAmJiAhYWlNb2RlLnBvc0RpcmVjdGlvbikge1xuICAgICAgIWFpTW9kZS5wb3NEaXJlY3Rpb247XG4gICAgfVxuXG4gICAgbmV4dE1vdmUgPSBtb3ZlQWNjb3JkaW5nVG9Nb2RlKHJlZmVyZW5jZU1vdmUubW92ZSk7XG5cbiAgICBpZiAob3V0T2ZCb3VuZHMobmV4dE1vdmUpKSB7XG4gICAgICBzd2l0Y2hEaXJlY3Rpb25BdEVkZ2VzKG5leHRNb3ZlKTtcbiAgICAgIG5leHRNb3ZlID0gbW92ZUFjY29yZGluZ1RvTW9kZShyZWZlcmVuY2VNb3ZlLm1vdmUpO1xuICAgIH1cblxuICAgIHJldHVybiBuZXh0TW92ZTtcbiAgfVxuXG4gIGZ1bmN0aW9uIG1vdmVBY2NvcmRpbmdUb01vZGUoW3JvdywgY29sdW1uXSkge1xuICAgIGlmIChhaU1vZGUuY29sdW1uQXhpcyAmJiBhaU1vZGUucG9zRGlyZWN0aW9uKSB7XG4gICAgICByZXR1cm4gW3JvdyArIDEsIGNvbHVtbl07XG4gICAgfSBlbHNlIGlmIChhaU1vZGUuY29sdW1uQXhpcykge1xuICAgICAgcmV0dXJuIFtyb3cgLSAxLCBjb2x1bW5dO1xuICAgIH0gZWxzZSBpZiAoYWlNb2RlLnBvc0RpcmVjdGlvbikge1xuICAgICAgcmV0dXJuIFtyb3csIGNvbHVtbiArIDFdO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gW3JvdywgY29sdW1uIC0gMV07XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gb3V0T2ZCb3VuZHMoW3JvdywgY29sdW1uXSkge1xuICAgIGlmIChyb3cgPiA5IHx8IHJvdyA8IDAgfHwgY29sdW1uID4gOSB8fCBjb2x1bW4gPCAwKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBzd2l0Y2hEaXJlY3Rpb25BdEVkZ2VzKFtyb3csIGNvbHVtbl0pIHtcbiAgICBpZiAocm93ID4gOSAmJiBhaU1vZGUuY29sdW1uQXhpcyA9PT0gdHJ1ZSkge1xuICAgICAgYWlNb2RlLnBvc0RpcmVjdGlvbiA9IGZhbHNlO1xuICAgIH0gZWxzZSBpZiAocm93IDwgMCAmJiBjb2x1bW4gPT0gMCkge1xuICAgICAgLy8gT05MWSBoYXBwZW5zIHdpdGggaG9yaXpvbnRhbCBzaGlwIGluIHRvcCBsZWZ0IGNvcm5lclxuICAgICAgYWlNb2RlLmNvbHVtbkF4aXMgPSBmYWxzZTtcbiAgICAgIGFpTW9kZS5wb3NEaXJlY3Rpb24gPSB0cnVlO1xuICAgIH1lbHNlIGlmIChyb3cgPCAwKSB7XG4gICAgICAvLyBpZiBkaXJlY3Rpb24gaGFzIGFscmVhZHkgYmVlbiBzd2l0Y2hlZFxuICAgICAgYWlNb2RlLmNvbHVtbkF4aXMgPSBmYWxzZTtcbiAgICB9IGVsc2UgaWYgKGNvbHVtbiA8IDApIHtcbiAgICAgIGFpTW9kZS5wb3NEaXJlY3Rpb24gPSB0cnVlO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiB7XG4gICAgbWFrZUF0dGFjayxcbiAgICBhc3NpZ25FbmVteUdhbWVib2FyZCxcbiAgICBhaVBsYXksXG4gICAgYWlTbWFydFBsYXksXG4gICAgLy8gRXZlcnl0aGluZyBiZWxvdyBpcyBpbnRlcm5hbCBhbmQgd2FzIHVzZWQgb25seSBmb3IgdGVzdGluZ1xuICAgIGdldCBlbmVteUJvYXJkKCkge1xuICAgICAgcmV0dXJuIGVuZW15Qm9hcmQ7XG4gICAgfSxcbiAgICBnZXQgcHJldmlvdXNNb3ZlcygpIHtcbiAgICAgIHJldHVybiBbLi4ucHJldmlvdXNNb3Zlc107XG4gICAgfSxcbiAgICAvLyBPbmx5IGZvciB0ZXN0aW5nIHdvdWxkIHRoZXNlIGV2ZXIgYmUgc2V0XG4gICAgc2V0IHByZXZpb3VzTW92ZXMoaGlzdG9yeUFycmF5KSB7XG4gICAgICBwcmV2aW91c01vdmVzID0gaGlzdG9yeUFycmF5O1xuICAgIH0sXG4gICAgYWlNb2RlLFxuICAgIHNldCBzaGlwSGlzdG9yeShzdHJpbmcpIHtcbiAgICAgIHNoaXBIaXN0b3J5ID0gc3RyaW5nO1xuICAgIH0sXG4gIH07XG59XG4iLCJleHBvcnQgZnVuY3Rpb24gY3JlYXRlU2hpcChsZW5ndGgpIHtcbiAgICBjb25zdCBzaGlwQXJyYXkgPSBBcnJheShsZW5ndGgpLmZpbGwoMCk7XG5cbiAgICBmdW5jdGlvbiBoaXQocG9zaXRpb24pIHtcbiAgICAgICAgLyogMCAtIG5vdCBoaXQ7IDEgLSBoaXQgKi9cbiAgICAgICAgc2hpcEFycmF5W3Bvc2l0aW9uIC0gMV0gPSAxO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBpc1N1bmsoKSB7XG4gICAgICAgIGNvbnN0IGhpdHMgPSBzaGlwQXJyYXkuZmlsdGVyKHBvc2l0aW9uID0+XG4gICAgICAgICAgICBwb3NpdGlvbiA9PSAxKTtcbiAgICAgICAgcmV0dXJuIGhpdHMubGVuZ3RoID09IGxlbmd0aFxuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICAgIGhpdCxcbiAgICAgICAgZ2V0IHNoaXBBcnJheSgpe1xuICAgICAgICAgICAgcmV0dXJuIFsuLi5zaGlwQXJyYXldXG4gICAgICAgIH0sXG4gICAgICAgIGdldCBsZW5ndGgoKSB7XG4gICAgICAgICAgICByZXR1cm4gbGVuZ3RoXG4gICAgICAgIH0sXG4gICAgICAgIGlzU3Vua1xuICAgIH1cbn1cblxuIiwiaW1wb3J0IHsgY3JlYXRlU2hpcCB9IGZyb20gJy4vc2hpcHMnO1xuaW1wb3J0IHsgcHVibGlzaCB9IGZyb20gJy4vcHVic3ViJztcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gY3JlYXRlR2FtZWJvYXJkKCkge1xuICBsZXQgYm9hcmRBcnJheSA9IEFycmF5KDEwKVxuICAgIC5maWxsKG51bGwpXG4gICAgLm1hcCgoeCkgPT4gQXJyYXkoMTApLmZpbGwobnVsbCkpO1xuXG4gIGxldCBmbGVldCA9IFtdO1xuXG4gIC8qIEZyb20gV2lraXBlZGlhICovXG4gIGNvbnN0IHNoaXBMZW5ndGhzID0gWzUsIDQsIDMsIDMsIDJdO1xuICBjb25zdCBzaGlwVHlwZXMgPSBbXG4gICAgJ2NhcnJpZXInLFxuICAgICdiYXR0bGVzaGlwJyxcbiAgICAnZGVzdHJveWVyJyxcbiAgICAnc3VibWFyaW5lJyxcbiAgICAncGF0cm9sIGJvYXQnLFxuICBdO1xuXG4gIGZ1bmN0aW9uIHBsYWNlU2hpcCh0eXBlLCBbcm93LCBjb2x1bW5dLCBvcmllbnRhdGlvbikge1xuICAgIGNvbnN0IHNoaXBJbmRleCA9IHNoaXBUeXBlcy5pbmRleE9mKHR5cGUpO1xuICAgIGNvbnN0IHNoaXBMZW5ndGggPSBzaGlwTGVuZ3Roc1tzaGlwSW5kZXhdO1xuXG4gICAgLyogVGVzdCBsZWdhbGl0eSBvZiBhbGwgcG9zaXRpb25zIGJlZm9yZSBtYXJraW5nIGFueSAqL1xuICAgIGlzU2hpcExlZ2FsKHR5cGUsIHNoaXBMZW5ndGgsIG9yaWVudGF0aW9uLCBbcm93LCBjb2x1bW5dKTtcblxuICAgIC8qIE1hcmsgYm9hcmQgYXJyYXkgKi9cbiAgICBmb3IgKGxldCBpID0gMTsgaSA8PSBzaGlwTGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IHNoaXBNYXJrZXIgPSB0eXBlWzBdICsgaTtcblxuICAgICAgaWYgKGkgPT09IDEpIHtcbiAgICAgICAgYm9hcmRBcnJheVtyb3ddW2NvbHVtbl0gPSBzaGlwTWFya2VyO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgaWYgKG9yaWVudGF0aW9uID09PSAnaG9yaXpvbnRhbCcpIHtcbiAgICAgICAgYm9hcmRBcnJheVtyb3ddW2NvbHVtbiArIChpIC0gMSldID0gc2hpcE1hcmtlcjtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGJvYXJkQXJyYXlbcm93ICsgKGkgLSAxKV1bY29sdW1uXSA9IHNoaXBNYXJrZXI7XG4gICAgICB9XG4gICAgfVxuXG4gICAgbGV0IGNyZWF0ZWRTaGlwID0gY3JlYXRlU2hpcChzaGlwTGVuZ3RoKTtcbiAgICBjcmVhdGVkU2hpcC50eXBlID0gdHlwZTtcbiAgICBjcmVhdGVkU2hpcC5vcmllbnRhdGlvbiA9IG9yaWVudGF0aW9uOyAvLyBmb3IgZHJhZyBhbmQgZHJvcFxuXG4gICAgZmxlZXQucHVzaChjcmVhdGVkU2hpcCk7XG4gIH1cblxuICBmdW5jdGlvbiBpc1NoaXBMZWdhbCh0eXBlLCBzaGlwTGVuZ3RoLCBvcmllbnRhdGlvbiwgW3JvdywgY29sdW1uXSkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc2hpcExlbmd0aDsgaSsrKSB7XG4gICAgICBsZXQgdGVzdFNxdWFyZTtcblxuICAgICAgaWYgKG9yaWVudGF0aW9uID09PSAnaG9yaXpvbnRhbCcpIHtcbiAgICAgICAgdGVzdFNxdWFyZSA9IFtyb3csIGNvbHVtbiArIGldO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGVzdFNxdWFyZSA9IFtyb3cgKyBpLCBjb2x1bW5dO1xuICAgICAgfVxuXG4gICAgICBpZiAodGVzdFNxdWFyZVswXSA+IDkgfHwgdGVzdFNxdWFyZVsxXSA+IDkpIHtcbiAgICAgICAgdGhyb3cgJ1NoaXAgb3V0c2lkZSBib3VuZHMgb2YgYm9hcmQnO1xuICAgICAgfVxuICAgICAgaWYgKGFkamFjZW50U2hpcCh0ZXN0U3F1YXJlLCB0eXBlKSkge1xuICAgICAgICB0aHJvdyAnU2hpcCBhZGphY2VudCB0byBhbm90aGVyIHNoaXAnO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHBsYWNlQWxsU2hpcHNSYW5kb21seSgpIHtcbiAgICBmb3IgKGNvbnN0IHNoaXAgb2Ygc2hpcFR5cGVzKSB7XG4gICAgICBhdHRlbXB0UGxhY2VtZW50KHNoaXApO1xuICAgIH1cbiAgfVxuXG4gIGNvbnN0IG9yaWVudGF0aW9ucyA9IFsnaG9yaXpvbnRhbCcsICd2ZXJ0aWNhbCddO1xuXG4gIGZ1bmN0aW9uIHJhbmRvbVBvc2l0aW9uKCkge1xuICAgIHJldHVybiBbTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogMTApLCBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAxMCldO1xuICB9XG5cbiAgZnVuY3Rpb24gYXR0ZW1wdFBsYWNlbWVudChzaGlwKSB7XG4gICAgbGV0IHBvc2l0aW9uID0gcmFuZG9tUG9zaXRpb24oKTtcbiAgICBsZXQgb3JpZW50YXRpb24gPSBvcmllbnRhdGlvbnNbTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogMildO1xuICAgIHRyeSB7XG4gICAgICBwbGFjZVNoaXAoc2hpcCwgcG9zaXRpb24sIG9yaWVudGF0aW9uKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgYXR0ZW1wdFBsYWNlbWVudChzaGlwKTtcbiAgICB9XG4gIH1cblxuICAvKiBIZWxwZXIgZnVuY3Rpb25zIGZvciB0ZXN0aW5nIHNoaXAgbGVnYWxpdHkgKi9cbiAgZnVuY3Rpb24gYWRqYWNlbnRTaGlwKFtyb3csIGNvbF0sIHNoaXBNYXJrZXIpIHtcbiAgICBjb25zdCBib3VuZGluZ1NxdWFyZXMgPSBkZWZpbmVCb3VuZGluZ0JveChbcm93LCBjb2xdKTtcbiAgICBmb3IgKGNvbnN0IFtzcVJvdywgc3FDb2xdIG9mIGJvdW5kaW5nU3F1YXJlcykge1xuICAgICAgbGV0IHRlc3QgPSBib2FyZEFycmF5W3NxUm93XVtzcUNvbF07XG4gICAgICBpZiAodGVzdCAmJiB0ZXN0WzBdICE9PSBzaGlwTWFya2VyWzBdKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBmdW5jdGlvbiBkZWZpbmVCb3VuZGluZ0JveChbcm93LCBjb2xdKSB7XG4gICAgY29uc3Qgc3F1YXJlcyA9IFtdO1xuICAgIC8vIENsb2Nrd2lzZSBjaXJjbGUgZnJvbSB0b3AgbGVmdFxuICAgIHNxdWFyZXMucHVzaChcbiAgICAgIFtyb3cgLSAxLCBjb2wgLSAxXSxcbiAgICAgIFtyb3cgLSAxLCBjb2xdLFxuICAgICAgW3JvdyAtIDEsIGNvbCArIDFdLFxuICAgICAgW3JvdywgY29sICsgMV0sXG4gICAgICBbcm93ICsgMSwgY29sICsgMV0sXG4gICAgICBbcm93ICsgMSwgY29sXSxcbiAgICAgIFtyb3cgKyAxLCBjb2wgLSAxXSxcbiAgICAgIFtyb3csIGNvbCAtIDFdXG4gICAgKTtcblxuICAgIGNvbnN0IHdpdGhpbkJvYXJkID0gc3F1YXJlcy5maWx0ZXIoKFtzcVJvdywgc3FDb2xdKSA9PiB7XG4gICAgICByZXR1cm4gc3FSb3cgPiAtMSAmJiBzcVJvdyA8IDEwICYmIHNxQ29sID4gLTEgJiYgc3FDb2wgPCAxMDtcbiAgICB9KTtcblxuICAgIHJldHVybiB3aXRoaW5Cb2FyZDtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlY2VpdmVBdHRhY2soW3JvdywgY29sdW1uXSkge1xuICAgIGNvbnN0IHZhbHVlQXRQb3NpdGlvbiA9IGJvYXJkQXJyYXlbcm93XVtjb2x1bW5dO1xuXG4gICAgaWYgKCF2YWx1ZUF0UG9zaXRpb24pIHtcbiAgICAgIGJvYXJkQXJyYXlbcm93XVtjb2x1bW5dID0gJ21pc3MnO1xuICAgICAgcHVibGlzaCgnbWlzcycsIFtyb3csIGNvbHVtbl0pO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBoaXRTaGlwID0gZmxlZXQuZmlsdGVyKFxuICAgICAgKHNoaXApID0+IHNoaXAudHlwZVswXSA9PT0gdmFsdWVBdFBvc2l0aW9uWzBdXG4gICAgKVswXTtcbiAgICBoaXRTaGlwLmhpdCh2YWx1ZUF0UG9zaXRpb25bMV0pO1xuICAgIGJvYXJkQXJyYXlbcm93XVtjb2x1bW5dID0gJ2hpdCc7XG4gICAgcHVibGlzaCgnaGl0JywgW3JvdywgY29sdW1uXSk7XG5cbiAgICBpZiAoaGl0U2hpcC5pc1N1bmsoKSkge1xuICAgICAgcHVibGlzaCgnc2hpcFN1bmsnLCBbaGl0U2hpcCwgW3JvdywgY29sdW1uXV0pO1xuICAgICAgYm9hcmRBcnJheVtyb3ddW2NvbHVtbl0gPSAnc3Vuayc7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gaXNGbGVldFN1bmsoKSB7XG4gICAgY29uc3Qgc3Vua1NoaXBzID0gZmxlZXQuZmlsdGVyKChzaGlwKSA9PiBzaGlwLmlzU3VuaygpID09PSB0cnVlKTtcbiAgICByZXR1cm4gc3Vua1NoaXBzLmxlbmd0aCA9PT0gZmxlZXQubGVuZ3RoO1xuICB9XG5cbiAgZnVuY3Rpb24gY2xlYXJTaGlwRnJvbUJvYXJkKHR5cGUpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IDEwOyBpKyspIHtcbiAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgMTA7IGorKykge1xuICAgICAgICBpZiAoYm9hcmRBcnJheVtpXVtqXSAmJiBib2FyZEFycmF5W2ldW2pdWzBdID09PSB0eXBlWzBdKSB7XG4gICAgICAgICAgYm9hcmRBcnJheVtpXVtqXSA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBjbGVhclNoaXBGcm9tRmxlZXQodHlwZSkge1xuICAgIGZsZWV0ID0gZmxlZXQuZmlsdGVyKCh4KSA9PiB4LnR5cGUgIT09IHR5cGUpO1xuICB9XG5cbiAgZnVuY3Rpb24gY2xlYXJCb2FyZCgpIHtcbiAgICBmbGVldCA9IFtdO1xuICAgIGJvYXJkQXJyYXkgPSBBcnJheSgxMClcbiAgICAgIC5maWxsKG51bGwpXG4gICAgICAubWFwKCh4KSA9PiBBcnJheSgxMCkuZmlsbChudWxsKSk7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIGdldCBib2FyZEFycmF5KCkge1xuICAgICAgLyogMkQgYXJyYXkgc28gZWFjaCBlbGVtZW50IG5lZWRzIGRlc3RydWN0dXJpbmcgKi9cbiAgICAgIHJldHVybiBib2FyZEFycmF5Lm1hcCgoeCkgPT4gWy4uLnhdKTtcbiAgICB9LFxuICAgIHJlY2VpdmVBdHRhY2ssXG4gICAgcGxhY2VTaGlwLFxuICAgIHBsYWNlQWxsU2hpcHNSYW5kb21seSxcbiAgICBnZXQgZmxlZXQoKSB7XG4gICAgICByZXR1cm4gWy4uLmZsZWV0XTtcbiAgICB9LFxuICAgIGlzRmxlZXRTdW5rLFxuICAgIC8vIFRoZSBmb2xsb3dpbmcgaW1wbGVtZW50ZWQgZm9yIHVzZSBieSB0aGUgZHJhZyBhbmQgZHJvcCBzaGlwIHBsYWNlbWVudC4gQWxzbyBjaGFuZ2VkIGJvdGggYm9hcmQgYW5kIGZsZWV0IGFycmF5cyB0byBsZXQgaW5zdGVhZCBvZiBjb25zdCBmb3IgdGhpc1xuICAgIGlzU2hpcExlZ2FsLFxuICAgIGNsZWFyU2hpcEZyb21Cb2FyZCxcbiAgICBjbGVhclNoaXBGcm9tRmxlZXQsXG4gICAgY2xlYXJCb2FyZCxcbiAgfTtcbn1cbiIsImltcG9ydCB7XG4gIGNyZWF0ZUNvbnRhaW5lcnMsXG4gIG1ha2VBbm5vdW5jZW1lbnRzLFxuICBjbGlja0xpc3RlbmVyLFxuICByZW5kZXJCb2FyZCxcbiAgcmVuZGVyVHVyblNjcmVlbixcbiAgcmVuZGVyU3RhcnRTY3JlZW4sXG4gIGNsZWFyQm9hcmRzLFxuICBzd2FwU3Vua0ZsZWV0c1xufSBmcm9tICcuL2RvbSc7XG5pbXBvcnQgeyByZW5kZXJTaGlwU2NyZWVuIH0gZnJvbSAnLi9kcmFnRHJvcCc7XG5pbXBvcnQgY3JlYXRlUGxheWVyIGZyb20gJy4vcGxheWVyJztcbmltcG9ydCBjcmVhdGVHYW1lYm9hcmQgZnJvbSAnLi9nYW1lYm9hcmQnO1xuaW1wb3J0IHsgc3Vic2NyaWJlLCBwdWJsaXNoLCB1bnN1YnNjcmliZSB9IGZyb20gJy4vcHVic3ViJztcblxuZXhwb3J0IGZ1bmN0aW9uIG5ld0dhbWUoKSB7XG4gIGNyZWF0ZUNvbnRhaW5lcnMoKTtcblxuICBjb25zdCBwbGF5ZXIxID0gY3JlYXRlUGxheWVyKCk7XG4gIGNvbnN0IHBsYXllcjIgPSBjcmVhdGVQbGF5ZXIoKTtcblxuICBjb25zdCBib2FyZDEgPSBjcmVhdGVHYW1lYm9hcmQoKTtcbiAgY29uc3QgYm9hcmQyID0gY3JlYXRlR2FtZWJvYXJkKCk7XG5cbiAgcGxheWVyMS5hc3NpZ25FbmVteUdhbWVib2FyZChib2FyZDIpO1xuICBwbGF5ZXIyLmFzc2lnbkVuZW15R2FtZWJvYXJkKGJvYXJkMSk7XG5cbiAgYm9hcmQxLnBsYWNlQWxsU2hpcHNSYW5kb21seSgpO1xuICBib2FyZDIucGxhY2VBbGxTaGlwc1JhbmRvbWx5KCk7XG5cbiAgLy8gRXZlbnQgbGlzdGVuZXJzIHRvIHRyYWNrIGdhbWUgZXZlbnRzXG4gIG1ha2VBbm5vdW5jZW1lbnRzKCk7XG5cbiAgLy8gRXZlbnQgbGlzdGVuZXJzIHRvIHNlbGVjdCB0eXBlIG9mIGdhbWVcbiAgY29uc3QgW3NpbmdsZVBsYXllckJ1dHRvbiwgdHdvUGxheWVyQnV0dG9uXSA9IHJlbmRlclN0YXJ0U2NyZWVuKCk7XG5cbiAgc2luZ2xlUGxheWVyQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKGV2KSA9PiB7XG4gICAgZXYucHJldmVudERlZmF1bHQoKTtcbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuc3RhcnQtc2NyZWVuJykuc3R5bGUuZGlzcGxheSA9ICdub25lJztcblxuICAgIHBsYXllclZzQUlMb29wKHsgcGxheWVyMSwgcGxheWVyMiwgYm9hcmQxLCBib2FyZDIgfSk7XG4gIH0pO1xuXG4gIHR3b1BsYXllckJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIChldikgPT4ge1xuICAgIGV2LnByZXZlbnREZWZhdWx0KCk7XG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLnN0YXJ0LXNjcmVlbicpLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG5cbiAgICB0d29QbGF5ZXJHYW1lTG9vcCh7IHBsYXllcjEsIHBsYXllcjIsIGJvYXJkMSwgYm9hcmQyIH0pO1xuICB9KTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gcGxheWVyVnNBSUxvb3AoeyBwbGF5ZXIxLCBwbGF5ZXIyLCBib2FyZDEsIGJvYXJkMiB9KSB7XG4gIGF3YWl0IHJlbmRlclNoaXBTY3JlZW4oYm9hcmQxKTtcbiAgcmVuZGVyQm9hcmQoYm9hcmQxLmJvYXJkQXJyYXksICdvd24nKTtcbiAgcmVuZGVyQm9hcmQoYm9hcmQyLmJvYXJkQXJyYXksICdlbmVteScpO1xuXG4gIC8vIE1ha2UgYm9hcmQgY2xpY2thYmxlIHRvIGh1bWFuIHBsYXllclxuICBjbGlja0xpc3RlbmVyKHBsYXllcjEsICdlbmVteScpO1xuXG4gIHN1YnNjcmliZSgnc3F1YXJlQXR0YWNrZWQnLCBodW1hbkF0dGFjayk7XG5cbiAgZnVuY3Rpb24gaHVtYW5BdHRhY2soW3BsYXllciwgdGFyZ2V0XSkge1xuICAgIHB1Ymxpc2goJ3RhcmdldENoYW5nZScsICdlbmVteScpO1xuXG4gICAgcGxheWVyLm1ha2VBdHRhY2soW3RhcmdldFswXSwgdGFyZ2V0WzFdXSk7XG5cbiAgICByZW5kZXJCb2FyZChib2FyZDIuYm9hcmRBcnJheSwgJ2VuZW15Jyk7XG5cbiAgICBpZiAoYm9hcmQyLmlzRmxlZXRTdW5rKCkpIHtcbiAgICAgIHB1Ymxpc2goJ2ZsZWV0U3VuaycsIFsnQ29tcHV0ZXInLCAnSHVtYW4nXSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICBwdWJsaXNoKCd0YXJnZXRDaGFuZ2UnLCAnb3duJyk7XG5cbiAgICAgIHBsYXllcjIubWFrZUF0dGFjayhwbGF5ZXIyLmFpU21hcnRQbGF5KCkpO1xuICAgICAgcmVuZGVyQm9hcmQoYm9hcmQxLmJvYXJkQXJyYXksICdvd24nKTtcblxuICAgICAgaWYgKGJvYXJkMS5pc0ZsZWV0U3VuaygpKSB7XG4gICAgICAgIHB1Ymxpc2goJ2ZsZWV0U3VuaycsIFsnSHVtYW4nLCAnQ29tcHV0ZXInXSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9LCAxMDAwKTtcbiAgfVxufVxuXG5hc3luYyBmdW5jdGlvbiB0d29QbGF5ZXJHYW1lTG9vcCh7IHBsYXllcjEsIHBsYXllcjIsIGJvYXJkMSwgYm9hcmQyIH0pIHtcbiAgYXdhaXQgcmVuZGVyVHVyblNjcmVlbignUExBWUVSIDEnKTtcbiAgYXdhaXQgcmVuZGVyU2hpcFNjcmVlbihib2FyZDEpO1xuXG4gIGF3YWl0IHJlbmRlclR1cm5TY3JlZW4oJ1BMQVlFUiAyJyk7XG4gIGF3YWl0IHJlbmRlclNoaXBTY3JlZW4oYm9hcmQyKTtcblxuICBhd2FpdCBwbGF5ZXJUdXJuKGJvYXJkMSwgYm9hcmQyLCBwbGF5ZXIxLCBwbGF5ZXIyLCAnUGxheWVyIDEnLCAnUGxheWVyIDInKTtcblxuICAvLyBDU1Mgc2VsZWN0b3JzIG5lZWQgYWRqdXN0aW5nIGluIHRoaXMgbG9vcCBkdWUgdG8gdGhlXG4gIC8vIGJvYXJkcyBiZWluZyBjbGVhcmVkIGJldHdlZW4gZWFjaCB0dXJuXG4gIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ21haW4nKS5jbGFzc0xpc3QuYWRkKCd0d28tcGxheWVyJyk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHBsYXllclR1cm4oXG4gIG93bkJvYXJkLFxuICBlbmVteUJvYXJkLFxuICB0aGlzUGxheWVyLFxuICBuZXh0UGxheWVyLFxuICB0aGlzUGxheWVyU3RyLFxuICBuZXh0UGxheWVyU3RyXG4pIHtcbiAgbGV0IG51bUF0dGFja3MgPSAwO1xuXG4gIGNsZWFyQm9hcmRzKCk7XG4gIHN3YXBTdW5rRmxlZXRzKCk7XG5cbiAgLy8gQ29udHJvbHMgd2hlcmUgaGl0cy9taXNzZXMgYXJlIGFubm91bmNlZCBhbmQgc3VuayBzaGlwcyBzaG93blxuICBwdWJsaXNoKCd0YXJnZXRDaGFuZ2UnLCAnZW5lbXknKTtcblxuICByZW5kZXJCb2FyZChvd25Cb2FyZC5ib2FyZEFycmF5LCAnb3duJyk7XG4gIHJlbmRlckJvYXJkKGVuZW15Qm9hcmQuYm9hcmRBcnJheSwgJ2VuZW15Jyk7XG5cbiAgY2xpY2tMaXN0ZW5lcih0aGlzUGxheWVyLCAnZW5lbXknKTtcblxuICBzdWJzY3JpYmUoJ3NxdWFyZUF0dGFja2VkJywgcGxheWVyQXR0YWNrKTtcblxuICBmdW5jdGlvbiBwbGF5ZXJBdHRhY2soW3BsYXllciwgdGFyZ2V0XSkge1xuICAgIHBsYXllci5tYWtlQXR0YWNrKFt0YXJnZXRbMF0sIHRhcmdldFsxXV0pO1xuXG4gICAgcmVuZGVyQm9hcmQoZW5lbXlCb2FyZC5ib2FyZEFycmF5LCAnZW5lbXknKTtcblxuICAgIGlmIChlbmVteUJvYXJkLmlzRmxlZXRTdW5rKCkpIHtcbiAgICAgIHB1Ymxpc2goJ2ZsZWV0U3VuaycsIFsnQ29tcHV0ZXInLCAnSHVtYW4nXSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIG51bUF0dGFja3MrKztcblxuICAgIGlmIChudW1BdHRhY2tzID09PSAzKSB7XG4gICAgICBudW1BdHRhY2tzID0gMDtcbiAgICAgIHVuc3Vic2NyaWJlKCdzcXVhcmVBdHRhY2tlZCcsIHBsYXllckF0dGFjayk7XG5cbiAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICBjaGFuZ2VQbGF5ZXIoXG4gICAgICAgICAgb3duQm9hcmQsXG4gICAgICAgICAgZW5lbXlCb2FyZCxcbiAgICAgICAgICB0aGlzUGxheWVyLFxuICAgICAgICAgIG5leHRQbGF5ZXIsXG4gICAgICAgICAgdGhpc1BsYXllclN0cixcbiAgICAgICAgICBuZXh0UGxheWVyU3RyXG4gICAgICAgICk7XG4gICAgICB9LCAxMDAwKTtcbiAgICB9XG4gIH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gY2hhbmdlUGxheWVyKFxuICBvd25Cb2FyZCxcbiAgZW5lbXlCb2FyZCxcbiAgdGhpc1BsYXllcixcbiAgbmV4dFBsYXllcixcbiAgdGhpc1BsYXllclN0cixcbiAgbmV4dFBsYXllclN0clxuKSB7XG4gIGF3YWl0IHJlbmRlclR1cm5TY3JlZW4obmV4dFBsYXllclN0cik7XG5cbiAgcGxheWVyVHVybihcbiAgICBlbmVteUJvYXJkLFxuICAgIG93bkJvYXJkLFxuICAgIG5leHRQbGF5ZXIsXG4gICAgdGhpc1BsYXllcixcbiAgICBuZXh0UGxheWVyU3RyLFxuICAgIHRoaXNQbGF5ZXJTdHJcbiAgKTtcbn1cbiIsImltcG9ydCB7IG5ld0dhbWUgfSBmcm9tICcuL2dhbWUuanMnO1xuXG5uZXdHYW1lKCk7XG5cbiJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==
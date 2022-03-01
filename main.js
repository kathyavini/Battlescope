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

  await renderTurnScreen('PLAYER 1');
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOzs7QUFHQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE1BQU07QUFDTjtBQUNBO0FBQ0E7QUFDQSxNQUFNO0FBQ047QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLE1BQU07QUFDTjtBQUNBLE1BQU07QUFDTjtBQUNBLE1BQU07QUFDTjtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxNQUFNO0FBQ047QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQSxNQUFNO0FBQ047QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtB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eEIsUUFBUSxnQkFBZ0I7O0FBRXhCLFFBQVEsZ0JBQWdCO0FBQ3hCLFFBQVEsZ0JBQWdCOztBQUV4QixRQUFRLGdCQUFnQjtBQUN4Qjs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsRUFBRSxXQUFXO0FBQ2IsRUFBRSxjQUFjOztBQUVoQjtBQUNBLEVBQUUsT0FBTzs7QUFFVCxFQUFFLFdBQVc7QUFDYixFQUFFLFdBQVc7O0FBRWIsRUFBRSxhQUFhOztBQUVmLEVBQUUsU0FBUzs7QUFFWDtBQUNBOztBQUVBLElBQUksV0FBVzs7QUFFZjtBQUNBLE1BQU0sT0FBTztBQUNiO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsTUFBTSxXQUFXOztBQUVqQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxPQUFPO0FBQ1A7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxRQUFRLGdCQUFnQjs7QUFFeEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUM1S29DOztBQUVwQyxPQUFPIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vYmF0dGxlc2hpcC8uL3NyYy91dGlscy5qcyIsIndlYnBhY2s6Ly9iYXR0bGVzaGlwLy4vc3JjL3B1YnN1Yi5qcyIsIndlYnBhY2s6Ly9iYXR0bGVzaGlwLy4vc3JjL2RvbS5qcyIsIndlYnBhY2s6Ly9iYXR0bGVzaGlwLy4vc3JjL2RyYWdEcm9wLmpzIiwid2VicGFjazovL2JhdHRsZXNoaXAvLi9zcmMvcGxheWVyLmpzIiwid2VicGFjazovL2JhdHRsZXNoaXAvLi9zcmMvc2hpcHMuanMiLCJ3ZWJwYWNrOi8vYmF0dGxlc2hpcC8uL3NyYy9nYW1lYm9hcmQuanMiLCJ3ZWJwYWNrOi8vYmF0dGxlc2hpcC8uL3NyYy9nYW1lLmpzIiwid2VicGFjazovL2JhdHRsZXNoaXAvLi9zcmMvaW5kZXguanMiXSwic291cmNlc0NvbnRlbnQiOlsiZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZU5ld0VsZW1lbnQoXG4gIHR5cGUsXG4gIGNsYXNzZXMgPSBudWxsLFxuICB0ZXh0ID0gbnVsbCxcbiAgYXR0cmlidXRlcyA9IG51bGxcbikge1xuICBsZXQgY3JlYXRlZEVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KHR5cGUpO1xuXG4gIGlmIChjbGFzc2VzKSB7XG4gICAgY3JlYXRlZEVsZW1lbnQuY2xhc3NMaXN0LmFkZCguLi5jbGFzc2VzKTtcbiAgfVxuXG4gIGlmICh0ZXh0KSB7XG4gICAgY3JlYXRlZEVsZW1lbnQudGV4dENvbnRlbnQgPSB0ZXh0O1xuICB9XG5cbiAgaWYgKGF0dHJpYnV0ZXMpIHtcbiAgICBmb3IgKGxldCBrZXkgaW4gYXR0cmlidXRlcykge1xuICAgICAgY3JlYXRlZEVsZW1lbnQuc2V0QXR0cmlidXRlKGtleSwgYXR0cmlidXRlc1trZXldKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gY3JlYXRlZEVsZW1lbnQ7XG59XG4iLCIvKiBUaGlzIGlzIGFkYXB0ZWQgZnJvbSBTdGV2ZSBHcmlmZml0aCdzIFB1YlN1YiBEZXNpZ24gUGF0dGVybiBpbiBKU1xuXG5WaWRlbzogaHR0cHM6Ly93d3cueW91dHViZS5jb20vd2F0Y2g/dj1heW5TTThsbE9Cc1xuUmVwbzogaHR0cHM6Ly9naXRodWIuY29tL3Byb2Yzc3NvclN0M3YzL3B1YnN1Yi1kZW1vICovXG5cbmNvbnN0IGV2ZW50cyA9IHt9O1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0RXZlbnRzKCkge1xuICByZXR1cm4geyAuLi5ldmVudHMgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHN1YnNjcmliZShldmVudE5hbWUsIGNhbGxiYWNrKSB7XG4gIGV2ZW50c1tldmVudE5hbWVdID0gZXZlbnRzW2V2ZW50TmFtZV0gfHwgW107XG4gIGV2ZW50c1tldmVudE5hbWVdLnB1c2goY2FsbGJhY2spO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdW5zdWJzY3JpYmUoZXZlbnROYW1lLCBjYWxsYmFjaykge1xuICBpZiAoZXZlbnRzW2V2ZW50TmFtZV0pIHtcbiAgICBldmVudHNbZXZlbnROYW1lXSA9IGV2ZW50c1tldmVudE5hbWVdLmZpbHRlcigoZm4pID0+IGZuICE9PSBjYWxsYmFjayk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHB1Ymxpc2goZXZlbnROYW1lLCBkYXRhKSB7XG4gIGlmIChldmVudHNbZXZlbnROYW1lXSkge1xuICAgIGZvciAoY29uc3QgY2FsbGJhY2sgb2YgZXZlbnRzW2V2ZW50TmFtZV0pIHtcbiAgICAgIGNhbGxiYWNrKGRhdGEpO1xuICAgIH1cbiAgfVxufVxuIiwiaW1wb3J0ICcuL2Nzcy9jb2xvcnMtYW5kLWZvbnRzLmNzcyc7XG5pbXBvcnQgJy4vY3NzL2RvbS5jc3MnO1xuaW1wb3J0ICcuL2Nzcy9nYW1lLXNjcmVlbnMuY3NzJztcbmltcG9ydCAnLi9jc3MvbW9iaWxlLmNzcyc7XG5pbXBvcnQgeyBjcmVhdGVOZXdFbGVtZW50IH0gZnJvbSAnLi91dGlscyc7XG5pbXBvcnQgeyBzdWJzY3JpYmUsIHB1Ymxpc2ggfSBmcm9tICcuL3B1YnN1Yic7XG5cbi8qIEZvciB0aGVtZWluZyAqL1xuY29uc3Qgc2hpcE1hcHBpbmcgPSB7XG4gIGNhcnJpZXI6ICdvY3RvcHVzJyxcbiAgYmF0dGxlc2hpcDogJ3B1ZmZlcmZpc2gnLFxuICBkZXN0cm95ZXI6ICdnb2xkZmlzaCcsXG4gIHN1Ym1hcmluZTogJ3NlYWhvcnNlJyxcbiAgJ3BhdHJvbCBib2F0JzogJ2JldHRhIGZpc2gnLFxufTtcblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUNvbnRhaW5lcnMoKSB7XG4gIGNvbnN0IGJvZHkgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdib2R5Jyk7XG4gIGNvbnN0IGJvYXJkc0NvbnRhaW5lciA9IGNyZWF0ZU5ld0VsZW1lbnQoJ21haW4nLCBbJ3BsYXktYXJlYSddKTtcbiAgY29uc3QgZW5lbXlDb250YWluZXIgPSBjcmVhdGVOZXdFbGVtZW50KCdzZWN0aW9uJywgWydlbmVteSddKTtcbiAgY29uc3Qgb3duQ29udGFpbmVyID0gY3JlYXRlTmV3RWxlbWVudCgnc2VjdGlvbicsIFsnb3duJ10pO1xuICBjb25zdCBlbmVteUJvYXJkRmxlZXQgPSBjcmVhdGVOZXdFbGVtZW50KCdkaXYnLCBbJ2JvYXJkLWZsZWV0J10pO1xuICBjb25zdCBvd25Cb2FyZEZsZWV0ID0gY3JlYXRlTmV3RWxlbWVudCgnZGl2JywgWydib2FyZC1mbGVldCddKTtcblxuICBlbmVteUNvbnRhaW5lci5hcHBlbmQoXG4gICAgY3JlYXRlTmV3RWxlbWVudCgnaDInLCBbJ3N1YnRpdGxlJywgJ2VuZW15LXRpdGxlJ10sICdPcHBvbmVudCBPY2VhbicpLFxuICAgIGNyZWF0ZU5ld0VsZW1lbnQoJ2gzJywgWydhbm5vdW5jZS1wYW5lbCddKSxcbiAgICBlbmVteUJvYXJkRmxlZXRcbiAgKTtcbiAgZW5lbXlCb2FyZEZsZWV0LmFwcGVuZChcbiAgICBjcmVhdGVOZXdFbGVtZW50KCdkaXYnLCBbJ2JvYXJkJywgJ2VuZW15LWJvYXJkJ10pLFxuICAgIGNyZWF0ZU5ld0VsZW1lbnQoJ2RpdicsIFsnc3Vuay1mbGVldCddKVxuICApO1xuXG4gIG93bkNvbnRhaW5lci5hcHBlbmQoXG4gICAgY3JlYXRlTmV3RWxlbWVudCgnaDInLCBbJ3N1YnRpdGxlJywgJ293bi10aXRsZSddLCAnWW91ciBPY2VhbicpLFxuICAgIGNyZWF0ZU5ld0VsZW1lbnQoJ2gzJywgWydhbm5vdW5jZS1wYW5lbCddKSxcbiAgICBvd25Cb2FyZEZsZWV0XG4gICk7XG4gIG93bkJvYXJkRmxlZXQuYXBwZW5kKFxuICAgIGNyZWF0ZU5ld0VsZW1lbnQoJ2RpdicsIFsnYm9hcmQnLCAnb3duLWJvYXJkJ10pLFxuICAgIGNyZWF0ZU5ld0VsZW1lbnQoJ2RpdicsIFsnc3Vuay1mbGVldCddKVxuICApO1xuXG4gIGJvYXJkc0NvbnRhaW5lci5hcHBlbmQoZW5lbXlDb250YWluZXIsIG93bkNvbnRhaW5lcik7XG5cbiAgYm9keS5hcHBlbmQoXG4gICAgY3JlYXRlTmV3RWxlbWVudCgnaDEnLCBbJ3RpdGxlJ10sICdCYXR0bGVzY29wZScpLFxuICAgIGNyZWF0ZU5ld0VsZW1lbnQoJ2gzJywgWydnYW1lLWFubm91bmNlJ10pLFxuICAgIGJvYXJkc0NvbnRhaW5lclxuICApO1xuXG4gIC8qIEdhbWVib2FyZCBzcXVhcmVzICovXG4gIGNvbnN0IGJvYXJkcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5ib2FyZCcpO1xuICBmb3IgKGNvbnN0IGJvYXJkIG9mIGJvYXJkcykge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgMTA7IGkrKykge1xuICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCAxMDsgaisrKSB7XG4gICAgICAgIGNvbnN0IGRpdiA9IGNyZWF0ZU5ld0VsZW1lbnQoJ2RpdicsIFsnc3F1YXJlJ10sIG51bGwsIHtcbiAgICAgICAgICAnZGF0YS1wb3MnOiBgJHtpfSR7an1gLFxuICAgICAgICB9KTtcbiAgICAgICAgYm9hcmQuYXBwZW5kQ2hpbGQoZGl2KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlbmRlckJvYXJkKGJvYXJkLCBzZWN0aW9uKSB7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgMTA7IGkrKykge1xuICAgIGZvciAobGV0IGogPSAwOyBqIDwgMTA7IGorKykge1xuICAgICAgY29uc3QgdmFsdWUgPSBib2FyZFtpXVtqXTtcbiAgICAgIGNvbnN0IGJvYXJkU3F1YXJlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcbiAgICAgICAgYC4ke3NlY3Rpb259LWJvYXJkIFtkYXRhLXBvcz1cIiR7aX0ke2p9XCJdYFxuICAgICAgKTtcbiAgICAgIGlmICghdmFsdWUpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9IGVsc2UgaWYgKHZhbHVlID09PSAnaGl0JyB8fCB2YWx1ZSA9PT0gJ21pc3MnKSB7XG4gICAgICAgIGJvYXJkU3F1YXJlLmNsYXNzTGlzdC5hZGQodmFsdWUpO1xuICAgICAgICBib2FyZFNxdWFyZS5zdHlsZS5wb2ludGVyRXZlbnRzID0gJ25vbmUnOyAvLyBuZWNlc3NhcnkgZm9yIHRoZSAyLXBsYXllciB2ZXJzaW9uIHdoZXJlIHRoZSBib2FyZHMgYXJlIHJlZHJhd24gZWFjaCB0dXJuXG4gICAgICB9IGVsc2UgaWYgKHZhbHVlID09PSAnc3VuaycpIHtcbiAgICAgICAgYm9hcmRTcXVhcmUuY2xhc3NMaXN0LmFkZCh2YWx1ZSk7XG4gICAgICAgIGJvYXJkU3F1YXJlLmNsYXNzTGlzdC5hZGQoJ2hpdCcpO1xuICAgICAgICBib2FyZFNxdWFyZS5zdHlsZS5wb2ludGVyRXZlbnRzID0gJ25vbmUnO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYm9hcmRTcXVhcmUuY2xhc3NMaXN0LmFkZCh2YWx1ZSk7XG4gICAgICAgIGJvYXJkU3F1YXJlLmNsYXNzTGlzdC5hZGQoJ3NoaXAnKTtcblxuICAgICAgICAvLyBUYWcgb25lIHNxdWFyZSBwZXIgKG93bikgc2hpcCBmb3Igc2hvd2luZyB0aGUgYW5pbWFsIGltYWdlXG4gICAgICAgIC8vIEVuZW15IHNoaXBzIHNob3cgdGhlaXIgYW5pbWFsIHR5cGUgd2hlbiBjbGFzcyBzdW5rIGlzIGFwcGxpZWRcbiAgICAgICAgYm9hcmRTcXVhcmUuY2xhc3NMaXN0LmFkZChgJHt2YWx1ZVswXX1gKTtcblxuICAgICAgICBpZiAodmFsdWVbMF0gPT09ICdiJyAmJiB2YWx1ZVsxXSA9PT0gJzInKSB7XG4gICAgICAgICAgYm9hcmRTcXVhcmUuY2xhc3NMaXN0LmFkZCgndGFnZ2VkJyk7XG4gICAgICAgIH0gZWxzZSBpZiAodmFsdWVbMF0gPT09ICdjJyAmJiB2YWx1ZVsxXSA9PT0gJzMnKSB7XG4gICAgICAgICAgYm9hcmRTcXVhcmUuY2xhc3NMaXN0LmFkZCgndGFnZ2VkJyk7XG4gICAgICAgIH0gZWxzZSBpZiAoKHZhbHVlWzBdID09PSAncycgfHwgdmFsdWVbMF0gPT09ICdkJykgJiYgdmFsdWVbMV0gPT09ICcyJykge1xuICAgICAgICAgIGJvYXJkU3F1YXJlLmNsYXNzTGlzdC5hZGQoJ3RhZ2dlZCcpO1xuICAgICAgICB9IGVsc2UgaWYgKHZhbHVlWzBdID09PSAncCcgJiYgdmFsdWVbMV0gPT09ICcxJykge1xuICAgICAgICAgIGJvYXJkU3F1YXJlLmNsYXNzTGlzdC5hZGQoJ3RhZ2dlZCcpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbi8vIEZvciB0d28tcGxheWVyIG1vZGUsIHdoZXJlIHRoZSBib2FyZHMgYXJlIGNsZWFyZWQgYW5kIHN3YXBwZWQgZWFjaCB0dXJuL2RldmljZSBwYXNzXG5leHBvcnQgZnVuY3Rpb24gY2xlYXJCb2FyZHMoKSB7XG4gIGNvbnN0IGJvYXJkcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5ib2FyZCcpO1xuICBmb3IgKGNvbnN0IGJvYXJkIG9mIGJvYXJkcykge1xuICAgIGJvYXJkLmlubmVySFRNTCA9ICcnO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgMTA7IGkrKykge1xuICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCAxMDsgaisrKSB7XG4gICAgICAgIGNvbnN0IGRpdiA9IGNyZWF0ZU5ld0VsZW1lbnQoJ2RpdicsIFsnc3F1YXJlJ10sIG51bGwsIHtcbiAgICAgICAgICAnZGF0YS1wb3MnOiBgJHtpfSR7an1gLFxuICAgICAgICB9KTtcbiAgICAgICAgYm9hcmQuYXBwZW5kQ2hpbGQoZGl2KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHN3YXBTdW5rRmxlZXRzKCkge1xuICBjb25zdCBvd25Cb2FyZEFyZWEgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAub3duIC5ib2FyZC1mbGVldGApO1xuICBjb25zdCBlbmVteUJvYXJkQXJlYSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYC5lbmVteSAuYm9hcmQtZmxlZXRgKTtcblxuICBlbmVteUJvYXJkQXJlYS5hcHBlbmRDaGlsZChkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAub3duIC5zdW5rLWZsZWV0YCkpO1xuICBvd25Cb2FyZEFyZWEuYXBwZW5kQ2hpbGQoZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgLmVuZW15IC5zdW5rLWZsZWV0YCkpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY2xpY2tMaXN0ZW5lcihwbGF5ZXIsIHNlY3Rpb24pIHtcbiAgY29uc3QgdGFyZ2V0Q29udGFpbmVyID0gZG9jdW1lbnQucXVlcnlTZWxlY3Rvcihgc2VjdGlvbi4ke3NlY3Rpb259YCk7XG5cbiAgY29uc3QgdGFyZ2V0U3F1YXJlcyA9IHRhcmdldENvbnRhaW5lci5xdWVyeVNlbGVjdG9yQWxsKCcuc3F1YXJlJyk7XG4gIHRhcmdldFNxdWFyZXMuZm9yRWFjaCgoc3F1YXJlKSA9PiB7XG4gICAgc3F1YXJlLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKGV2KSA9PiB7XG4gICAgICBjbGlja0F0dGFjayhldiwgcGxheWVyKTtcbiAgICB9KTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGNsaWNrQXR0YWNrKGV2LCBwbGF5ZXIpIHtcbiAgLy8gR2FtZWJvYXJkIGNvbnN1bWVzIHRoZSBldmVudCBlbWl0dGVkIGhlcmVcbiAgcHVibGlzaCgnc3F1YXJlQXR0YWNrZWQnLCBbcGxheWVyLCBldi50YXJnZXQuZGF0YXNldC5wb3NdKTtcblxuICAvLyBUaGF0IHNxdWFyZSBjYW4gbm8gbG9uZ2VyIGJlIHRhcmdldGVkXG4gIGV2LnRhcmdldC5zdHlsZS5wb2ludGVyRXZlbnRzID0gJ25vbmUnO1xuXG4gIC8vIFRpbWUgdW50aWwgbmV4dCBodW1hbiBjbGljayBjYW4gYmUgcmVnaXN0ZXJlZCBvbiBhbnkgc3F1YXJlXG4gIGV2LnRhcmdldC5wYXJlbnRFbGVtZW50LnN0eWxlLnBvaW50ZXJFdmVudHMgPSAnbm9uZSc7XG4gIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgIGV2LnRhcmdldC5wYXJlbnRFbGVtZW50LnN0eWxlLnBvaW50ZXJFdmVudHMgPSAnaW5pdGlhbCc7XG4gIH0sIDUwKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG1ha2VBbm5vdW5jZW1lbnRzKCkge1xuICBjb25zdCBnYW1lUGFuZWwgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuZ2FtZS1hbm5vdW5jZScpO1xuICBjb25zdCBib2FyZHNDb250YWluZXIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdtYWluJyk7XG5cbiAgbGV0IHBhbmVsO1xuICBsZXQgc3Vua0ZsZWV0O1xuXG4gIC8vIEdhbWUgbG9vcCBlbWl0cyBldmVudCB3aGVuIGFjdGl2ZSBwYW5lbCBpcyBzd2l0Y2hlZFxuICBzdWJzY3JpYmUoJ3RhcmdldENoYW5nZScsIGNoYW5nZVBhbmVsKTtcblxuICBmdW5jdGlvbiBjaGFuZ2VQYW5lbCh0YXJnZXQpIHtcbiAgICBwYW5lbCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYC4ke3RhcmdldH0gLmFubm91bmNlLXBhbmVsYCk7XG4gICAgc3Vua0ZsZWV0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgLiR7dGFyZ2V0fSAuc3Vuay1mbGVldGApO1xuICB9XG5cbiAgY29uc3QgYW5ub3VuY2VQYW5lbHMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcuYW5ub3VuY2UtcGFuZWwnKTtcblxuICAvLyBUaW1pbmcgb2YgYW5ub3VuY2VtZW50cyBhcmUgY29udHJvbGxlZCBieSBDU1MgdHJhbnNpdGlvbnNcbiAgZm9yIChjb25zdCBwYW5lbCBvZiBhbm5vdW5jZVBhbmVscykge1xuICAgIHBhbmVsLmFkZEV2ZW50TGlzdGVuZXIoJ3RyYW5zaXRpb25lbmQnLCAoKSA9PiB7XG4gICAgICBwYW5lbC5jbGFzc0xpc3QucmVtb3ZlKCd2aXNpYmxlJyk7XG4gICAgICBwYW5lbC5jbGFzc0xpc3QucmVtb3ZlKCdoaXQnKTtcbiAgICB9KTtcbiAgfVxuXG4gIHN1YnNjcmliZSgnaGl0JywgYW5ub3VuY2VIaXQpO1xuICBzdWJzY3JpYmUoJ21pc3MnLCBhbm5vdW5jZU1pc3MpO1xuICBzdWJzY3JpYmUoJ3NoaXBTdW5rJywgYW5ub3VuY2VTdW5rU2hpcCk7XG4gIHN1YnNjcmliZSgnZmxlZXRTdW5rJywgYW5ub3VuY2VXaW4pO1xuICBzdWJzY3JpYmUoJ2ZsZWV0U3VuaycsIGVuZEdhbWUpO1xuICBzdWJzY3JpYmUoJ3NoaXBTdW5rJywgcmVuZGVyU3Vua1NoaXApO1xuXG4gIC8vIFRoZXNlIGZ1bmN0aW9ucyB1c2VkIHRvIGFubm91bmNlIGhpdCBsb2NhdGlvbnMgYXMgd2VsbFxuICAvLyBmb3Igbm93IGxlYXZpbmcgbG9jYXRpb24gZGF0YSBhcyBhIHBhcmFtZXRlciBoZXJlIGluIGNhc2UgdGhhdCBpcyByZS1pbXBsZW1lbnRlZFxuICBmdW5jdGlvbiBhbm5vdW5jZUhpdChbcm93LCBjb2x1bW5dKSB7XG4gICAgcGFuZWwuY2xhc3NMaXN0LmFkZCgndmlzaWJsZScpO1xuICAgIHBhbmVsLmNsYXNzTGlzdC5hZGQoJ2hpdCcpO1xuICAgIHBhbmVsLnRleHRDb250ZW50ID0gYFNvbWV0aGluZydzIGJlZW4gc3BvdHRlZCFgO1xuICB9XG5cbiAgZnVuY3Rpb24gYW5ub3VuY2VNaXNzKCkge1xuICAgIHBhbmVsLmNsYXNzTGlzdC5hZGQoJ3Zpc2libGUnKTtcbiAgICBwYW5lbC50ZXh0Q29udGVudCA9IGBOb3RoaW5nIWA7XG4gIH1cblxuICBmdW5jdGlvbiBhbm5vdW5jZVN1bmtTaGlwKFtoaXRTaGlwLCBbcm93LCBjb2x1bW5dXSkge1xuICAgIHBhbmVsLmNsYXNzTGlzdC5hZGQoJ3Zpc2libGUnKTtcbiAgICBjb25zdCBjcmVhdHVyZSA9IHNoaXBNYXBwaW5nW2Ake2hpdFNoaXAudHlwZX1gXTtcbiAgICBwYW5lbC50ZXh0Q29udGVudCA9IGBJdCdzIGEgJHtjcmVhdHVyZX0hIWA7XG4gIH1cblxuICBmdW5jdGlvbiBhbm5vdW5jZVdpbihbbG9zZXIsIHdpbm5lcl0pIHtcbiAgICBnYW1lUGFuZWwuY2xhc3NMaXN0LmFkZCgnd2luJyk7XG4gICAgZ2FtZVBhbmVsLnRleHRDb250ZW50ID0gYCR7bG9zZXJ9J3Mgc2VhIGNyZWF0dXJlcyBoYXZlIGJlZW4gZm91bmQhICR7d2lubmVyfSB3aW5zIWA7XG4gIH1cblxuICBmdW5jdGlvbiBlbmRHYW1lKCkge1xuICAgIC8vIENvbGxhcHNlIGJvYXJkIGFubm91bmNlIHBhbmVsc1xuICAgIGZvciAoY29uc3QgcGFuZWwgb2YgYW5ub3VuY2VQYW5lbHMpIHtcbiAgICAgIHBhbmVsLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgfVxuICAgIC8vIERpc2FibGUgZnVydGhlciBjbGlja2luZ1xuICAgIGJvYXJkc0NvbnRhaW5lci5zdHlsZS5wb2ludGVyRXZlbnRzID0gJ25vbmUnO1xuXG4gICAgLy8gQnV0dG9uIHRvIHJlc3RhcnQgKHJlbG9hZCkgZ2FtZVxuICAgIGNvbnN0IHBsYXlBZ2FpbiA9IGNyZWF0ZU5ld0VsZW1lbnQoJ2J1dHRvbicsIFsncGxheS1hZ2FpbiddLCAnUGxheSBBZ2FpbicpO1xuXG4gICAgcGxheUFnYWluLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKGV2KSA9PiB7XG4gICAgICBldi5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgbG9jYXRpb24ucmVsb2FkKCk7XG4gICAgfSk7XG5cbiAgICBnYW1lUGFuZWwuYXBwZW5kQ2hpbGQocGxheUFnYWluKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlbmRlclN1bmtTaGlwKFtoaXRTaGlwLCBbcm93LCBjb2x1bW5dXSkge1xuICAgIGNvbnN0IHNoaXBSZW5kZXIgPSBjcmVhdGVOZXdFbGVtZW50KCdkaXYnLCBbXG4gICAgICAnc2hpcC1yZW5kZXInLFxuICAgICAgYCR7aGl0U2hpcC50eXBlWzBdfWAsXG4gICAgXSk7XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGhpdFNoaXAubGVuZ3RoOyBpKyspIHtcbiAgICAgIHNoaXBSZW5kZXIuYXBwZW5kQ2hpbGQoY3JlYXRlTmV3RWxlbWVudCgnZGl2JywgWydzaGlwLXBhcnQnXSkpO1xuICAgIH1cblxuICAgIHN1bmtGbGVldC5hcHBlbmRDaGlsZChzaGlwUmVuZGVyKTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVuZGVyU3RhcnRTY3JlZW4oKSB7XG4gIGNvbnN0IGJvZHkgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdib2R5Jyk7XG4gIGNvbnN0IHBsYXllcjEgPSBjcmVhdGVOZXdFbGVtZW50KFxuICAgICdidXR0b24nLFxuICAgIFsnc2luZ2xlLXBsYXllci1idXR0b24nXSxcbiAgICAnMS1QbGF5ZXInXG4gICk7XG4gIGNvbnN0IHBsYXllcjIgPSBjcmVhdGVOZXdFbGVtZW50KCdidXR0b24nLCBbJ3R3by1wbGF5ZXItYnV0dG9uJ10sICcyLVBsYXllcicpO1xuXG4gIGNvbnN0IHN0YXJ0U2NyZWVuID0gY3JlYXRlTmV3RWxlbWVudCgnZGl2JywgWydzdGFydC1zY3JlZW4nXSk7XG4gIHN0YXJ0U2NyZWVuLmFwcGVuZChcbiAgICBjcmVhdGVOZXdFbGVtZW50KCdoMScsIFsnc3RhcnQtdGl0bGUnXSwgJ0JhdHRsZVNDT1BFJyksXG4gICAgY3JlYXRlTmV3RWxlbWVudCgnZGl2JywgWydzY29wZSddKSxcbiAgICBjcmVhdGVOZXdFbGVtZW50KFxuICAgICAgJ2gyJyxcbiAgICAgIFsnc3RhcnQtc3VidGl0bGUnXSxcbiAgICAgICdBIGZyaWVuZGxpZXIgdGFrZSBvbiB0aGUgY2xhc3NpYyBnYW1lIEJhdHRsZXNoaXAnXG4gICAgKSxcbiAgICBjcmVhdGVOZXdFbGVtZW50KFxuICAgICAgJ3AnLFxuICAgICAgWydkaXJlY3Rpb25zJ10sXG4gICAgICBcIkRJUkVDVElPTlM6IEV4cGxvcmUgeW91ciBvcHBvbmVudCdzIG9jZWFuIHdpdGggeW91ciB1bmRlcndhdGVyIHNjb3BlLiBUaGUgZmlyc3QgdG8gc3BvdCBhbGwgZml2ZSBzZWEgY3JlYXR1cmVzIHdpbnMhIEluIDItUExBWUVSLU1PREUgZWFjaCB0dXJuIGdyYW50cyBmaXZlIHNjb3BlIGF0dGVtcHRzLlwiXG4gICAgKSxcbiAgICBwbGF5ZXIxLFxuICAgIHBsYXllcjJcbiAgKTtcblxuICBib2R5LmFwcGVuZChzdGFydFNjcmVlbik7XG5cbiAgcmV0dXJuIFtwbGF5ZXIxLCBwbGF5ZXIyXTsgLy8gdG8gY29udHJvbCBnYW1lIHR5cGUgZnJvbSBnYW1lIG1vZHVsZVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVuZGVyVHVyblNjcmVlbihwbGF5ZXIpIHtcbiAgY29uc3QgYm9keSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ2JvZHknKTtcbiAgY29uc3QgcmVhZHlCdXR0b24gPSBjcmVhdGVOZXdFbGVtZW50KCdidXR0b24nLCBbJ3JlYWR5LWJ1dHRvbiddLCAnUmVhZHknKTtcblxuICBjb25zdCB0dXJuU2NyZWVuID0gY3JlYXRlTmV3RWxlbWVudCgnZGl2JywgWyd0dXJuLXNjcmVlbiddKTtcbiAgdHVyblNjcmVlbi5hcHBlbmQoXG4gICAgY3JlYXRlTmV3RWxlbWVudChcbiAgICAgICdoMicsXG4gICAgICBbJ3R1cm4taW5zdHJ1Y3Rpb25zJ10sXG4gICAgICBgUGxlYXNlIHBhc3MgdGhlIGRldmljZSB0byAke3BsYXllcn0uIEhpdCByZWFkeSB3aGVuIGRldmljZSBpcyBwYXNzZWRgXG4gICAgKSxcbiAgICByZWFkeUJ1dHRvblxuICApO1xuXG4gIGJvZHkuYXBwZW5kKHR1cm5TY3JlZW4pO1xuXG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgIHJlYWR5QnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKGV2KSA9PiB7XG4gICAgICBldi5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgdHVyblNjcmVlbi5wYXJlbnRFbGVtZW50LnJlbW92ZUNoaWxkKHR1cm5TY3JlZW4pO1xuICAgICAgcmVzb2x2ZSh0cnVlKTtcbiAgICB9KTtcbiAgfSk7XG59XG4iLCJpbXBvcnQgeyBjcmVhdGVOZXdFbGVtZW50IH0gZnJvbSAnLi91dGlscyc7XG5cbmV4cG9ydCBmdW5jdGlvbiByZW5kZXJTaGlwU2NyZWVuKGdhbWVib2FyZCkge1xuICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdtYWluJykuc3R5bGUuZGlzcGxheSA9ICdub25lJztcblxuICAvLyBIaWRlcyB0aXRsZSBhbmQgZGlzYWJsZXMgb3ZlcmZsb3cgb24gbW9iaWxlXG4gIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy50aXRsZScpLmNsYXNzTGlzdC5hZGQoJ2hpZGRlbicpO1xuICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdodG1sJykuY2xhc3NMaXN0LmFkZCgnZHJhZ2dpbmcnKTtcblxuICBjb25zdCByYW5kb21pemUgPSBjcmVhdGVOZXdFbGVtZW50KCdidXR0b24nLCBbJ3JhbmRvbWl6ZSddLCAnUmFuZG9taXplJyk7XG4gIGNvbnN0IHN0YXJ0ID0gY3JlYXRlTmV3RWxlbWVudCgnYnV0dG9uJywgWydzdGFydCddLCAnU3RhcnQnKTtcblxuICBjb25zdCBzaGlwU2NyZWVuID0gY3JlYXRlTmV3RWxlbWVudCgnZGl2JywgWydzaGlwLXNjcmVlbiddKTtcbiAgc2hpcFNjcmVlbi5hcHBlbmQoXG4gICAgY3JlYXRlTmV3RWxlbWVudCgnaDInLCBbJ3NoaXAtc3VidGl0bGUnXSwgJ0hpZGUgeW91ciB3aWxkbGlmZScpLFxuICAgIGNyZWF0ZU5ld0VsZW1lbnQoXG4gICAgICAncCcsXG4gICAgICBbJ2RpcmVjdGlvbnMnXSxcbiAgICAgICdEcmFnIGFuZCBkcm9wIHRvIG1vdmUsIGNsaWNrIHRvIGNoYW5nZSBvcmllbnRhdGlvbi4gV2lsZGxpZmUgY2Fubm90IGJlIGFkamFjZW50IHRvIG90aGVyIHdpbGRsaWZlJ1xuICAgICksXG4gICAgcmFuZG9taXplLFxuICAgIHN0YXJ0XG4gICk7XG5cbiAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignYm9keScpLmFwcGVuZChzaGlwU2NyZWVuKTtcblxuICAvKiBDcmVhdGUgYmxhbmsgYm9hcmQgKi9cbiAgY29uc3QgYm9hcmQgPSBjcmVhdGVOZXdFbGVtZW50KCdkaXYnLCBbJ2RyYWctYm9hcmQnXSk7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgMTA7IGkrKykge1xuICAgIGZvciAobGV0IGogPSAwOyBqIDwgMTA7IGorKykge1xuICAgICAgY29uc3QgZGl2ID0gY3JlYXRlTmV3RWxlbWVudCgnZGl2JywgWydkcmFnLXNxdWFyZSddLCBudWxsLCB7XG4gICAgICAgICdkYXRhLXBvcyc6IGAke2l9JHtqfWAsXG4gICAgICB9KTtcbiAgICAgIGJvYXJkLmFwcGVuZENoaWxkKGRpdik7XG4gICAgfVxuICB9XG5cbiAgLy8gSSBmb3JnZXQgd2h5IEkgZGlkIHRoaXNcbiAgc2hpcFNjcmVlbi5pbnNlcnRCZWZvcmUoYm9hcmQsIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5yYW5kb21pemUnKSk7XG5cbiAgLy8gQ3JlYXRlIHNoaXAgRE9NIGVsZW1lbnRzXG4gIHBsYWNlRHJhZ2dhYmxlU2hpcHMoZ2FtZWJvYXJkKTtcblxuICAvLyBBZGQgZXZlbnQgbGlzdGVuZXJzIHRvIGJvYXJkXG4gIGxpc3RlbkZvckRyYWdEcm9wRXZlbnRzKGdhbWVib2FyZCk7IC8vIG1vdXNlIG9ubHlcbiAgbGlzdGVuRm9yVG91Y2hFdmVudHMoZ2FtZWJvYXJkKTsgLy8gdG91Y2hcblxuICAvLyBCdXR0b24gZXZlbnQgbGlzdGVuZXJzXG4gIHJhbmRvbWl6ZS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIChldikgPT4ge1xuICAgIGV2LnByZXZlbnREZWZhdWx0KCk7XG4gICAgZ2FtZWJvYXJkLmNsZWFyQm9hcmQoKTtcbiAgICBnYW1lYm9hcmQucGxhY2VBbGxTaGlwc1JhbmRvbWx5KCk7XG4gICAgY2xlYXJEcmFnZ2FibGVTaGlwcygpO1xuICAgIHBsYWNlRHJhZ2dhYmxlU2hpcHMoZ2FtZWJvYXJkKTtcbiAgfSk7XG5cbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgc3RhcnQuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoZXYpID0+IHtcbiAgICAgIGV2LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICBzaGlwU2NyZWVuLnBhcmVudEVsZW1lbnQucmVtb3ZlQ2hpbGQoc2hpcFNjcmVlbik7XG4gICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdtYWluJykuc3R5bGUuZGlzcGxheSA9ICdmbGV4JztcbiAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ2h0bWwnKS5jbGFzc0xpc3QucmVtb3ZlKCdkcmFnZ2luZycpO1xuICAgICAgcmVzb2x2ZSh0cnVlKTtcbiAgICB9KTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGxpc3RlbkZvckRyYWdEcm9wRXZlbnRzKGdhbWVib2FyZCkge1xuICBsZXQgdGhpc0RyYWdFbGVtZW50O1xuICBjb25zdCBkcmFnQm9hcmQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuZHJhZy1ib2FyZCcpO1xuICBkcmFnQm9hcmQuYWRkRXZlbnRMaXN0ZW5lcignZHJhZ3N0YXJ0JywgKGV2KSA9PiB7XG4gICAgdGhpc0RyYWdFbGVtZW50ID0gZXYudGFyZ2V0O1xuICB9KTtcblxuICBkcmFnQm9hcmQuYWRkRXZlbnRMaXN0ZW5lcignZHJhZ2VudGVyJywgKGV2KSA9PiB7XG4gICAgaWYgKGV2LnRhcmdldC5jbGFzc05hbWUgPT09ICdkcmFnLXNxdWFyZScpIHtcbiAgICAgIGV2LnRhcmdldC5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSAncHVycGxlJztcbiAgICB9XG4gIH0pO1xuXG4gIGRyYWdCb2FyZC5hZGRFdmVudExpc3RlbmVyKCdkcmFnbGVhdmUnLCAoZXYpID0+IHtcbiAgICBpZiAoZXYudGFyZ2V0LmNsYXNzTmFtZSA9PT0gJ2RyYWctc3F1YXJlJykge1xuICAgICAgZXYudGFyZ2V0LnN0eWxlLmJhY2tncm91bmRDb2xvciA9ICcnO1xuICAgIH1cbiAgfSk7XG5cbiAgZHJhZ0JvYXJkLmFkZEV2ZW50TGlzdGVuZXIoJ2RyYWdvdmVyJywgKGV2KSA9PiB7XG4gICAgLy8gTUROIHNheXMgdGhpcyBpcyBuZWNlc3NhcnkgdG8gYWxsb3cgZHJvcFxuICAgIGV2LnByZXZlbnREZWZhdWx0KCk7XG4gIH0pO1xuXG4gIC8vIERyYWcgYW5kIGRyb3AgdG8gdXBkYXRlIHBvc2l0aW9uXG4gIGRyYWdCb2FyZC5hZGRFdmVudExpc3RlbmVyKCdkcm9wJywgKGV2KSA9PiB7XG4gICAgZXYucHJldmVudERlZmF1bHQoKTtcblxuICAgIGlmIChldi50YXJnZXQuY2xhc3NOYW1lID09PSAnZHJhZy1zcXVhcmUnKSB7XG4gICAgICBldi50YXJnZXQuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gJyc7XG5cbiAgICAgIGNvbnN0IGNvb3JkcyA9IFsrZXYudGFyZ2V0LmRhdGFzZXQucG9zWzBdLCArZXYudGFyZ2V0LmRhdGFzZXQucG9zWzFdXTtcblxuICAgICAgY29uc3QgbGVuZ3RoID0gdGhpc0RyYWdFbGVtZW50LmRhdGFzZXQubGVuZ3RoO1xuICAgICAgY29uc3QgdHlwZSA9IHRoaXNEcmFnRWxlbWVudC5kYXRhc2V0LnR5cGU7XG4gICAgICBjb25zdCBvcmllbnRhdGlvbiA9IHRoaXNEcmFnRWxlbWVudC5kYXRhc2V0Lm9yaWVudGF0aW9uO1xuXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGNvb3JkcywgdHlwZSwgb3JpZW50YXRpb24pO1xuXG4gICAgICB0cnkge1xuICAgICAgICBnYW1lYm9hcmQuaXNTaGlwTGVnYWwodHlwZSwgbGVuZ3RoLCBvcmllbnRhdGlvbiwgY29vcmRzKTtcbiAgICAgICAgLy8gY29uc29sZS5sb2coJ3RoaXMgd2FzIGEgbGVnYWwgcGxhY2VtZW50Jyk7XG5cbiAgICAgICAgdXBkYXRlR2FtZWJvYXJkKGdhbWVib2FyZCwgdHlwZSwgY29vcmRzLCBvcmllbnRhdGlvbik7XG5cbiAgICAgICAgdGhpc0RyYWdFbGVtZW50LnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQodGhpc0RyYWdFbGVtZW50KTtcbiAgICAgICAgZXYudGFyZ2V0LmFwcGVuZENoaWxkKHRoaXNEcmFnRWxlbWVudCk7XG5cbiAgICAgICAgdGhpc0RyYWdFbGVtZW50LmRhdGFzZXQucG9zID0gZXYudGFyZ2V0LmRhdGFzZXQucG9zO1xuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coZXJyb3IpO1xuICAgICAgICAvLyBjb25zb2xlLmxvZygndGhpcyB3YXMgbm90IGEgbGVnYWwgcGxhY2VtZW50Jyk7XG4gICAgICB9XG4gICAgfVxuICB9KTtcbn1cblxuZnVuY3Rpb24gbGlzdGVuRm9yVG91Y2hFdmVudHMoZ2FtZWJvYXJkKSB7XG4gIGNvbnN0IGRyYWdCb2FyZCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5kcmFnLWJvYXJkJyk7XG4gIGxldCB0aGlzRHJhZ0VsZW1lbnQ7XG5cbiAgbGV0IGluaXRpYWxQb3M7XG4gIGxldCBkcmFnZ2luZyA9IGZhbHNlO1xuXG4gIGRyYWdCb2FyZC5hZGRFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgKGV2KSA9PiB7XG4gICAgaWYgKGV2LnRhcmdldC5jbGFzc0xpc3QuY29udGFpbnMoJ2RyYWdnYWJsZS1zaGlwJykpIHtcbiAgICAgIHRoaXNEcmFnRWxlbWVudCA9IGV2LnRhcmdldDtcbiAgICB9XG4gICAgaW5pdGlhbFBvcyA9IFtldi50b3VjaGVzWzBdLmNsaWVudFgsIGV2LnRvdWNoZXNbMF0uY2xpZW50WV07XG4gIH0pO1xuXG4gIGRyYWdCb2FyZC5hZGRFdmVudExpc3RlbmVyKCd0b3VjaG1vdmUnLCAoZXYpID0+IHtcbiAgICBpZiAodGhpc0RyYWdFbGVtZW50KSB7XG4gICAgICB0aGlzRHJhZ0VsZW1lbnQuc3R5bGUub3BhY2l0eSA9ICcwLjUnO1xuICAgICAgdGhpc0RyYWdFbGVtZW50LnN0eWxlLnRyYW5zZm9ybSA9IGB0cmFuc2xhdGUoJHtcbiAgICAgICAgZXYudG91Y2hlc1swXS5jbGllbnRYIC0gaW5pdGlhbFBvc1swXVxuICAgICAgfXB4LCAke2V2LnRvdWNoZXNbMF0uY2xpZW50WSAtIGluaXRpYWxQb3NbMV19cHgpICR7XG4gICAgICAgIHRoaXNEcmFnRWxlbWVudC5kYXRhc2V0Lm9yaWVudGF0aW9uID09PSAndmVydGljYWwnXG4gICAgICAgICAgPyAncm90YXRlKDkwZGVnKSdcbiAgICAgICAgICA6ICcnXG4gICAgICB9YDtcbiAgICAgIGRyYWdnaW5nID0gdHJ1ZTtcbiAgICB9XG4gIH0pO1xuXG4gIGRyYWdCb2FyZC5hZGRFdmVudExpc3RlbmVyKCd0b3VjaGVuZCcsIChldikgPT4ge1xuICAgIGlmIChkcmFnZ2luZyAmJiB0aGlzRHJhZ0VsZW1lbnQpIHtcbiAgICAgIGNvbnN0IHRvdWNoZWREaXZzID0gZG9jdW1lbnQuZWxlbWVudHNGcm9tUG9pbnQoXG4gICAgICAgIHRoaXNEcmFnRWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS54LFxuICAgICAgICB0aGlzRHJhZ0VsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkueVxuICAgICAgKTtcblxuICAgICAgdG91Y2hlZERpdnMuZm9yRWFjaCgoZGl2KSA9PiB7XG4gICAgICAgIGNvbnN0IGNvcm5lckRpdiA9IGRpdjtcblxuICAgICAgICBpZiAoY29ybmVyRGl2LmNsYXNzTGlzdC5jb250YWlucygnZHJhZy1zcXVhcmUnKSkge1xuICAgICAgICAgIGNvbnN0IGNvb3JkcyA9IFsrY29ybmVyRGl2LmRhdGFzZXQucG9zWzBdLCArY29ybmVyRGl2LmRhdGFzZXQucG9zWzFdXTtcblxuICAgICAgICAgIGNvbnN0IGxlbmd0aCA9IHRoaXNEcmFnRWxlbWVudC5kYXRhc2V0Lmxlbmd0aDtcbiAgICAgICAgICBjb25zdCB0eXBlID0gdGhpc0RyYWdFbGVtZW50LmRhdGFzZXQudHlwZTtcbiAgICAgICAgICBjb25zdCBvcmllbnRhdGlvbiA9IHRoaXNEcmFnRWxlbWVudC5kYXRhc2V0Lm9yaWVudGF0aW9uO1xuXG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhjb29yZHMsIHR5cGUsIG9yaWVudGF0aW9uKTtcblxuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBnYW1lYm9hcmQuaXNTaGlwTGVnYWwodHlwZSwgbGVuZ3RoLCBvcmllbnRhdGlvbiwgY29vcmRzKTtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCd0aGlzIHdhcyBhIGxlZ2FsIHBsYWNlbWVudCcpO1xuXG4gICAgICAgICAgICB1cGRhdGVHYW1lYm9hcmQoZ2FtZWJvYXJkLCB0eXBlLCBjb29yZHMsIG9yaWVudGF0aW9uKTtcblxuICAgICAgICAgICAgdGhpc0RyYWdFbGVtZW50LnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQodGhpc0RyYWdFbGVtZW50KTtcbiAgICAgICAgICAgIGNvcm5lckRpdi5hcHBlbmRDaGlsZCh0aGlzRHJhZ0VsZW1lbnQpO1xuXG4gICAgICAgICAgICB0aGlzRHJhZ0VsZW1lbnQuZGF0YXNldC5wb3MgPSBjb3JuZXJEaXYuZGF0YXNldC5wb3M7XG4gICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGVycm9yKTtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCd0aGlzIHdhcyBub3QgYSBsZWdhbCBwbGFjZW1lbnQnKTtcbiAgICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgdGhpc0RyYWdFbGVtZW50LnN0eWxlLnRyYW5zZm9ybSA9ICcnO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICB0aGlzRHJhZ0VsZW1lbnQuc3R5bGUub3BhY2l0eSA9ICcxJztcbiAgICAgIHRoaXNEcmFnRWxlbWVudC5zdHlsZS50cmFuc2Zvcm0gPSAnJztcbiAgICAgIHRoaXNEcmFnRWxlbWVudCA9IHVuZGVmaW5lZDtcbiAgICAgIGRyYWdnaW5nID0gZmFsc2U7XG4gICAgfVxuICB9KTtcbn1cblxuLyogUHV0IGRyYWdnYWJsZSBlbGVtZW50cyBhdCBlYWNoIHNoaXAgbG9jYXRpb24gKi9cbmZ1bmN0aW9uIHBsYWNlRHJhZ2dhYmxlU2hpcHMoZ2FtZWJvYXJkKSB7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgMTA7IGkrKykge1xuICAgIGZvciAobGV0IGogPSAwOyBqIDwgMTA7IGorKykge1xuICAgICAgY29uc3QgdmFsdWUgPSBnYW1lYm9hcmQuYm9hcmRBcnJheVtpXVtqXTtcbiAgICAgIGNvbnN0IGJvYXJkU3F1YXJlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcbiAgICAgICAgYC5kcmFnLXNxdWFyZVtkYXRhLXBvcz1cIiR7aX0ke2p9XCJdYFxuICAgICAgKTtcblxuICAgICAgaWYgKCF2YWx1ZSkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH0gZWxzZSBpZiAodmFsdWVbMV0gPT09ICcxJykge1xuICAgICAgICBjb25zdCBbc2hpcF0gPSBnYW1lYm9hcmQuZmxlZXQuZmlsdGVyKCh4KSA9PiB4LnR5cGVbMF0gPT0gdmFsdWVbMF0pO1xuXG4gICAgICAgIGNvbnN0IGRyYWdnYWJsZSA9IHJlbmRlckRyYWdnYWJsZVNoaXAoc2hpcCk7XG5cbiAgICAgICAgYm9hcmRTcXVhcmUuYXBwZW5kQ2hpbGQoZHJhZ2dhYmxlKTtcblxuICAgICAgICAvLyBDbGljayB0byBjaGFuZ2Ugb3JpZW50YXRpb24gZXZlbnQgbGlzdGVuZXJcbiAgICAgICAgZHJhZ2dhYmxlLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKGV2KSA9PiB7XG4gICAgICAgICAgZXYuc3RvcFByb3BhZ2F0aW9uKCk7XG5cbiAgICAgICAgICBsZXQgbmV3T3JpZW50YXRpb247XG5cbiAgICAgICAgICBpZiAoZXYudGFyZ2V0LmRhdGFzZXQub3JpZW50YXRpb24gPT09ICd2ZXJ0aWNhbCcpIHtcbiAgICAgICAgICAgIG5ld09yaWVudGF0aW9uID0gJ2hvcml6b250YWwnO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBuZXdPcmllbnRhdGlvbiA9ICd2ZXJ0aWNhbCc7XG4gICAgICAgICAgfVxuICAgICAgICAgIGNvbnN0IGNvb3JkcyA9IFtcbiAgICAgICAgICAgICtkcmFnZ2FibGUucGFyZW50Tm9kZS5kYXRhc2V0LnBvc1swXSxcbiAgICAgICAgICAgICtkcmFnZ2FibGUucGFyZW50Tm9kZS5kYXRhc2V0LnBvc1sxXSxcbiAgICAgICAgICBdO1xuICAgICAgICAgIGNvbnN0IHR5cGUgPSBkcmFnZ2FibGUuZGF0YXNldC50eXBlO1xuICAgICAgICAgIGNvbnN0IGxlbmd0aCA9IGRyYWdnYWJsZS5kYXRhc2V0Lmxlbmd0aDtcblxuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coY29vcmRzLCB0eXBlLCBuZXdPcmllbnRhdGlvbik7XG5cbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgZ2FtZWJvYXJkLmlzU2hpcExlZ2FsKHR5cGUsIGxlbmd0aCwgbmV3T3JpZW50YXRpb24sIGNvb3Jkcyk7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZygndGhpcyB3YXMgYSBsZWdhbCBwbGFjZW1lbnQnKTtcblxuICAgICAgICAgICAgdXBkYXRlR2FtZWJvYXJkKGdhbWVib2FyZCwgdHlwZSwgY29vcmRzLCBuZXdPcmllbnRhdGlvbik7XG5cbiAgICAgICAgICAgIGRyYWdnYWJsZS5jbGFzc0xpc3QudG9nZ2xlKCdyb3RhdGVkJyk7XG4gICAgICAgICAgICBkcmFnZ2FibGUuZGF0YXNldC5vcmllbnRhdGlvbiA9IG5ld09yaWVudGF0aW9uO1xuICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhlcnJvcik7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZygndGhpcyB3YXMgbm90IGEgbGVnYWwgcGxhY2VtZW50Jyk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gcmVuZGVyRHJhZ2dhYmxlU2hpcChzaGlwKSB7XG4gIGNvbnN0IHNoaXBSZW5kZXIgPSBjcmVhdGVOZXdFbGVtZW50KFxuICAgICdkaXYnLFxuICAgIFsnZHJhZ2dhYmxlLXNoaXAnLCAnc2hpcC1yZW5kZXInLCBgJHtzaGlwLnR5cGVbMF19YF0sXG4gICAgbnVsbCxcbiAgICB7XG4gICAgICBkcmFnZ2FibGU6ICd0cnVlJyxcbiAgICAgICdkYXRhLW9yaWVudGF0aW9uJzogc2hpcC5vcmllbnRhdGlvbixcbiAgICAgICdkYXRhLWxlbmd0aCc6IGAke3NoaXAubGVuZ3RofWAsXG4gICAgICAnZGF0YS10eXBlJzogc2hpcC50eXBlLFxuICAgIH1cbiAgKTtcblxuICBpZiAoc2hpcC5vcmllbnRhdGlvbiA9PT0gJ3ZlcnRpY2FsJykge1xuICAgIHNoaXBSZW5kZXIuY2xhc3NMaXN0LmFkZCgncm90YXRlZCcpO1xuICB9XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBzaGlwLmxlbmd0aDsgaSsrKSB7XG4gICAgc2hpcFJlbmRlci5hcHBlbmRDaGlsZChjcmVhdGVOZXdFbGVtZW50KCdkaXYnLCBbJ3NoaXAtcGFydCddKSk7XG4gIH1cblxuICByZXR1cm4gc2hpcFJlbmRlcjtcbn1cblxuZnVuY3Rpb24gY2xlYXJEcmFnZ2FibGVTaGlwcygpIHtcbiAgY29uc3Qgc2hpcHMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcuZHJhZ2dhYmxlLXNoaXAnKTtcbiAgc2hpcHMuZm9yRWFjaCgoc2hpcCkgPT4ge1xuICAgIHNoaXAucGFyZW50RWxlbWVudC5yZW1vdmVDaGlsZChzaGlwKTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZUdhbWVib2FyZChnYW1lYm9hcmQsIHR5cGUsIGNvb3Jkcywgb3JpZW50YXRpb24pIHtcbiAgZ2FtZWJvYXJkLmNsZWFyU2hpcEZyb21Cb2FyZCh0eXBlKTtcbiAgZ2FtZWJvYXJkLmNsZWFyU2hpcEZyb21GbGVldCh0eXBlKTtcbiAgZ2FtZWJvYXJkLnBsYWNlU2hpcCh0eXBlLCBjb29yZHMsIG9yaWVudGF0aW9uKTtcbn1cbiIsImV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGNyZWF0ZVBsYXllcigpIHtcbiAgbGV0IGVuZW15Qm9hcmQ7XG5cbiAgbGV0IHByZXZpb3VzTW92ZXMgPSBbXTtcbiAgbGV0IHNoaXBIaXN0b3J5ID0gJyc7IC8vIGZvciBBSSBjb25kaXRpb25hbHNcblxuICBjb25zdCBhaU1vZGUgPSB7XG4gICAgY29sdW1uQXhpczogdHJ1ZSxcbiAgICBwb3NEaXJlY3Rpb246IHRydWUsXG4gIH07XG5cbiAgZnVuY3Rpb24gYXNzaWduRW5lbXlHYW1lYm9hcmQoZ2FtZWJvYXJkKSB7XG4gICAgZW5lbXlCb2FyZCA9IGdhbWVib2FyZDtcbiAgfVxuXG4gIGZ1bmN0aW9uIG1ha2VBdHRhY2soW3JvdywgY29sXSkge1xuICAgIHJldHVybiBlbmVteUJvYXJkLnJlY2VpdmVBdHRhY2soW3JvdywgY29sXSk7XG4gIH1cblxuICBmdW5jdGlvbiBhaVBsYXkoKSB7XG4gICAgbGV0IHRoaXNNb3ZlID0gcmFuZG9tTW92ZSgpO1xuXG4gICAgd2hpbGUgKHBsYXllZFByZXZpb3VzbHkodGhpc01vdmUpKSB7XG4gICAgICB0aGlzTW92ZSA9IHJhbmRvbU1vdmUoKTtcbiAgICB9XG5cbiAgICBwcmV2aW91c01vdmVzLnB1c2goeyBtb3ZlOiB0aGlzTW92ZSB9KTtcblxuICAgIHJldHVybiB0aGlzTW92ZTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGFpU21hcnRQbGF5KCkge1xuICAgIGxldCB0aGlzTW92ZTtcblxuICAgIC8vIEZpcnN0IG1vdmVcbiAgICBpZiAoIXByZXZpb3VzTW92ZXNbMF0pIHtcbiAgICAgIHRoaXNNb3ZlID0gcmFuZG9tTW92ZSgpO1xuICAgICAgLy8gQWxsIHN1YnNlcXVlbnRcbiAgICB9IGVsc2Uge1xuICAgICAgZXZhbHVhdGVMYXN0TW92ZSgpO1xuXG4gICAgICB0aGlzTW92ZSA9IHNtYXJ0TW92ZSgpO1xuXG4gICAgICB3aGlsZSAocGxheWVkUHJldmlvdXNseSh0aGlzTW92ZSkpIHtcbiAgICAgICAgaWYgKHNoaXBIaXN0b3J5KSB7XG4gICAgICAgICAgY29uc3QgcHJldmlvdXNSZXN1bHQgPSBxdWVyeVByZXZpb3VzUmVzdWx0KHRoaXNNb3ZlKTtcbiAgICAgICAgICAvLyBXaXRoaW4gdGhlIGRldGVybWluaXN0aWMgYXR0YWNrIHNlcXVlbmNlLCBhbnkgcHJldmlvdXNseSBwbGF5ZWQgbW92ZSBpcyByZWNvcmRlZCBhZ2FpbiBhcyBpZiBpdCBpcyBiZWluZyBwbGF5ZWQgbm93IHNvIHRoZSBzZXF1ZW5jZSBjYW4gY29udGludWVcbiAgICAgICAgICBwcmV2aW91c01vdmVzLnB1c2goeyBtb3ZlOiB0aGlzTW92ZSwgcmVzdWx0OiBwcmV2aW91c1Jlc3VsdCB9KTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzTW92ZSA9IHNtYXJ0TW92ZSgpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHByZXZpb3VzTW92ZXMucHVzaCh7IG1vdmU6IHRoaXNNb3ZlIH0pO1xuXG4gICAgcmV0dXJuIHRoaXNNb3ZlO1xuICB9XG5cbiAgZnVuY3Rpb24gcmFuZG9tTW92ZSgpIHtcbiAgICBjb25zdCBtb3ZlID0gW1xuICAgICAgTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogMTApLFxuICAgICAgTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogMTApLFxuICAgIF07XG4gICAgcmV0dXJuIG1vdmU7XG4gIH1cblxuICBmdW5jdGlvbiBwbGF5ZWRQcmV2aW91c2x5KHRoaXNNb3ZlKSB7XG4gICAgY29uc3QgY2hlY2tNb3ZlcyA9IHByZXZpb3VzTW92ZXMuZmlsdGVyKFxuICAgICAgKHR1cm4pID0+IHR1cm4ubW92ZVswXSA9PT0gdGhpc01vdmVbMF0gJiYgdHVybi5tb3ZlWzFdID09PSB0aGlzTW92ZVsxXVxuICAgICk7XG5cbiAgICBpZiAoY2hlY2tNb3Zlc1swXSkgcmV0dXJuIHRydWU7XG5cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBmdW5jdGlvbiBxdWVyeVByZXZpb3VzUmVzdWx0KHRoaXNNb3ZlKSB7XG4gICAgY29uc3QgY2hlY2tNb3ZlcyA9IHByZXZpb3VzTW92ZXMuZmlsdGVyKFxuICAgICAgKHR1cm4pID0+IHR1cm4ubW92ZVswXSA9PT0gdGhpc01vdmVbMF0gJiYgdHVybi5tb3ZlWzFdID09PSB0aGlzTW92ZVsxXVxuICAgICk7XG5cbiAgICByZXR1cm4gY2hlY2tNb3Zlc1swXS5yZXN1bHQ7XG4gIH1cblxuICBmdW5jdGlvbiBldmFsdWF0ZUxhc3RNb3ZlKCkge1xuICAgIGNvbnN0IGxhc3RNb3ZlID0gcHJldmlvdXNNb3Zlc1twcmV2aW91c01vdmVzLmxlbmd0aCAtIDFdLm1vdmU7XG5cbiAgICAvLyBSZXN1bHQgaXMgcmVhZCBvZmYgb2YgdGhlIGVuZW15IGdhbWVib2FyZFxuICAgIGNvbnN0IGZvdW5kUmVzdWx0ID0gZW5lbXlCb2FyZC5ib2FyZEFycmF5W2xhc3RNb3ZlWzBdXVtsYXN0TW92ZVsxXV07XG5cbiAgICAvLyBBbmQgc3RvcmVkIGluIHRoZSBwcmV2aW91c01vdmUgYXJyYXlcbiAgICBwcmV2aW91c01vdmVzW3ByZXZpb3VzTW92ZXMubGVuZ3RoIC0gMV0ucmVzdWx0ID0gZm91bmRSZXN1bHQ7XG4gIH1cblxuICBmdW5jdGlvbiBzbWFydE1vdmUoKSB7XG4gICAgbGV0IG5leHRNb3ZlO1xuICAgIGxldCBsYXN0TW92ZSA9IHByZXZpb3VzTW92ZXNbcHJldmlvdXNNb3Zlcy5sZW5ndGggLSAxXTtcblxuICAgIC8vIFJlc2V0IGFmdGVyIGEgc2hpcCBpcyBzdW5rXG4gICAgaWYgKGxhc3RNb3ZlLnJlc3VsdCA9PT0gJ3N1bmsnKSB7XG4gICAgICBzaGlwSGlzdG9yeSA9ICcnO1xuXG4gICAgICBhaU1vZGUuY29sdW1uQXhpcyA9IHRydWU7XG4gICAgICBhaU1vZGUucG9zRGlyZWN0aW9uID0gdHJ1ZTtcblxuICAgICAgcmV0dXJuIHJhbmRvbU1vdmUoKTtcbiAgICB9XG5cbiAgICAvLyBBdHRhY2sgc2VxdWVuY2UgaGlzdG9yeSBiZWdpbnMgd2l0aCB0aGUgZmlyc3QgaGl0IG9uIGEgbmV3IHNoaXBcbiAgICBpZiAoc2hpcEhpc3RvcnlbMF0gPT09ICdoJyB8fCBsYXN0TW92ZS5yZXN1bHQgPT09ICdoaXQnKSB7XG4gICAgICBzaGlwSGlzdG9yeSA9IHNoaXBIaXN0b3J5ICsgbGFzdE1vdmUucmVzdWx0WzBdO1xuICAgIH1cblxuICAgIC8vIElmIG5vIGhpc3RvcnksIGEgc2hpcCBoYXMgbm90IGJlZW4gZGlzY292ZXJlZCB5ZXRcbiAgICBpZiAoIXNoaXBIaXN0b3J5KSByZXR1cm4gcmFuZG9tTW92ZSgpO1xuXG5cbiAgICBsZXQgW3NlY29uZExhc3QsIHRoaXJkTGFzdCwgZm91cnRoTGFzdCwgZmlmdGhMYXN0XSA9XG4gICAgICBkZWZpbmVQcmV2aW91c01vdmVWYXJpYWJsZXMoKTtcblxuICAgIC8qIENvbmRpdGlvbmFsIGxvZ2ljIGZvciBEZXRlcm1pbmlzdGljIEFJICovXG4gICAgLy8gU2Vjb25kIHBhcmFtZXRlciBpbiB0aGUgZm9sbG93aW5nIGZ1bmN0aW9ucyBpcyB0aGUgcHJldmlvdXMgbW92ZSBpbiByZWZlcmVuY2UgdG8gd2hpY2ggdGhlIG5leHQgbW92ZSBzaG91bGQgYmUgbWFkZVxuXG4gICAgaWYgKGxhc3RNb3ZlLnJlc3VsdCA9PT0gJ2hpdCcpIHtcbiAgICAgIG5leHRNb3ZlID0gY29udGludWVTYW1lUGF0aChsYXN0TW92ZSk7XG5cbiAgICAgIC8vIElmIGhpdHRpbmcgYSBib3VuZGFyeSwgY2FsY3VsYXRlIGNvcnJlY3QgbW92ZSB0byBiYWNrdHJhY2sgZnJvbVxuICAgICAgaWYgKG91dE9mQm91bmRzKG5leHRNb3ZlKSkge1xuICAgICAgICBsZXQgcmVmZXJlbmNlTW92ZTtcbiAgICAgICAgc3dpdGNoIChzaGlwSGlzdG9yeSkge1xuICAgICAgICAgIGNhc2UgJ2htaGgnOlxuICAgICAgICAgICAgcmVmZXJlbmNlTW92ZSA9IGZvdXJ0aExhc3QubW92ZTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgJ2htaCc6XG4gICAgICAgICAgICByZWZlcmVuY2VNb3ZlID0gdGhpcmRMYXN0Lm1vdmU7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgcmVmZXJlbmNlTW92ZSA9IGxhc3RNb3ZlLm1vdmU7XG4gICAgICAgIH1cbiAgICAgICAgc3dpdGNoRGlyZWN0aW9uQXRFZGdlcyhuZXh0TW92ZSk7XG4gICAgICAgIG5leHRNb3ZlID0gbW92ZUFjY29yZGluZ1RvTW9kZShyZWZlcmVuY2VNb3ZlKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIG5leHRNb3ZlO1xuICAgIH1cblxuICAgIGlmIChmaWZ0aExhc3QgJiYgZmlmdGhMYXN0LnJlc3VsdCA9PT0gJ2hpdCcpIHtcbiAgICAgIHJldHVybiBrZWVwQXhpc1N3aXRjaERpcmVjdGlvbihuZXh0TW92ZSwgZmlmdGhMYXN0KTtcbiAgICB9XG4gICAgaWYgKGZvdXJ0aExhc3QgJiYgZm91cnRoTGFzdC5yZXN1bHQgPT09ICdoaXQnKSB7XG4gICAgICByZXR1cm4ga2VlcEF4aXNTd2l0Y2hEaXJlY3Rpb24obmV4dE1vdmUsIGZvdXJ0aExhc3QpO1xuICAgIH1cbiAgICBpZiAodGhpcmRMYXN0ICYmIHNoaXBIaXN0b3J5ID09PSAnaG1tJykge1xuICAgICAgcmV0dXJuIHN3aXRjaEF4aXNPckRpcmVjdGlvbihuZXh0TW92ZSwgdGhpcmRMYXN0KTtcbiAgICB9XG4gICAgaWYgKHNlY29uZExhc3QgJiYgc2Vjb25kTGFzdC5yZXN1bHQgPT09ICdoaXQnKSB7XG4gICAgICByZXR1cm4gc3dpdGNoQXhpc09yRGlyZWN0aW9uKG5leHRNb3ZlLCBzZWNvbmRMYXN0KTtcbiAgICB9XG5cbiAgICAvLyBBIGZhaWxzYWZlIHJlc2V0IGZvciBlbmNvdW50ZXJpbmcgYSBjb25kaXRpb24gbm90IGxpc3RlZCBhYm92ZSAoc2hvdWxkIG5vdCBiZSBjYWxsZWQpXG4gICAgY29uc29sZS5sb2coJ05vbmUgb2YgdGhlIGFib3ZlIGNvbmRpdGlvbnMgYXBwbHknKTtcbiAgICBzaGlwSGlzdG9yeSA9ICcnO1xuICAgIGFpTW9kZS5jb2x1bW5BeGlzID0gdHJ1ZTtcbiAgICBhaU1vZGUucG9zRGlyZWN0aW9uID0gdHJ1ZTtcblxuICAgIHJldHVybiByYW5kb21Nb3ZlKCk7XG4gIH1cblxuICAvKiBzbWFydE1vdmUgSGVscGVyIEZ1bmN0aW9ucyAqL1xuICBmdW5jdGlvbiBkZWZpbmVQcmV2aW91c01vdmVWYXJpYWJsZXMoKSB7XG4gICAgbGV0IHNlY29uZExhc3Q7XG4gICAgbGV0IHRoaXJkTGFzdDtcbiAgICBsZXQgZm91cnRoTGFzdDtcbiAgICBsZXQgZmlmdGhMYXN0O1xuXG4gICAgaWYgKHNoaXBIaXN0b3J5Lmxlbmd0aCA+PSA1KSB7XG4gICAgICBmaWZ0aExhc3QgPSBwcmV2aW91c01vdmVzW3ByZXZpb3VzTW92ZXMubGVuZ3RoIC0gNV07XG4gICAgfVxuICAgIGlmIChzaGlwSGlzdG9yeS5sZW5ndGggPj0gNCkge1xuICAgICAgZm91cnRoTGFzdCA9IHByZXZpb3VzTW92ZXNbcHJldmlvdXNNb3Zlcy5sZW5ndGggLSA0XTtcbiAgICB9XG4gICAgaWYgKHNoaXBIaXN0b3J5Lmxlbmd0aCA+PSAzKSB7XG4gICAgICB0aGlyZExhc3QgPSBwcmV2aW91c01vdmVzW3ByZXZpb3VzTW92ZXMubGVuZ3RoIC0gM107XG4gICAgfVxuICAgIGlmIChzaGlwSGlzdG9yeS5sZW5ndGggPj0gMikge1xuICAgICAgc2Vjb25kTGFzdCA9IHByZXZpb3VzTW92ZXNbcHJldmlvdXNNb3Zlcy5sZW5ndGggLSAyXTtcbiAgICB9XG5cbiAgICByZXR1cm4gW3NlY29uZExhc3QsIHRoaXJkTGFzdCwgZm91cnRoTGFzdCwgZmlmdGhMYXN0XTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGNvbnRpbnVlU2FtZVBhdGgobGFzdE1vdmUpIHtcbiAgICByZXR1cm4gbW92ZUFjY29yZGluZ1RvTW9kZShsYXN0TW92ZS5tb3ZlKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGtlZXBBeGlzU3dpdGNoRGlyZWN0aW9uKG5leHRNb3ZlLCByZWZlcmVuY2VNb3ZlKSB7XG4gICAgYWlNb2RlLnBvc0RpcmVjdGlvbiA9ICFhaU1vZGUucG9zRGlyZWN0aW9uO1xuICAgIG5leHRNb3ZlID0gbW92ZUFjY29yZGluZ1RvTW9kZShyZWZlcmVuY2VNb3ZlLm1vdmUpO1xuXG4gICAgaWYgKG91dE9mQm91bmRzKG5leHRNb3ZlKSkge1xuICAgICAgc3dpdGNoRGlyZWN0aW9uQXRFZGdlcyhuZXh0TW92ZSk7XG4gICAgICBuZXh0TW92ZSA9IG1vdmVBY2NvcmRpbmdUb01vZGUocmVmZXJlbmNlTW92ZS5tb3ZlKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbmV4dE1vdmU7XG4gIH1cblxuICBmdW5jdGlvbiBzd2l0Y2hBeGlzT3JEaXJlY3Rpb24obmV4dE1vdmUsIHJlZmVyZW5jZU1vdmUpIHtcbiAgICBpZiAoYWlNb2RlLmNvbHVtbkF4aXMgJiYgYWlNb2RlLnBvc0RpcmVjdGlvbikge1xuICAgICAgLy8gaW5pdGlhbCBzd2l0Y2ggdXBvbiBmaXJzdCBtaXNzIHNob3VsZCBiZSBvZiBkaXJlY3Rpb25cbiAgICAgIGFpTW9kZS5wb3NEaXJlY3Rpb24gPSAhYWlNb2RlLnBvc0RpcmVjdGlvbjtcbiAgICB9IGVsc2UgaWYgKGFpTW9kZS5jb2x1bW5BeGlzICYmICFhaU1vZGUucG9zRGlyZWN0aW9uKSB7XG4gICAgICAvLyBpZiBkaXJlY3Rpb24gaXMgYWxyZWFkeSBzd2l0Y2hlZCByb3cgYXhpcyBzaG91bGQgYmUgc3RhcnRlZFxuICAgICAgYWlNb2RlLmNvbHVtbkF4aXMgPSAhYWlNb2RlLmNvbHVtbkF4aXM7XG4gICAgICAvLyBJZiBzaGlwIHRoZW4gbWlzc2VkIHRvIHNpZGUsIHN3aXRjaCBkaXJlY3Rpb25cbiAgICB9IGVsc2UgaWYgKCFhaU1vZGUuY29sdW1uQXhpcyAmJiAhYWlNb2RlLnBvc0RpcmVjdGlvbikge1xuICAgICAgIWFpTW9kZS5wb3NEaXJlY3Rpb247XG4gICAgfVxuXG4gICAgbmV4dE1vdmUgPSBtb3ZlQWNjb3JkaW5nVG9Nb2RlKHJlZmVyZW5jZU1vdmUubW92ZSk7XG5cbiAgICBpZiAob3V0T2ZCb3VuZHMobmV4dE1vdmUpKSB7XG4gICAgICBzd2l0Y2hEaXJlY3Rpb25BdEVkZ2VzKG5leHRNb3ZlKTtcbiAgICAgIG5leHRNb3ZlID0gbW92ZUFjY29yZGluZ1RvTW9kZShyZWZlcmVuY2VNb3ZlLm1vdmUpO1xuICAgIH1cblxuICAgIHJldHVybiBuZXh0TW92ZTtcbiAgfVxuXG4gIGZ1bmN0aW9uIG1vdmVBY2NvcmRpbmdUb01vZGUoW3JvdywgY29sdW1uXSkge1xuICAgIGlmIChhaU1vZGUuY29sdW1uQXhpcyAmJiBhaU1vZGUucG9zRGlyZWN0aW9uKSB7XG4gICAgICByZXR1cm4gW3JvdyArIDEsIGNvbHVtbl07XG4gICAgfSBlbHNlIGlmIChhaU1vZGUuY29sdW1uQXhpcykge1xuICAgICAgcmV0dXJuIFtyb3cgLSAxLCBjb2x1bW5dO1xuICAgIH0gZWxzZSBpZiAoYWlNb2RlLnBvc0RpcmVjdGlvbikge1xuICAgICAgcmV0dXJuIFtyb3csIGNvbHVtbiArIDFdO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gW3JvdywgY29sdW1uIC0gMV07XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gb3V0T2ZCb3VuZHMoW3JvdywgY29sdW1uXSkge1xuICAgIGlmIChyb3cgPiA5IHx8IHJvdyA8IDAgfHwgY29sdW1uID4gOSB8fCBjb2x1bW4gPCAwKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBzd2l0Y2hEaXJlY3Rpb25BdEVkZ2VzKFtyb3csIGNvbHVtbl0pIHtcbiAgICBpZiAocm93ID4gOSAmJiBhaU1vZGUuY29sdW1uQXhpcyA9PT0gdHJ1ZSkge1xuICAgICAgYWlNb2RlLnBvc0RpcmVjdGlvbiA9IGZhbHNlO1xuICAgIH0gZWxzZSBpZiAocm93IDwgMCAmJiBjb2x1bW4gPT0gMCkge1xuICAgICAgLy8gT05MWSBoYXBwZW5zIHdpdGggaG9yaXpvbnRhbCBzaGlwIGluIHRvcCBsZWZ0IGNvcm5lclxuICAgICAgYWlNb2RlLmNvbHVtbkF4aXMgPSBmYWxzZTtcbiAgICAgIGFpTW9kZS5wb3NEaXJlY3Rpb24gPSB0cnVlO1xuICAgIH1lbHNlIGlmIChyb3cgPCAwKSB7XG4gICAgICAvLyBpZiBkaXJlY3Rpb24gaGFzIGFscmVhZHkgYmVlbiBzd2l0Y2hlZFxuICAgICAgYWlNb2RlLmNvbHVtbkF4aXMgPSBmYWxzZTtcbiAgICB9IGVsc2UgaWYgKGNvbHVtbiA8IDApIHtcbiAgICAgIGFpTW9kZS5wb3NEaXJlY3Rpb24gPSB0cnVlO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiB7XG4gICAgbWFrZUF0dGFjayxcbiAgICBhc3NpZ25FbmVteUdhbWVib2FyZCxcbiAgICBhaVBsYXksXG4gICAgYWlTbWFydFBsYXksXG4gICAgLy8gRXZlcnl0aGluZyBiZWxvdyBpcyBpbnRlcm5hbCBhbmQgd2FzIHVzZWQgb25seSBmb3IgdGVzdGluZ1xuICAgIGdldCBlbmVteUJvYXJkKCkge1xuICAgICAgcmV0dXJuIGVuZW15Qm9hcmQ7XG4gICAgfSxcbiAgICBnZXQgcHJldmlvdXNNb3ZlcygpIHtcbiAgICAgIHJldHVybiBbLi4ucHJldmlvdXNNb3Zlc107XG4gICAgfSxcbiAgICAvLyBPbmx5IGZvciB0ZXN0aW5nIHdvdWxkIHRoZXNlIGV2ZXIgYmUgc2V0XG4gICAgc2V0IHByZXZpb3VzTW92ZXMoaGlzdG9yeUFycmF5KSB7XG4gICAgICBwcmV2aW91c01vdmVzID0gaGlzdG9yeUFycmF5O1xuICAgIH0sXG4gICAgYWlNb2RlLFxuICAgIHNldCBzaGlwSGlzdG9yeShzdHJpbmcpIHtcbiAgICAgIHNoaXBIaXN0b3J5ID0gc3RyaW5nO1xuICAgIH0sXG4gIH07XG59XG4iLCJleHBvcnQgZnVuY3Rpb24gY3JlYXRlU2hpcChsZW5ndGgpIHtcbiAgICBjb25zdCBzaGlwQXJyYXkgPSBBcnJheShsZW5ndGgpLmZpbGwoMCk7XG5cbiAgICBmdW5jdGlvbiBoaXQocG9zaXRpb24pIHtcbiAgICAgICAgLyogMCAtIG5vdCBoaXQ7IDEgLSBoaXQgKi9cbiAgICAgICAgc2hpcEFycmF5W3Bvc2l0aW9uIC0gMV0gPSAxO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBpc1N1bmsoKSB7XG4gICAgICAgIGNvbnN0IGhpdHMgPSBzaGlwQXJyYXkuZmlsdGVyKHBvc2l0aW9uID0+XG4gICAgICAgICAgICBwb3NpdGlvbiA9PSAxKTtcbiAgICAgICAgcmV0dXJuIGhpdHMubGVuZ3RoID09IGxlbmd0aFxuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICAgIGhpdCxcbiAgICAgICAgZ2V0IHNoaXBBcnJheSgpe1xuICAgICAgICAgICAgcmV0dXJuIFsuLi5zaGlwQXJyYXldXG4gICAgICAgIH0sXG4gICAgICAgIGdldCBsZW5ndGgoKSB7XG4gICAgICAgICAgICByZXR1cm4gbGVuZ3RoXG4gICAgICAgIH0sXG4gICAgICAgIGlzU3Vua1xuICAgIH1cbn1cblxuIiwiaW1wb3J0IHsgY3JlYXRlU2hpcCB9IGZyb20gJy4vc2hpcHMnO1xuaW1wb3J0IHsgcHVibGlzaCB9IGZyb20gJy4vcHVic3ViJztcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gY3JlYXRlR2FtZWJvYXJkKCkge1xuICBsZXQgYm9hcmRBcnJheSA9IEFycmF5KDEwKVxuICAgIC5maWxsKG51bGwpXG4gICAgLm1hcCgoeCkgPT4gQXJyYXkoMTApLmZpbGwobnVsbCkpO1xuXG4gIGxldCBmbGVldCA9IFtdO1xuXG4gIC8qIEZyb20gV2lraXBlZGlhICovXG4gIGNvbnN0IHNoaXBMZW5ndGhzID0gWzUsIDQsIDMsIDMsIDJdO1xuICBjb25zdCBzaGlwVHlwZXMgPSBbXG4gICAgJ2NhcnJpZXInLFxuICAgICdiYXR0bGVzaGlwJyxcbiAgICAnZGVzdHJveWVyJyxcbiAgICAnc3VibWFyaW5lJyxcbiAgICAncGF0cm9sIGJvYXQnLFxuICBdO1xuXG4gIGZ1bmN0aW9uIHBsYWNlU2hpcCh0eXBlLCBbcm93LCBjb2x1bW5dLCBvcmllbnRhdGlvbikge1xuICAgIGNvbnN0IHNoaXBJbmRleCA9IHNoaXBUeXBlcy5pbmRleE9mKHR5cGUpO1xuICAgIGNvbnN0IHNoaXBMZW5ndGggPSBzaGlwTGVuZ3Roc1tzaGlwSW5kZXhdO1xuXG4gICAgLyogVGVzdCBsZWdhbGl0eSBvZiBhbGwgcG9zaXRpb25zIGJlZm9yZSBtYXJraW5nIGFueSAqL1xuICAgIGlzU2hpcExlZ2FsKHR5cGUsIHNoaXBMZW5ndGgsIG9yaWVudGF0aW9uLCBbcm93LCBjb2x1bW5dKTtcblxuICAgIC8qIE1hcmsgYm9hcmQgYXJyYXkgKi9cbiAgICBmb3IgKGxldCBpID0gMTsgaSA8PSBzaGlwTGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IHNoaXBNYXJrZXIgPSB0eXBlWzBdICsgaTtcblxuICAgICAgaWYgKGkgPT09IDEpIHtcbiAgICAgICAgYm9hcmRBcnJheVtyb3ddW2NvbHVtbl0gPSBzaGlwTWFya2VyO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgaWYgKG9yaWVudGF0aW9uID09PSAnaG9yaXpvbnRhbCcpIHtcbiAgICAgICAgYm9hcmRBcnJheVtyb3ddW2NvbHVtbiArIChpIC0gMSldID0gc2hpcE1hcmtlcjtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGJvYXJkQXJyYXlbcm93ICsgKGkgLSAxKV1bY29sdW1uXSA9IHNoaXBNYXJrZXI7XG4gICAgICB9XG4gICAgfVxuXG4gICAgbGV0IGNyZWF0ZWRTaGlwID0gY3JlYXRlU2hpcChzaGlwTGVuZ3RoKTtcbiAgICBjcmVhdGVkU2hpcC50eXBlID0gdHlwZTtcbiAgICBjcmVhdGVkU2hpcC5vcmllbnRhdGlvbiA9IG9yaWVudGF0aW9uOyAvLyBmb3IgZHJhZyBhbmQgZHJvcFxuXG4gICAgZmxlZXQucHVzaChjcmVhdGVkU2hpcCk7XG4gIH1cblxuICBmdW5jdGlvbiBpc1NoaXBMZWdhbCh0eXBlLCBzaGlwTGVuZ3RoLCBvcmllbnRhdGlvbiwgW3JvdywgY29sdW1uXSkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc2hpcExlbmd0aDsgaSsrKSB7XG4gICAgICBsZXQgdGVzdFNxdWFyZTtcblxuICAgICAgaWYgKG9yaWVudGF0aW9uID09PSAnaG9yaXpvbnRhbCcpIHtcbiAgICAgICAgdGVzdFNxdWFyZSA9IFtyb3csIGNvbHVtbiArIGldO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGVzdFNxdWFyZSA9IFtyb3cgKyBpLCBjb2x1bW5dO1xuICAgICAgfVxuXG4gICAgICBpZiAodGVzdFNxdWFyZVswXSA+IDkgfHwgdGVzdFNxdWFyZVsxXSA+IDkpIHtcbiAgICAgICAgdGhyb3cgJ1NoaXAgb3V0c2lkZSBib3VuZHMgb2YgYm9hcmQnO1xuICAgICAgfVxuICAgICAgaWYgKGFkamFjZW50U2hpcCh0ZXN0U3F1YXJlLCB0eXBlKSkge1xuICAgICAgICB0aHJvdyAnU2hpcCBhZGphY2VudCB0byBhbm90aGVyIHNoaXAnO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHBsYWNlQWxsU2hpcHNSYW5kb21seSgpIHtcbiAgICBmb3IgKGNvbnN0IHNoaXAgb2Ygc2hpcFR5cGVzKSB7XG4gICAgICBhdHRlbXB0UGxhY2VtZW50KHNoaXApO1xuICAgIH1cbiAgfVxuXG4gIGNvbnN0IG9yaWVudGF0aW9ucyA9IFsnaG9yaXpvbnRhbCcsICd2ZXJ0aWNhbCddO1xuXG4gIGZ1bmN0aW9uIHJhbmRvbVBvc2l0aW9uKCkge1xuICAgIHJldHVybiBbTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogMTApLCBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAxMCldO1xuICB9XG5cbiAgZnVuY3Rpb24gYXR0ZW1wdFBsYWNlbWVudChzaGlwKSB7XG4gICAgbGV0IHBvc2l0aW9uID0gcmFuZG9tUG9zaXRpb24oKTtcbiAgICBsZXQgb3JpZW50YXRpb24gPSBvcmllbnRhdGlvbnNbTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogMildO1xuICAgIHRyeSB7XG4gICAgICBwbGFjZVNoaXAoc2hpcCwgcG9zaXRpb24sIG9yaWVudGF0aW9uKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgYXR0ZW1wdFBsYWNlbWVudChzaGlwKTtcbiAgICB9XG4gIH1cblxuICAvKiBIZWxwZXIgZnVuY3Rpb25zIGZvciB0ZXN0aW5nIHNoaXAgbGVnYWxpdHkgKi9cbiAgZnVuY3Rpb24gYWRqYWNlbnRTaGlwKFtyb3csIGNvbF0sIHNoaXBNYXJrZXIpIHtcbiAgICBjb25zdCBib3VuZGluZ1NxdWFyZXMgPSBkZWZpbmVCb3VuZGluZ0JveChbcm93LCBjb2xdKTtcbiAgICBmb3IgKGNvbnN0IFtzcVJvdywgc3FDb2xdIG9mIGJvdW5kaW5nU3F1YXJlcykge1xuICAgICAgbGV0IHRlc3QgPSBib2FyZEFycmF5W3NxUm93XVtzcUNvbF07XG4gICAgICBpZiAodGVzdCAmJiB0ZXN0WzBdICE9PSBzaGlwTWFya2VyWzBdKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBmdW5jdGlvbiBkZWZpbmVCb3VuZGluZ0JveChbcm93LCBjb2xdKSB7XG4gICAgY29uc3Qgc3F1YXJlcyA9IFtdO1xuICAgIC8vIENsb2Nrd2lzZSBjaXJjbGUgZnJvbSB0b3AgbGVmdFxuICAgIHNxdWFyZXMucHVzaChcbiAgICAgIFtyb3cgLSAxLCBjb2wgLSAxXSxcbiAgICAgIFtyb3cgLSAxLCBjb2xdLFxuICAgICAgW3JvdyAtIDEsIGNvbCArIDFdLFxuICAgICAgW3JvdywgY29sICsgMV0sXG4gICAgICBbcm93ICsgMSwgY29sICsgMV0sXG4gICAgICBbcm93ICsgMSwgY29sXSxcbiAgICAgIFtyb3cgKyAxLCBjb2wgLSAxXSxcbiAgICAgIFtyb3csIGNvbCAtIDFdXG4gICAgKTtcblxuICAgIGNvbnN0IHdpdGhpbkJvYXJkID0gc3F1YXJlcy5maWx0ZXIoKFtzcVJvdywgc3FDb2xdKSA9PiB7XG4gICAgICByZXR1cm4gc3FSb3cgPiAtMSAmJiBzcVJvdyA8IDEwICYmIHNxQ29sID4gLTEgJiYgc3FDb2wgPCAxMDtcbiAgICB9KTtcblxuICAgIHJldHVybiB3aXRoaW5Cb2FyZDtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlY2VpdmVBdHRhY2soW3JvdywgY29sdW1uXSkge1xuICAgIGNvbnN0IHZhbHVlQXRQb3NpdGlvbiA9IGJvYXJkQXJyYXlbcm93XVtjb2x1bW5dO1xuXG4gICAgaWYgKCF2YWx1ZUF0UG9zaXRpb24pIHtcbiAgICAgIGJvYXJkQXJyYXlbcm93XVtjb2x1bW5dID0gJ21pc3MnO1xuICAgICAgcHVibGlzaCgnbWlzcycsIFtyb3csIGNvbHVtbl0pO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBoaXRTaGlwID0gZmxlZXQuZmlsdGVyKFxuICAgICAgKHNoaXApID0+IHNoaXAudHlwZVswXSA9PT0gdmFsdWVBdFBvc2l0aW9uWzBdXG4gICAgKVswXTtcbiAgICBoaXRTaGlwLmhpdCh2YWx1ZUF0UG9zaXRpb25bMV0pO1xuICAgIGJvYXJkQXJyYXlbcm93XVtjb2x1bW5dID0gJ2hpdCc7XG4gICAgcHVibGlzaCgnaGl0JywgW3JvdywgY29sdW1uXSk7XG5cbiAgICBpZiAoaGl0U2hpcC5pc1N1bmsoKSkge1xuICAgICAgcHVibGlzaCgnc2hpcFN1bmsnLCBbaGl0U2hpcCwgW3JvdywgY29sdW1uXV0pO1xuICAgICAgYm9hcmRBcnJheVtyb3ddW2NvbHVtbl0gPSAnc3Vuayc7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gaXNGbGVldFN1bmsoKSB7XG4gICAgY29uc3Qgc3Vua1NoaXBzID0gZmxlZXQuZmlsdGVyKChzaGlwKSA9PiBzaGlwLmlzU3VuaygpID09PSB0cnVlKTtcbiAgICByZXR1cm4gc3Vua1NoaXBzLmxlbmd0aCA9PT0gZmxlZXQubGVuZ3RoO1xuICB9XG5cbiAgZnVuY3Rpb24gY2xlYXJTaGlwRnJvbUJvYXJkKHR5cGUpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IDEwOyBpKyspIHtcbiAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgMTA7IGorKykge1xuICAgICAgICBpZiAoYm9hcmRBcnJheVtpXVtqXSAmJiBib2FyZEFycmF5W2ldW2pdWzBdID09PSB0eXBlWzBdKSB7XG4gICAgICAgICAgYm9hcmRBcnJheVtpXVtqXSA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBjbGVhclNoaXBGcm9tRmxlZXQodHlwZSkge1xuICAgIGZsZWV0ID0gZmxlZXQuZmlsdGVyKCh4KSA9PiB4LnR5cGUgIT09IHR5cGUpO1xuICB9XG5cbiAgZnVuY3Rpb24gY2xlYXJCb2FyZCgpIHtcbiAgICBmbGVldCA9IFtdO1xuICAgIGJvYXJkQXJyYXkgPSBBcnJheSgxMClcbiAgICAgIC5maWxsKG51bGwpXG4gICAgICAubWFwKCh4KSA9PiBBcnJheSgxMCkuZmlsbChudWxsKSk7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIGdldCBib2FyZEFycmF5KCkge1xuICAgICAgLyogMkQgYXJyYXkgc28gZWFjaCBlbGVtZW50IG5lZWRzIGRlc3RydWN0dXJpbmcgKi9cbiAgICAgIHJldHVybiBib2FyZEFycmF5Lm1hcCgoeCkgPT4gWy4uLnhdKTtcbiAgICB9LFxuICAgIHJlY2VpdmVBdHRhY2ssXG4gICAgcGxhY2VTaGlwLFxuICAgIHBsYWNlQWxsU2hpcHNSYW5kb21seSxcbiAgICBnZXQgZmxlZXQoKSB7XG4gICAgICByZXR1cm4gWy4uLmZsZWV0XTtcbiAgICB9LFxuICAgIGlzRmxlZXRTdW5rLFxuICAgIC8vIFRoZSBmb2xsb3dpbmcgaW1wbGVtZW50ZWQgZm9yIHVzZSBieSB0aGUgZHJhZyBhbmQgZHJvcCBzaGlwIHBsYWNlbWVudC4gQWxzbyBjaGFuZ2VkIGJvdGggYm9hcmQgYW5kIGZsZWV0IGFycmF5cyB0byBsZXQgaW5zdGVhZCBvZiBjb25zdCBmb3IgdGhpc1xuICAgIGlzU2hpcExlZ2FsLFxuICAgIGNsZWFyU2hpcEZyb21Cb2FyZCxcbiAgICBjbGVhclNoaXBGcm9tRmxlZXQsXG4gICAgY2xlYXJCb2FyZCxcbiAgfTtcbn1cbiIsImltcG9ydCB7XG4gIGNyZWF0ZUNvbnRhaW5lcnMsXG4gIG1ha2VBbm5vdW5jZW1lbnRzLFxuICBjbGlja0xpc3RlbmVyLFxuICByZW5kZXJCb2FyZCxcbiAgcmVuZGVyVHVyblNjcmVlbixcbiAgcmVuZGVyU3RhcnRTY3JlZW4sXG4gIGNsZWFyQm9hcmRzLFxuICBzd2FwU3Vua0ZsZWV0c1xufSBmcm9tICcuL2RvbSc7XG5pbXBvcnQgeyByZW5kZXJTaGlwU2NyZWVuIH0gZnJvbSAnLi9kcmFnRHJvcCc7XG5pbXBvcnQgY3JlYXRlUGxheWVyIGZyb20gJy4vcGxheWVyJztcbmltcG9ydCBjcmVhdGVHYW1lYm9hcmQgZnJvbSAnLi9nYW1lYm9hcmQnO1xuaW1wb3J0IHsgc3Vic2NyaWJlLCBwdWJsaXNoLCB1bnN1YnNjcmliZSB9IGZyb20gJy4vcHVic3ViJztcblxuZXhwb3J0IGZ1bmN0aW9uIG5ld0dhbWUoKSB7XG4gIGNyZWF0ZUNvbnRhaW5lcnMoKTtcblxuICBjb25zdCBwbGF5ZXIxID0gY3JlYXRlUGxheWVyKCk7XG4gIGNvbnN0IHBsYXllcjIgPSBjcmVhdGVQbGF5ZXIoKTtcblxuICBjb25zdCBib2FyZDEgPSBjcmVhdGVHYW1lYm9hcmQoKTtcbiAgY29uc3QgYm9hcmQyID0gY3JlYXRlR2FtZWJvYXJkKCk7XG5cbiAgcGxheWVyMS5hc3NpZ25FbmVteUdhbWVib2FyZChib2FyZDIpO1xuICBwbGF5ZXIyLmFzc2lnbkVuZW15R2FtZWJvYXJkKGJvYXJkMSk7XG5cbiAgYm9hcmQxLnBsYWNlQWxsU2hpcHNSYW5kb21seSgpO1xuICBib2FyZDIucGxhY2VBbGxTaGlwc1JhbmRvbWx5KCk7XG5cbiAgLy8gRXZlbnQgbGlzdGVuZXJzIHRvIHRyYWNrIGdhbWUgZXZlbnRzXG4gIG1ha2VBbm5vdW5jZW1lbnRzKCk7XG5cbiAgLy8gRXZlbnQgbGlzdGVuZXJzIHRvIHNlbGVjdCB0eXBlIG9mIGdhbWVcbiAgY29uc3QgW3NpbmdsZVBsYXllckJ1dHRvbiwgdHdvUGxheWVyQnV0dG9uXSA9IHJlbmRlclN0YXJ0U2NyZWVuKCk7XG5cbiAgc2luZ2xlUGxheWVyQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKGV2KSA9PiB7XG4gICAgZXYucHJldmVudERlZmF1bHQoKTtcbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuc3RhcnQtc2NyZWVuJykuc3R5bGUuZGlzcGxheSA9ICdub25lJztcblxuICAgIHBsYXllclZzQUlMb29wKHsgcGxheWVyMSwgcGxheWVyMiwgYm9hcmQxLCBib2FyZDIgfSk7XG4gIH0pO1xuXG4gIHR3b1BsYXllckJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIChldikgPT4ge1xuICAgIGV2LnByZXZlbnREZWZhdWx0KCk7XG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLnN0YXJ0LXNjcmVlbicpLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG5cbiAgICB0d29QbGF5ZXJHYW1lTG9vcCh7IHBsYXllcjEsIHBsYXllcjIsIGJvYXJkMSwgYm9hcmQyIH0pO1xuICB9KTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gcGxheWVyVnNBSUxvb3AoeyBwbGF5ZXIxLCBwbGF5ZXIyLCBib2FyZDEsIGJvYXJkMiB9KSB7XG4gIGF3YWl0IHJlbmRlclNoaXBTY3JlZW4oYm9hcmQxKTtcbiAgcmVuZGVyQm9hcmQoYm9hcmQxLmJvYXJkQXJyYXksICdvd24nKTtcbiAgcmVuZGVyQm9hcmQoYm9hcmQyLmJvYXJkQXJyYXksICdlbmVteScpO1xuXG4gIC8vIE1ha2UgYm9hcmQgY2xpY2thYmxlIHRvIGh1bWFuIHBsYXllclxuICBjbGlja0xpc3RlbmVyKHBsYXllcjEsICdlbmVteScpO1xuXG4gIHN1YnNjcmliZSgnc3F1YXJlQXR0YWNrZWQnLCBodW1hbkF0dGFjayk7XG5cbiAgZnVuY3Rpb24gaHVtYW5BdHRhY2soW3BsYXllciwgdGFyZ2V0XSkge1xuICAgIHB1Ymxpc2goJ3RhcmdldENoYW5nZScsICdlbmVteScpO1xuXG4gICAgcGxheWVyLm1ha2VBdHRhY2soW3RhcmdldFswXSwgdGFyZ2V0WzFdXSk7XG5cbiAgICByZW5kZXJCb2FyZChib2FyZDIuYm9hcmRBcnJheSwgJ2VuZW15Jyk7XG5cbiAgICBpZiAoYm9hcmQyLmlzRmxlZXRTdW5rKCkpIHtcbiAgICAgIHB1Ymxpc2goJ2ZsZWV0U3VuaycsIFsnQ29tcHV0ZXInLCAnSHVtYW4nXSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICBwdWJsaXNoKCd0YXJnZXRDaGFuZ2UnLCAnb3duJyk7XG5cbiAgICAgIHBsYXllcjIubWFrZUF0dGFjayhwbGF5ZXIyLmFpU21hcnRQbGF5KCkpO1xuICAgICAgcmVuZGVyQm9hcmQoYm9hcmQxLmJvYXJkQXJyYXksICdvd24nKTtcblxuICAgICAgaWYgKGJvYXJkMS5pc0ZsZWV0U3VuaygpKSB7XG4gICAgICAgIHB1Ymxpc2goJ2ZsZWV0U3VuaycsIFsnSHVtYW4nLCAnQ29tcHV0ZXInXSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9LCAxMDAwKTtcbiAgfVxufVxuXG5hc3luYyBmdW5jdGlvbiB0d29QbGF5ZXJHYW1lTG9vcCh7IHBsYXllcjEsIHBsYXllcjIsIGJvYXJkMSwgYm9hcmQyIH0pIHtcbiAgYXdhaXQgcmVuZGVyVHVyblNjcmVlbignUExBWUVSIDEnKTtcbiAgYXdhaXQgcmVuZGVyU2hpcFNjcmVlbihib2FyZDEpO1xuXG4gIGF3YWl0IHJlbmRlclR1cm5TY3JlZW4oJ1BMQVlFUiAyJyk7XG4gIGF3YWl0IHJlbmRlclNoaXBTY3JlZW4oYm9hcmQyKTtcblxuICBhd2FpdCByZW5kZXJUdXJuU2NyZWVuKCdQTEFZRVIgMScpO1xuICBhd2FpdCBwbGF5ZXJUdXJuKGJvYXJkMSwgYm9hcmQyLCBwbGF5ZXIxLCBwbGF5ZXIyLCAnUGxheWVyIDEnLCAnUGxheWVyIDInKTtcblxuICAvLyBDU1Mgc2VsZWN0b3JzIG5lZWQgYWRqdXN0aW5nIGluIHRoaXMgbG9vcCBkdWUgdG8gdGhlXG4gIC8vIGJvYXJkcyBiZWluZyBjbGVhcmVkIGJldHdlZW4gZWFjaCB0dXJuXG4gIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ21haW4nKS5jbGFzc0xpc3QuYWRkKCd0d28tcGxheWVyJyk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHBsYXllclR1cm4oXG4gIG93bkJvYXJkLFxuICBlbmVteUJvYXJkLFxuICB0aGlzUGxheWVyLFxuICBuZXh0UGxheWVyLFxuICB0aGlzUGxheWVyU3RyLFxuICBuZXh0UGxheWVyU3RyXG4pIHtcbiAgbGV0IG51bUF0dGFja3MgPSAwO1xuXG4gIGNsZWFyQm9hcmRzKCk7XG4gIHN3YXBTdW5rRmxlZXRzKCk7XG5cbiAgLy8gQ29udHJvbHMgd2hlcmUgaGl0cy9taXNzZXMgYXJlIGFubm91bmNlZCBhbmQgc3VuayBzaGlwcyBzaG93blxuICBwdWJsaXNoKCd0YXJnZXRDaGFuZ2UnLCAnZW5lbXknKTtcblxuICByZW5kZXJCb2FyZChvd25Cb2FyZC5ib2FyZEFycmF5LCAnb3duJyk7XG4gIHJlbmRlckJvYXJkKGVuZW15Qm9hcmQuYm9hcmRBcnJheSwgJ2VuZW15Jyk7XG5cbiAgY2xpY2tMaXN0ZW5lcih0aGlzUGxheWVyLCAnZW5lbXknKTtcblxuICBzdWJzY3JpYmUoJ3NxdWFyZUF0dGFja2VkJywgcGxheWVyQXR0YWNrKTtcblxuICBmdW5jdGlvbiBwbGF5ZXJBdHRhY2soW3BsYXllciwgdGFyZ2V0XSkge1xuICAgIHBsYXllci5tYWtlQXR0YWNrKFt0YXJnZXRbMF0sIHRhcmdldFsxXV0pO1xuXG4gICAgcmVuZGVyQm9hcmQoZW5lbXlCb2FyZC5ib2FyZEFycmF5LCAnZW5lbXknKTtcblxuICAgIGlmIChlbmVteUJvYXJkLmlzRmxlZXRTdW5rKCkpIHtcbiAgICAgIHB1Ymxpc2goJ2ZsZWV0U3VuaycsIFsnQ29tcHV0ZXInLCAnSHVtYW4nXSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIG51bUF0dGFja3MrKztcblxuICAgIGlmIChudW1BdHRhY2tzID09PSA1KSB7XG4gICAgICBudW1BdHRhY2tzID0gMDtcbiAgICAgIHVuc3Vic2NyaWJlKCdzcXVhcmVBdHRhY2tlZCcsIHBsYXllckF0dGFjayk7XG5cbiAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICBjaGFuZ2VQbGF5ZXIoXG4gICAgICAgICAgb3duQm9hcmQsXG4gICAgICAgICAgZW5lbXlCb2FyZCxcbiAgICAgICAgICB0aGlzUGxheWVyLFxuICAgICAgICAgIG5leHRQbGF5ZXIsXG4gICAgICAgICAgdGhpc1BsYXllclN0cixcbiAgICAgICAgICBuZXh0UGxheWVyU3RyXG4gICAgICAgICk7XG4gICAgICB9LCAxMDAwKTtcbiAgICB9XG4gIH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gY2hhbmdlUGxheWVyKFxuICBvd25Cb2FyZCxcbiAgZW5lbXlCb2FyZCxcbiAgdGhpc1BsYXllcixcbiAgbmV4dFBsYXllcixcbiAgdGhpc1BsYXllclN0cixcbiAgbmV4dFBsYXllclN0clxuKSB7XG4gIGF3YWl0IHJlbmRlclR1cm5TY3JlZW4obmV4dFBsYXllclN0cik7XG5cbiAgcGxheWVyVHVybihcbiAgICBlbmVteUJvYXJkLFxuICAgIG93bkJvYXJkLFxuICAgIG5leHRQbGF5ZXIsXG4gICAgdGhpc1BsYXllcixcbiAgICBuZXh0UGxheWVyU3RyLFxuICAgIHRoaXNQbGF5ZXJTdHJcbiAgKTtcbn1cbiIsImltcG9ydCB7IG5ld0dhbWUgfSBmcm9tICcuL2dhbWUuanMnO1xuXG5uZXdHYW1lKCk7XG5cbiJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==
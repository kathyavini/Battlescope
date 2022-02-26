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
      } else if (value === 'sunk') {
        boardSquare.classList.add(value);
        boardSquare.classList.add('hit');
      } else {
        boardSquare.classList.add(value);
        boardSquare.classList.add('ship');

        // Tag one square per (own) ship for showing the animal type
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

  // That square can no longer be targeted
  ev.target.style.pointerEvents = 'none';

  // Time until next human click can be registered on any square
  ev.target.parentElement.style.pointerEvents = 'none';
  setTimeout(() => {
    ev.target.parentElement.style.pointerEvents = 'initial';
  }, 50);
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
        turnScreen.parentElement.removeChild(turnScreen)
        resolve(true);
      });
  });

  // readyButton.addEventListener('click', (ev) => {
  //   ev.preventDefault();
  //   turnScreen.style.display = 'none';
  //   console.log(callback)
  //   console.log(data)
  //   callback(data);

  //   return "ready"
  // });
}

;// CONCATENATED MODULE: ./src/dragDrop.js



function renderShipScreen(gameboard) {
  document.querySelector('main').style.display = 'none';

  // Hide title and disable overflow on mobile
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

  // start.addEventListener('click', (ev) => {
  //   ev.preventDefault();
  //   shipScreen.parentElement.removeChild(shipScreen);
  //   document.querySelector('main').style.display = 'flex';
  //   document.querySelector('html').classList.remove('dragging');

  //   // This maybe should be refactored into game.js
  //   renderBoard(gameboard.boardArray, 'own');
  // });
}

function listenForDragDropEvents(gameboard) {
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

      //   console.log(coords, type, orientation);

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

          //   console.log(coords, type, orientation);

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

          //   console.log(coords, type, newOrientation);

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

function playerVsAILoop({ player1, player2, board1, board2 }) {
  renderShipScreen(board1); // interesting that doing something with this promise is not necessary

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

      setTimeout(() => {}, 1500);
    }, 1000);
  }
}

async function twoPlayerGameLoop({ player1, player2, board1, board2 }) {
  
  await renderTurnScreen('PLAYER 1').then(console.log)
  await renderShipScreen(board1).then(console.log);

  await renderTurnScreen('PLAYER 2').then(console.log);
  await renderShipScreen(board2).then(console.log);

  // Game loop

}

;// CONCATENATED MODULE: ./src/index.js


newGame();


/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOzs7QUFHQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE1BQU07QUFDTjtBQUNBO0FBQ0E7QUFDQSxNQUFNO0FBQ047QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLE1BQU07QUFDTjtBQUNBLE1BQU07QUFDTjtBQUNBLE1BQU07QUFDTjtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxNQUFNO0FBQ047QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQSxNQUFNO0FBQ047QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7OztBQzNSTztBQUNQOztBQUVBO0FBQ0Esd0JBQXdCO0FBQ3hCO0FB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TyIsInNvdXJjZXMiOlsid2VicGFjazovL2JhdHRsZXNoaXAvLi9zcmMvdXRpbHMuanMiLCJ3ZWJwYWNrOi8vYmF0dGxlc2hpcC8uL3NyYy9wdWJzdWIuanMiLCJ3ZWJwYWNrOi8vYmF0dGxlc2hpcC8uL3NyYy9kb20uanMiLCJ3ZWJwYWNrOi8vYmF0dGxlc2hpcC8uL3NyYy9kcmFnRHJvcC5qcyIsIndlYnBhY2s6Ly9iYXR0bGVzaGlwLy4vc3JjL3BsYXllci5qcyIsIndlYnBhY2s6Ly9iYXR0bGVzaGlwLy4vc3JjL3NoaXBzLmpzIiwid2VicGFjazovL2JhdHRsZXNoaXAvLi9zcmMvZ2FtZWJvYXJkLmpzIiwid2VicGFjazovL2JhdHRsZXNoaXAvLi9zcmMvZ2FtZS5qcyIsIndlYnBhY2s6Ly9iYXR0bGVzaGlwLy4vc3JjL2luZGV4LmpzIl0sInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCBmdW5jdGlvbiBjcmVhdGVOZXdFbGVtZW50KFxuICB0eXBlLFxuICBjbGFzc2VzID0gbnVsbCxcbiAgdGV4dCA9IG51bGwsXG4gIGF0dHJpYnV0ZXMgPSBudWxsXG4pIHtcbiAgbGV0IGNyZWF0ZWRFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCh0eXBlKTtcblxuICBpZiAoY2xhc3Nlcykge1xuICAgIGNyZWF0ZWRFbGVtZW50LmNsYXNzTGlzdC5hZGQoLi4uY2xhc3Nlcyk7XG4gIH1cblxuICBpZiAodGV4dCkge1xuICAgIGNyZWF0ZWRFbGVtZW50LnRleHRDb250ZW50ID0gdGV4dDtcbiAgfVxuXG4gIGlmIChhdHRyaWJ1dGVzKSB7XG4gICAgZm9yIChsZXQga2V5IGluIGF0dHJpYnV0ZXMpIHtcbiAgICAgIGNyZWF0ZWRFbGVtZW50LnNldEF0dHJpYnV0ZShrZXksIGF0dHJpYnV0ZXNba2V5XSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGNyZWF0ZWRFbGVtZW50O1xufVxuIiwiLyogVGhpcyBpcyBhZGFwdGVkIGZyb20gU3RldmUgR3JpZmZpdGgncyBQdWJTdWIgRGVzaWduIFBhdHRlcm4gaW4gSlNcblxuVmlkZW86IGh0dHBzOi8vd3d3LnlvdXR1YmUuY29tL3dhdGNoP3Y9YXluU004bGxPQnNcblJlcG86IGh0dHBzOi8vZ2l0aHViLmNvbS9wcm9mM3Nzb3JTdDN2My9wdWJzdWItZGVtbyAqL1xuXG5jb25zdCBldmVudHMgPSB7fTtcblxuZXhwb3J0IGZ1bmN0aW9uIGdldEV2ZW50cygpIHtcbiAgLy8gZm9yIHRlc3Rpbmcgc3VpdGVcbiAgcmV0dXJuIHsgLi4uZXZlbnRzIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzdWJzY3JpYmUoZXZlbnROYW1lLCBjYWxsYmFjaykge1xuICBldmVudHNbZXZlbnROYW1lXSA9IGV2ZW50c1tldmVudE5hbWVdIHx8IFtdO1xuICBldmVudHNbZXZlbnROYW1lXS5wdXNoKGNhbGxiYWNrKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHVuc3Vic2NyaWJlKGV2ZW50TmFtZSwgY2FsbGJhY2spIHtcbiAgaWYgKGV2ZW50c1tldmVudE5hbWVdKSB7XG4gICAgZXZlbnRzW2V2ZW50TmFtZV0gPSBldmVudHNbZXZlbnROYW1lXS5maWx0ZXIoKGZuKSA9PiBmbiAhPT0gY2FsbGJhY2spO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwdWJsaXNoKGV2ZW50TmFtZSwgZGF0YSkge1xuICBpZiAoZXZlbnRzW2V2ZW50TmFtZV0pIHtcbiAgICBmb3IgKGNvbnN0IGNhbGxiYWNrIG9mIGV2ZW50c1tldmVudE5hbWVdKSB7XG4gICAgICBjYWxsYmFjayhkYXRhKTtcbiAgICB9XG4gIH1cbn1cbiIsImltcG9ydCAnLi9jc3MvY29sb3JzLWFuZC1mb250cy5jc3MnO1xuaW1wb3J0ICcuL2Nzcy9kb20uY3NzJztcbmltcG9ydCAnLi9jc3MvbW9iaWxlLmNzcyc7XG5pbXBvcnQgeyBjcmVhdGVOZXdFbGVtZW50IH0gZnJvbSAnLi91dGlscyc7XG5pbXBvcnQgeyBzdWJzY3JpYmUsIHB1Ymxpc2ggfSBmcm9tICcuL3B1YnN1Yic7XG5cbi8qIEZvciB0aGVtZWluZyAqL1xuY29uc3Qgc2hpcE1hcHBpbmcgPSB7XG4gIGNhcnJpZXI6ICdvY3RvcHVzJyxcbiAgYmF0dGxlc2hpcDogJ3B1ZmZlcmZpc2gnLFxuICBkZXN0cm95ZXI6ICdnb2xkZmlzaCcsXG4gIHN1Ym1hcmluZTogJ3NlYWhvcnNlJyxcbiAgJ3BhdHJvbCBib2F0JzogJ2JldHRhIGZpc2gnLFxufTtcblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUNvbnRhaW5lcnMoKSB7XG4gIGNvbnN0IGJvZHkgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdib2R5Jyk7XG4gIGNvbnN0IGJvYXJkc0NvbnRhaW5lciA9IGNyZWF0ZU5ld0VsZW1lbnQoJ21haW4nLCBbJ3BsYXktYXJlYSddKTtcbiAgY29uc3QgZW5lbXlDb250YWluZXIgPSBjcmVhdGVOZXdFbGVtZW50KCdzZWN0aW9uJywgWydlbmVteSddKTtcbiAgY29uc3Qgb3duQ29udGFpbmVyID0gY3JlYXRlTmV3RWxlbWVudCgnc2VjdGlvbicsIFsnb3duJ10pO1xuICBjb25zdCBlbmVteUJvYXJkRmxlZXQgPSBjcmVhdGVOZXdFbGVtZW50KCdkaXYnLCBbJ2JvYXJkLWZsZWV0J10pO1xuICBjb25zdCBvd25Cb2FyZEZsZWV0ID0gY3JlYXRlTmV3RWxlbWVudCgnZGl2JywgWydib2FyZC1mbGVldCddKTtcblxuICBlbmVteUNvbnRhaW5lci5hcHBlbmQoXG4gICAgY3JlYXRlTmV3RWxlbWVudCgnaDInLCBbJ3N1YnRpdGxlJywgJ2VuZW15LXRpdGxlJ10sICdPcHBvbmVudCBPY2VhbicpLFxuICAgIGNyZWF0ZU5ld0VsZW1lbnQoJ2gzJywgWydhbm5vdW5jZS1wYW5lbCddKSxcbiAgICBlbmVteUJvYXJkRmxlZXRcbiAgKTtcbiAgZW5lbXlCb2FyZEZsZWV0LmFwcGVuZChcbiAgICBjcmVhdGVOZXdFbGVtZW50KCdkaXYnLCBbJ2JvYXJkJywgJ2VuZW15LWJvYXJkJ10pLFxuICAgIGNyZWF0ZU5ld0VsZW1lbnQoJ2RpdicsIFsnc3Vuay1mbGVldCddKVxuICApO1xuXG4gIG93bkNvbnRhaW5lci5hcHBlbmQoXG4gICAgY3JlYXRlTmV3RWxlbWVudCgnaDInLCBbJ3N1YnRpdGxlJywgJ293bi10aXRsZSddLCAnWW91ciBPY2VhbicpLFxuICAgIGNyZWF0ZU5ld0VsZW1lbnQoJ2gzJywgWydhbm5vdW5jZS1wYW5lbCddKSxcbiAgICBvd25Cb2FyZEZsZWV0XG4gICk7XG4gIG93bkJvYXJkRmxlZXQuYXBwZW5kKFxuICAgIGNyZWF0ZU5ld0VsZW1lbnQoJ2RpdicsIFsnYm9hcmQnLCAnb3duLWJvYXJkJ10pLFxuICAgIGNyZWF0ZU5ld0VsZW1lbnQoJ2RpdicsIFsnc3Vuay1mbGVldCddKVxuICApO1xuXG4gIGJvYXJkc0NvbnRhaW5lci5hcHBlbmQoZW5lbXlDb250YWluZXIsIG93bkNvbnRhaW5lcik7XG5cbiAgYm9keS5hcHBlbmQoXG4gICAgY3JlYXRlTmV3RWxlbWVudCgnaDEnLCBbJ3RpdGxlJ10sICdCYXR0bGVzY29wZScpLFxuICAgIGNyZWF0ZU5ld0VsZW1lbnQoJ2gzJywgWydnYW1lLWFubm91bmNlJ10pLFxuICAgIGJvYXJkc0NvbnRhaW5lclxuICApO1xuXG4gIC8qIEdhbWVib2FyZCBzcXVhcmVzICovXG4gIGNvbnN0IGJvYXJkcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5ib2FyZCcpO1xuICBmb3IgKGNvbnN0IGJvYXJkIG9mIGJvYXJkcykge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgMTA7IGkrKykge1xuICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCAxMDsgaisrKSB7XG4gICAgICAgIGNvbnN0IGRpdiA9IGNyZWF0ZU5ld0VsZW1lbnQoJ2RpdicsIFsnc3F1YXJlJ10sIG51bGwsIHtcbiAgICAgICAgICAnZGF0YS1wb3MnOiBgJHtpfSR7an1gLFxuICAgICAgICB9KTtcbiAgICAgICAgYm9hcmQuYXBwZW5kQ2hpbGQoZGl2KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlbmRlckJvYXJkKGJvYXJkLCBzZWN0aW9uKSB7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgMTA7IGkrKykge1xuICAgIGZvciAobGV0IGogPSAwOyBqIDwgMTA7IGorKykge1xuICAgICAgY29uc3QgdmFsdWUgPSBib2FyZFtpXVtqXTtcbiAgICAgIGNvbnN0IGJvYXJkU3F1YXJlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcbiAgICAgICAgYC4ke3NlY3Rpb259LWJvYXJkIFtkYXRhLXBvcz1cIiR7aX0ke2p9XCJdYFxuICAgICAgKTtcbiAgICAgIGlmICghdmFsdWUpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9IGVsc2UgaWYgKHZhbHVlID09PSAnaGl0JyB8fCB2YWx1ZSA9PT0gJ21pc3MnKSB7XG4gICAgICAgIGJvYXJkU3F1YXJlLmNsYXNzTGlzdC5hZGQodmFsdWUpO1xuICAgICAgfSBlbHNlIGlmICh2YWx1ZSA9PT0gJ3N1bmsnKSB7XG4gICAgICAgIGJvYXJkU3F1YXJlLmNsYXNzTGlzdC5hZGQodmFsdWUpO1xuICAgICAgICBib2FyZFNxdWFyZS5jbGFzc0xpc3QuYWRkKCdoaXQnKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGJvYXJkU3F1YXJlLmNsYXNzTGlzdC5hZGQodmFsdWUpO1xuICAgICAgICBib2FyZFNxdWFyZS5jbGFzc0xpc3QuYWRkKCdzaGlwJyk7XG5cbiAgICAgICAgLy8gVGFnIG9uZSBzcXVhcmUgcGVyIChvd24pIHNoaXAgZm9yIHNob3dpbmcgdGhlIGFuaW1hbCB0eXBlXG4gICAgICAgIGJvYXJkU3F1YXJlLmNsYXNzTGlzdC5hZGQoYCR7dmFsdWVbMF19YCk7XG5cbiAgICAgICAgaWYgKHZhbHVlWzBdID09PSAnYicgJiYgdmFsdWVbMV0gPT09ICcyJykge1xuICAgICAgICAgIGJvYXJkU3F1YXJlLmNsYXNzTGlzdC5hZGQoJ3RhZ2dlZCcpO1xuICAgICAgICB9IGVsc2UgaWYgKHZhbHVlWzBdID09PSAnYycgJiYgdmFsdWVbMV0gPT09ICczJykge1xuICAgICAgICAgIGJvYXJkU3F1YXJlLmNsYXNzTGlzdC5hZGQoJ3RhZ2dlZCcpO1xuICAgICAgICB9IGVsc2UgaWYgKCh2YWx1ZVswXSA9PT0gJ3MnIHx8IHZhbHVlWzBdID09PSAnZCcpICYmIHZhbHVlWzFdID09PSAnMicpIHtcbiAgICAgICAgICBib2FyZFNxdWFyZS5jbGFzc0xpc3QuYWRkKCd0YWdnZWQnKTtcbiAgICAgICAgfSBlbHNlIGlmICh2YWx1ZVswXSA9PT0gJ3AnICYmIHZhbHVlWzFdID09PSAnMScpIHtcbiAgICAgICAgICBib2FyZFNxdWFyZS5jbGFzc0xpc3QuYWRkKCd0YWdnZWQnKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBjbGlja0F0dGFjayhldiwgcGxheWVyKSB7XG4gIHB1Ymxpc2goJ3NxdWFyZUF0dGFja2VkJywgW3BsYXllciwgZXYudGFyZ2V0LmRhdGFzZXQucG9zXSk7XG5cbiAgLy8gVGhhdCBzcXVhcmUgY2FuIG5vIGxvbmdlciBiZSB0YXJnZXRlZFxuICBldi50YXJnZXQuc3R5bGUucG9pbnRlckV2ZW50cyA9ICdub25lJztcblxuICAvLyBUaW1lIHVudGlsIG5leHQgaHVtYW4gY2xpY2sgY2FuIGJlIHJlZ2lzdGVyZWQgb24gYW55IHNxdWFyZVxuICBldi50YXJnZXQucGFyZW50RWxlbWVudC5zdHlsZS5wb2ludGVyRXZlbnRzID0gJ25vbmUnO1xuICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICBldi50YXJnZXQucGFyZW50RWxlbWVudC5zdHlsZS5wb2ludGVyRXZlbnRzID0gJ2luaXRpYWwnO1xuICB9LCA1MCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjbGlja0xpc3RlbmVyKHBsYXllciwgc2VjdGlvbikge1xuICBjb25zdCB0YXJnZXRDb250YWluZXIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGBzZWN0aW9uLiR7c2VjdGlvbn1gKTtcblxuICBjb25zdCB0YXJnZXRTcXVhcmVzID0gdGFyZ2V0Q29udGFpbmVyLnF1ZXJ5U2VsZWN0b3JBbGwoJy5zcXVhcmUnKTtcbiAgdGFyZ2V0U3F1YXJlcy5mb3JFYWNoKChzcXVhcmUpID0+IHtcbiAgICBzcXVhcmUuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoZXYpID0+IHtcbiAgICAgIGNsaWNrQXR0YWNrKGV2LCBwbGF5ZXIpO1xuICAgIH0pO1xuICB9KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG1ha2VBbm5vdW5jZW1lbnRzKCkge1xuICBjb25zdCBnYW1lUGFuZWwgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuZ2FtZS1hbm5vdW5jZScpO1xuICBjb25zdCBib2FyZHNDb250YWluZXIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdtYWluJyk7XG5cbiAgbGV0IHBhbmVsO1xuICBsZXQgc3Vua0ZsZWV0O1xuXG4gIC8vIEdhbWUgbG9vcCBlbWl0cyBldmVudCB3aGVuIGFjdGl2ZSBwYW5lbCBpcyBzd2l0Y2hlZFxuICBzdWJzY3JpYmUoJ3RhcmdldENoYW5nZScsIGNoYW5nZVBhbmVsKTtcblxuICBmdW5jdGlvbiBjaGFuZ2VQYW5lbCh0YXJnZXQpIHtcbiAgICBwYW5lbCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYC4ke3RhcmdldH0gLmFubm91bmNlLXBhbmVsYCk7XG4gICAgc3Vua0ZsZWV0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgLiR7dGFyZ2V0fSAuc3Vuay1mbGVldGApO1xuICB9XG5cbiAgY29uc3QgYW5ub3VuY2VQYW5lbHMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcuYW5ub3VuY2UtcGFuZWwnKTtcblxuICAvLyBUaW1pbmcgb2YgYW5ub3VuY2VtZW50cyBhcmUgY29udHJvbGxlZCBieSBDU1MgdHJhbnNpdGlvbnNcbiAgZm9yIChjb25zdCBwYW5lbCBvZiBhbm5vdW5jZVBhbmVscykge1xuICAgIHBhbmVsLmFkZEV2ZW50TGlzdGVuZXIoJ3RyYW5zaXRpb25lbmQnLCAoKSA9PiB7XG4gICAgICBwYW5lbC5jbGFzc0xpc3QucmVtb3ZlKCd2aXNpYmxlJyk7XG4gICAgICBwYW5lbC5jbGFzc0xpc3QucmVtb3ZlKCdoaXQnKTtcbiAgICB9KTtcbiAgfVxuXG4gIHN1YnNjcmliZSgnaGl0JywgYW5ub3VuY2VIaXQpO1xuICBzdWJzY3JpYmUoJ21pc3MnLCBhbm5vdW5jZU1pc3MpO1xuICBzdWJzY3JpYmUoJ3NoaXBTdW5rJywgYW5ub3VuY2VTdW5rU2hpcCk7XG4gIHN1YnNjcmliZSgnZmxlZXRTdW5rJywgYW5ub3VuY2VXaW4pO1xuICBzdWJzY3JpYmUoJ2ZsZWV0U3VuaycsIGVuZEdhbWUpO1xuICBzdWJzY3JpYmUoJ3NoaXBTdW5rJywgcmVuZGVyU3Vua1NoaXApO1xuXG4gIC8vIFRoZXNlIGZ1bmN0aW9ucyB1c2VkIHRvIGFubm91bmNlIGhpdCBsb2NhdGlvbnMgYXMgd2VsbDsgZm9yIG5vdyBsZWF2aW5nIGxvY2F0aW9uIGRhdGEgaGVyZSBpbiBjYXNlIHRoYXQgaXMgcmUtaW1wbGVtZW50ZWRcbiAgZnVuY3Rpb24gYW5ub3VuY2VIaXQoW3JvdywgY29sdW1uXSkge1xuICAgIHBhbmVsLmNsYXNzTGlzdC5hZGQoJ3Zpc2libGUnKTtcbiAgICBwYW5lbC5jbGFzc0xpc3QuYWRkKCdoaXQnKTtcbiAgICBwYW5lbC50ZXh0Q29udGVudCA9IGBTb21ldGhpbmcncyBiZWVuIHNwb3R0ZWQhYDtcbiAgfVxuXG4gIGZ1bmN0aW9uIGFubm91bmNlTWlzcygpIHtcbiAgICBwYW5lbC5jbGFzc0xpc3QuYWRkKCd2aXNpYmxlJyk7XG4gICAgcGFuZWwudGV4dENvbnRlbnQgPSBgTm90aGluZyFgO1xuICB9XG5cbiAgZnVuY3Rpb24gYW5ub3VuY2VTdW5rU2hpcChbaGl0U2hpcCwgW3JvdywgY29sdW1uXV0pIHtcbiAgICBwYW5lbC5jbGFzc0xpc3QuYWRkKCd2aXNpYmxlJyk7XG4gICAgY29uc3QgY3JlYXR1cmUgPSBzaGlwTWFwcGluZ1tgJHtoaXRTaGlwLnR5cGV9YF07XG4gICAgcGFuZWwudGV4dENvbnRlbnQgPSBgSXQncyBhICR7Y3JlYXR1cmV9ISFgO1xuICB9XG5cbiAgZnVuY3Rpb24gYW5ub3VuY2VXaW4oW2xvc2VyLCB3aW5uZXJdKSB7XG4gICAgZ2FtZVBhbmVsLmNsYXNzTGlzdC5hZGQoJ3dpbicpO1xuICAgIGdhbWVQYW5lbC50ZXh0Q29udGVudCA9IGAke2xvc2VyfSdzIHNlYSBjcmVhdHVyZXMgaGF2ZSBiZWVuIGZvdW5kISAke3dpbm5lcn0gd2lucyFgO1xuICB9XG5cbiAgZnVuY3Rpb24gZW5kR2FtZSgpIHtcbiAgICAvLyBDb2xsYXBzZSBib2FyZCBhbm5vdW5jZSBwYW5lbHNcbiAgICBmb3IgKGNvbnN0IHBhbmVsIG9mIGFubm91bmNlUGFuZWxzKSB7XG4gICAgICBwYW5lbC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgIH1cbiAgICAvLyBEaXNhYmxlIGZ1cnRoZXIgY2xpY2tpbmdcbiAgICBib2FyZHNDb250YWluZXIuc3R5bGUucG9pbnRlckV2ZW50cyA9ICdub25lJztcblxuICAgIC8vIEJ1dHRvbiB0byByZXN0YXJ0IChyZWxvYWQpIGdhbWVcbiAgICBjb25zdCBwbGF5QWdhaW4gPSBjcmVhdGVOZXdFbGVtZW50KCdidXR0b24nLCBbJ3BsYXktYWdhaW4nXSwgJ1BsYXkgQWdhaW4nKTtcblxuICAgIHBsYXlBZ2Fpbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIChldikgPT4ge1xuICAgICAgZXYucHJldmVudERlZmF1bHQoKTtcbiAgICAgIGxvY2F0aW9uLnJlbG9hZCgpO1xuICAgIH0pO1xuXG4gICAgZ2FtZVBhbmVsLmFwcGVuZENoaWxkKHBsYXlBZ2Fpbik7XG4gIH1cblxuICBmdW5jdGlvbiByZW5kZXJTdW5rU2hpcChbaGl0U2hpcCwgW3JvdywgY29sdW1uXV0pIHtcbiAgICBjb25zdCBzaGlwUmVuZGVyID0gY3JlYXRlTmV3RWxlbWVudCgnZGl2JywgW1xuICAgICAgJ3NoaXAtcmVuZGVyJyxcbiAgICAgIGAke2hpdFNoaXAudHlwZVswXX1gLFxuICAgIF0pO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBoaXRTaGlwLmxlbmd0aDsgaSsrKSB7XG4gICAgICBzaGlwUmVuZGVyLmFwcGVuZENoaWxkKGNyZWF0ZU5ld0VsZW1lbnQoJ2RpdicsIFsnc2hpcC1wYXJ0J10pKTtcbiAgICB9XG5cbiAgICBzdW5rRmxlZXQuYXBwZW5kQ2hpbGQoc2hpcFJlbmRlcik7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlbmRlclN0YXJ0U2NyZWVuKCkge1xuICBjb25zdCBib2R5ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignYm9keScpO1xuICBjb25zdCBwbGF5ZXIxID0gY3JlYXRlTmV3RWxlbWVudChcbiAgICAnYnV0dG9uJyxcbiAgICBbJ3NpbmdsZS1wbGF5ZXItYnV0dG9uJ10sXG4gICAgJzEtUGxheWVyJ1xuICApO1xuICBjb25zdCBwbGF5ZXIyID0gY3JlYXRlTmV3RWxlbWVudCgnYnV0dG9uJywgWyd0d28tcGxheWVyLWJ1dHRvbiddLCAnMi1QbGF5ZXInKTtcblxuICBjb25zdCBzdGFydFNjcmVlbiA9IGNyZWF0ZU5ld0VsZW1lbnQoJ2RpdicsIFsnc3RhcnQtc2NyZWVuJ10pO1xuICBzdGFydFNjcmVlbi5hcHBlbmQoXG4gICAgY3JlYXRlTmV3RWxlbWVudCgnaDEnLCBbJ3N0YXJ0LXRpdGxlJ10sICdCYXR0bGVTQ09QRScpLFxuICAgIGNyZWF0ZU5ld0VsZW1lbnQoJ2RpdicsIFsnc2NvcGUnXSksXG4gICAgY3JlYXRlTmV3RWxlbWVudChcbiAgICAgICdoMicsXG4gICAgICBbJ3N0YXJ0LXN1YnRpdGxlJ10sXG4gICAgICAnQSBmcmllbmRsaWVyIHRha2Ugb24gdGhlIGNsYXNzaWMgZ2FtZSBCYXR0bGVzaGlwJ1xuICAgICksXG4gICAgY3JlYXRlTmV3RWxlbWVudChcbiAgICAgICdwJyxcbiAgICAgIFsnZGlyZWN0aW9ucyddLFxuICAgICAgXCJESVJFQ1RJT05TOiBFeHBsb3JlIHlvdXIgb3Bwb25lbnQncyBvY2VhbiB3aXRoIHlvdXIgdW5kZXJ3YXRlciBzY29wZS4gVGhlIGZpcnN0IHRvIHNwb3QgYWxsIGZpdmUgc2VhIGNyZWF0dXJlcyB3aW5zISBJbiAyLVBMQVlFUi1NT0RFIGVhY2ggdHVybiBncmFudHMgdGhyZWUgc2NvcGUgYXR0ZW1wdHMuXCJcbiAgICApLFxuICAgIHBsYXllcjEsXG4gICAgcGxheWVyMlxuICApO1xuXG4gIGJvZHkuYXBwZW5kKHN0YXJ0U2NyZWVuKTtcblxuICByZXR1cm4gW3BsYXllcjEsIHBsYXllcjJdOyAvLyB0byBjb250cm9sIGdhbWUgdHlwZSBmcm9tIGdhbWUgbW9kdWxlXG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZW5kZXJUdXJuU2NyZWVuKHBsYXllcikge1xuICBjb25zdCBib2R5ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignYm9keScpO1xuICBjb25zdCByZWFkeUJ1dHRvbiA9IGNyZWF0ZU5ld0VsZW1lbnQoJ2J1dHRvbicsIFsncmVhZHktYnV0dG9uJ10sICdSZWFkeScpO1xuXG4gIGNvbnN0IHR1cm5TY3JlZW4gPSBjcmVhdGVOZXdFbGVtZW50KCdkaXYnLCBbJ3R1cm4tc2NyZWVuJ10pO1xuICB0dXJuU2NyZWVuLmFwcGVuZChcbiAgICBjcmVhdGVOZXdFbGVtZW50KFxuICAgICAgJ2gyJyxcbiAgICAgIFsndHVybi1pbnN0cnVjdGlvbnMnXSxcbiAgICAgIGBQbGVhc2UgcGFzcyB0aGUgZGV2aWNlIHRvICR7cGxheWVyfS4gSGl0IHJlYWR5IHdoZW4gZGV2aWNlIGlzIHBhc3NlZGBcbiAgICApLFxuICAgIHJlYWR5QnV0dG9uXG4gICk7XG5cbiAgYm9keS5hcHBlbmQodHVyblNjcmVlbik7XG5cbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgIHJlYWR5QnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKGV2KSA9PiB7XG4gICAgICAgIGV2LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIHR1cm5TY3JlZW4ucGFyZW50RWxlbWVudC5yZW1vdmVDaGlsZCh0dXJuU2NyZWVuKVxuICAgICAgICByZXNvbHZlKHRydWUpO1xuICAgICAgfSk7XG4gIH0pO1xuXG4gIC8vIHJlYWR5QnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKGV2KSA9PiB7XG4gIC8vICAgZXYucHJldmVudERlZmF1bHQoKTtcbiAgLy8gICB0dXJuU2NyZWVuLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gIC8vICAgY29uc29sZS5sb2coY2FsbGJhY2spXG4gIC8vICAgY29uc29sZS5sb2coZGF0YSlcbiAgLy8gICBjYWxsYmFjayhkYXRhKTtcblxuICAvLyAgIHJldHVybiBcInJlYWR5XCJcbiAgLy8gfSk7XG59XG4iLCJpbXBvcnQgeyBjcmVhdGVOZXdFbGVtZW50IH0gZnJvbSAnLi91dGlscyc7XG5pbXBvcnQgeyByZW5kZXJCb2FyZCB9IGZyb20gJy4vZG9tJztcblxuZXhwb3J0IGZ1bmN0aW9uIHJlbmRlclNoaXBTY3JlZW4oZ2FtZWJvYXJkKSB7XG4gIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ21haW4nKS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuXG4gIC8vIEhpZGUgdGl0bGUgYW5kIGRpc2FibGUgb3ZlcmZsb3cgb24gbW9iaWxlXG4gIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy50aXRsZScpLmNsYXNzTGlzdC5hZGQoJ2hpZGRlbicpO1xuICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdodG1sJykuY2xhc3NMaXN0LmFkZCgnZHJhZ2dpbmcnKTtcblxuICBjb25zdCByYW5kb21pemUgPSBjcmVhdGVOZXdFbGVtZW50KCdidXR0b24nLCBbJ3JhbmRvbWl6ZSddLCAnUmFuZG9taXplJyk7XG4gIGNvbnN0IHN0YXJ0ID0gY3JlYXRlTmV3RWxlbWVudCgnYnV0dG9uJywgWydzdGFydCddLCAnU3RhcnQnKTtcblxuICBjb25zdCBzaGlwU2NyZWVuID0gY3JlYXRlTmV3RWxlbWVudCgnZGl2JywgWydzaGlwLXNjcmVlbiddKTtcbiAgc2hpcFNjcmVlbi5hcHBlbmQoXG4gICAgY3JlYXRlTmV3RWxlbWVudCgnaDInLCBbJ3NoaXAtc3VidGl0bGUnXSwgJ0hpZGUgeW91ciB3aWxkbGlmZScpLFxuICAgIGNyZWF0ZU5ld0VsZW1lbnQoXG4gICAgICAncCcsXG4gICAgICBbJ2RpcmVjdGlvbnMnXSxcbiAgICAgICdEcmFnIGFuZCBkcm9wIHRvIG1vdmUsIGNsaWNrIHRvIGNoYW5nZSBvcmllbnRhdGlvbi4gV2lsZGxpZmUgY2Fubm90IGJlIGFkamFjZW50IHRvIG90aGVyIHdpbGRsaWZlJ1xuICAgICksXG4gICAgcmFuZG9taXplLFxuICAgIHN0YXJ0XG4gICk7XG5cbiAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignYm9keScpLmFwcGVuZChzaGlwU2NyZWVuKTtcblxuICAvKiBDcmVhdGUgYmxhbmsgYm9hcmQgKi9cbiAgY29uc3QgYm9hcmQgPSBjcmVhdGVOZXdFbGVtZW50KCdkaXYnLCBbJ2RyYWctYm9hcmQnXSk7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgMTA7IGkrKykge1xuICAgIGZvciAobGV0IGogPSAwOyBqIDwgMTA7IGorKykge1xuICAgICAgY29uc3QgZGl2ID0gY3JlYXRlTmV3RWxlbWVudCgnZGl2JywgWydkcmFnLXNxdWFyZSddLCBudWxsLCB7XG4gICAgICAgICdkYXRhLXBvcyc6IGAke2l9JHtqfWAsXG4gICAgICB9KTtcbiAgICAgIGJvYXJkLmFwcGVuZENoaWxkKGRpdik7XG4gICAgfVxuICB9XG5cbiAgLy8gSSBmb3JnZXQgd2h5IEkgZGlkIHRoaXNcbiAgc2hpcFNjcmVlbi5pbnNlcnRCZWZvcmUoYm9hcmQsIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5yYW5kb21pemUnKSk7XG5cbiAgLy8gQ3JlYXRlIHNoaXAgRE9NIGVsZW1lbnRzXG4gIHBsYWNlRHJhZ2dhYmxlU2hpcHMoZ2FtZWJvYXJkKTtcblxuICAvLyBBZGQgZXZlbnQgbGlzdGVuZXJzIHRvIGJvYXJkXG4gIGxpc3RlbkZvckRyYWdEcm9wRXZlbnRzKGdhbWVib2FyZCk7IC8vIG1vdXNlIG9ubHlcbiAgbGlzdGVuRm9yVG91Y2hFdmVudHMoZ2FtZWJvYXJkKTsgLy8gdG91Y2hcblxuICAvLyBCdXR0b24gZXZlbnQgbGlzdGVuZXJzXG4gIHJhbmRvbWl6ZS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIChldikgPT4ge1xuICAgIGV2LnByZXZlbnREZWZhdWx0KCk7XG4gICAgZ2FtZWJvYXJkLmNsZWFyQm9hcmQoKTtcbiAgICBnYW1lYm9hcmQucGxhY2VBbGxTaGlwc1JhbmRvbWx5KCk7XG4gICAgY2xlYXJEcmFnZ2FibGVTaGlwcygpO1xuICAgIHBsYWNlRHJhZ2dhYmxlU2hpcHMoZ2FtZWJvYXJkKTtcbiAgfSk7XG5cbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgc3RhcnQuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoZXYpID0+IHtcbiAgICAgIGV2LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICBzaGlwU2NyZWVuLnBhcmVudEVsZW1lbnQucmVtb3ZlQ2hpbGQoc2hpcFNjcmVlbik7XG4gICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdtYWluJykuc3R5bGUuZGlzcGxheSA9ICdmbGV4JztcbiAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ2h0bWwnKS5jbGFzc0xpc3QucmVtb3ZlKCdkcmFnZ2luZycpO1xuICAgICAgcmVzb2x2ZSh0cnVlKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgLy8gc3RhcnQuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoZXYpID0+IHtcbiAgLy8gICBldi5wcmV2ZW50RGVmYXVsdCgpO1xuICAvLyAgIHNoaXBTY3JlZW4ucGFyZW50RWxlbWVudC5yZW1vdmVDaGlsZChzaGlwU2NyZWVuKTtcbiAgLy8gICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdtYWluJykuc3R5bGUuZGlzcGxheSA9ICdmbGV4JztcbiAgLy8gICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdodG1sJykuY2xhc3NMaXN0LnJlbW92ZSgnZHJhZ2dpbmcnKTtcblxuICAvLyAgIC8vIFRoaXMgbWF5YmUgc2hvdWxkIGJlIHJlZmFjdG9yZWQgaW50byBnYW1lLmpzXG4gIC8vICAgcmVuZGVyQm9hcmQoZ2FtZWJvYXJkLmJvYXJkQXJyYXksICdvd24nKTtcbiAgLy8gfSk7XG59XG5cbmZ1bmN0aW9uIGxpc3RlbkZvckRyYWdEcm9wRXZlbnRzKGdhbWVib2FyZCkge1xuICBsZXQgdGhpc0RyYWdFbGVtZW50O1xuICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdkcmFnc3RhcnQnLCAoZXYpID0+IHtcbiAgICB0aGlzRHJhZ0VsZW1lbnQgPSBldi50YXJnZXQ7XG4gIH0pO1xuXG4gIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2RyYWdlbnRlcicsIChldikgPT4ge1xuICAgIGlmIChldi50YXJnZXQuY2xhc3NOYW1lID09PSAnZHJhZy1zcXVhcmUnKSB7XG4gICAgICBldi50YXJnZXQuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gJ3B1cnBsZSc7XG4gICAgfVxuICB9KTtcblxuICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdkcmFnbGVhdmUnLCAoZXYpID0+IHtcbiAgICBpZiAoZXYudGFyZ2V0LmNsYXNzTmFtZSA9PT0gJ2RyYWctc3F1YXJlJykge1xuICAgICAgZXYudGFyZ2V0LnN0eWxlLmJhY2tncm91bmRDb2xvciA9ICcnO1xuICAgIH1cbiAgfSk7XG5cbiAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignZHJhZ292ZXInLCAoZXYpID0+IHtcbiAgICAvLyBNRE4gc2F5cyB0aGlzIGlzIG5lY2Vzc2FyeSB0byBhbGxvdyBkcm9wXG4gICAgZXYucHJldmVudERlZmF1bHQoKTtcbiAgfSk7XG5cbiAgLy8gRHJhZyBhbmQgZHJvcCB0byB1cGRhdGUgcG9zaXRpb25cbiAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignZHJvcCcsIChldikgPT4ge1xuICAgIGV2LnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICBpZiAoZXYudGFyZ2V0LmNsYXNzTmFtZSA9PT0gJ2RyYWctc3F1YXJlJykge1xuICAgICAgZXYudGFyZ2V0LnN0eWxlLmJhY2tncm91bmRDb2xvciA9ICcnO1xuXG4gICAgICBjb25zdCBjb29yZHMgPSBbK2V2LnRhcmdldC5kYXRhc2V0LnBvc1swXSwgK2V2LnRhcmdldC5kYXRhc2V0LnBvc1sxXV07XG5cbiAgICAgIGNvbnN0IGxlbmd0aCA9IHRoaXNEcmFnRWxlbWVudC5kYXRhc2V0Lmxlbmd0aDtcbiAgICAgIGNvbnN0IHR5cGUgPSB0aGlzRHJhZ0VsZW1lbnQuZGF0YXNldC50eXBlO1xuICAgICAgY29uc3Qgb3JpZW50YXRpb24gPSB0aGlzRHJhZ0VsZW1lbnQuZGF0YXNldC5vcmllbnRhdGlvbjtcblxuICAgICAgLy8gICBjb25zb2xlLmxvZyhjb29yZHMsIHR5cGUsIG9yaWVudGF0aW9uKTtcblxuICAgICAgdHJ5IHtcbiAgICAgICAgZ2FtZWJvYXJkLmlzU2hpcExlZ2FsKHR5cGUsIGxlbmd0aCwgb3JpZW50YXRpb24sIGNvb3Jkcyk7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKCd0aGlzIHdhcyBhIGxlZ2FsIHBsYWNlbWVudCcpO1xuXG4gICAgICAgIHVwZGF0ZUdhbWVib2FyZChnYW1lYm9hcmQsIHR5cGUsIGNvb3Jkcywgb3JpZW50YXRpb24pO1xuXG4gICAgICAgIHRoaXNEcmFnRWxlbWVudC5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHRoaXNEcmFnRWxlbWVudCk7XG4gICAgICAgIGV2LnRhcmdldC5hcHBlbmRDaGlsZCh0aGlzRHJhZ0VsZW1lbnQpO1xuXG4gICAgICAgIHRoaXNEcmFnRWxlbWVudC5kYXRhc2V0LnBvcyA9IGV2LnRhcmdldC5kYXRhc2V0LnBvcztcbiAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGVycm9yKTtcbiAgICAgICAgLy8gY29uc29sZS5sb2coJ3RoaXMgd2FzIG5vdCBhIGxlZ2FsIHBsYWNlbWVudCcpO1xuICAgICAgfVxuICAgIH1cbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGxpc3RlbkZvclRvdWNoRXZlbnRzKGdhbWVib2FyZCkge1xuICBjb25zdCBkcmFnQm9hcmQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuZHJhZy1ib2FyZCcpO1xuICBsZXQgdGhpc0RyYWdFbGVtZW50O1xuXG4gIGxldCBpbml0aWFsUG9zO1xuICBsZXQgZHJhZ2dpbmcgPSBmYWxzZTtcblxuICBkcmFnQm9hcmQuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIChldikgPT4ge1xuICAgIGlmIChldi50YXJnZXQuY2xhc3NMaXN0LmNvbnRhaW5zKCdkcmFnZ2FibGUtc2hpcCcpKSB7XG4gICAgICB0aGlzRHJhZ0VsZW1lbnQgPSBldi50YXJnZXQ7XG4gICAgfVxuICAgIGluaXRpYWxQb3MgPSBbZXYudG91Y2hlc1swXS5jbGllbnRYLCBldi50b3VjaGVzWzBdLmNsaWVudFldO1xuICB9KTtcblxuICBkcmFnQm9hcmQuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2htb3ZlJywgKGV2KSA9PiB7XG4gICAgaWYgKHRoaXNEcmFnRWxlbWVudCkge1xuICAgICAgdGhpc0RyYWdFbGVtZW50LnN0eWxlLm9wYWNpdHkgPSAnMC41JztcbiAgICAgIHRoaXNEcmFnRWxlbWVudC5zdHlsZS50cmFuc2Zvcm0gPSBgdHJhbnNsYXRlKCR7XG4gICAgICAgIGV2LnRvdWNoZXNbMF0uY2xpZW50WCAtIGluaXRpYWxQb3NbMF1cbiAgICAgIH1weCwgJHtldi50b3VjaGVzWzBdLmNsaWVudFkgLSBpbml0aWFsUG9zWzFdfXB4KSAke1xuICAgICAgICB0aGlzRHJhZ0VsZW1lbnQuZGF0YXNldC5vcmllbnRhdGlvbiA9PT0gJ3ZlcnRpY2FsJ1xuICAgICAgICAgID8gJ3JvdGF0ZSg5MGRlZyknXG4gICAgICAgICAgOiAnJ1xuICAgICAgfWA7XG4gICAgICBkcmFnZ2luZyA9IHRydWU7XG4gICAgfVxuICB9KTtcblxuICBkcmFnQm9hcmQuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hlbmQnLCAoZXYpID0+IHtcbiAgICBpZiAoZHJhZ2dpbmcgJiYgdGhpc0RyYWdFbGVtZW50KSB7XG4gICAgICBjb25zdCB0b3VjaGVkRGl2cyA9IGRvY3VtZW50LmVsZW1lbnRzRnJvbVBvaW50KFxuICAgICAgICB0aGlzRHJhZ0VsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkueCxcbiAgICAgICAgdGhpc0RyYWdFbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLnlcbiAgICAgICk7XG5cbiAgICAgIHRvdWNoZWREaXZzLmZvckVhY2goKGRpdikgPT4ge1xuICAgICAgICBjb25zdCBjb3JuZXJEaXYgPSBkaXY7XG5cbiAgICAgICAgaWYgKGNvcm5lckRpdi5jbGFzc0xpc3QuY29udGFpbnMoJ2RyYWctc3F1YXJlJykpIHtcbiAgICAgICAgICBjb25zdCBjb29yZHMgPSBbK2Nvcm5lckRpdi5kYXRhc2V0LnBvc1swXSwgK2Nvcm5lckRpdi5kYXRhc2V0LnBvc1sxXV07XG5cbiAgICAgICAgICBjb25zdCBsZW5ndGggPSB0aGlzRHJhZ0VsZW1lbnQuZGF0YXNldC5sZW5ndGg7XG4gICAgICAgICAgY29uc3QgdHlwZSA9IHRoaXNEcmFnRWxlbWVudC5kYXRhc2V0LnR5cGU7XG4gICAgICAgICAgY29uc3Qgb3JpZW50YXRpb24gPSB0aGlzRHJhZ0VsZW1lbnQuZGF0YXNldC5vcmllbnRhdGlvbjtcblxuICAgICAgICAgIC8vICAgY29uc29sZS5sb2coY29vcmRzLCB0eXBlLCBvcmllbnRhdGlvbik7XG5cbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgZ2FtZWJvYXJkLmlzU2hpcExlZ2FsKHR5cGUsIGxlbmd0aCwgb3JpZW50YXRpb24sIGNvb3Jkcyk7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZygndGhpcyB3YXMgYSBsZWdhbCBwbGFjZW1lbnQnKTtcblxuICAgICAgICAgICAgdXBkYXRlR2FtZWJvYXJkKGdhbWVib2FyZCwgdHlwZSwgY29vcmRzLCBvcmllbnRhdGlvbik7XG5cbiAgICAgICAgICAgIHRoaXNEcmFnRWxlbWVudC5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHRoaXNEcmFnRWxlbWVudCk7XG4gICAgICAgICAgICBjb3JuZXJEaXYuYXBwZW5kQ2hpbGQodGhpc0RyYWdFbGVtZW50KTtcblxuICAgICAgICAgICAgdGhpc0RyYWdFbGVtZW50LmRhdGFzZXQucG9zID0gY29ybmVyRGl2LmRhdGFzZXQucG9zO1xuICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhlcnJvcik7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZygndGhpcyB3YXMgbm90IGEgbGVnYWwgcGxhY2VtZW50Jyk7XG4gICAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgIHRoaXNEcmFnRWxlbWVudC5zdHlsZS50cmFuc2Zvcm0gPSAnJztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgdGhpc0RyYWdFbGVtZW50LnN0eWxlLm9wYWNpdHkgPSAnMSc7XG4gICAgICB0aGlzRHJhZ0VsZW1lbnQuc3R5bGUudHJhbnNmb3JtID0gJyc7XG4gICAgICB0aGlzRHJhZ0VsZW1lbnQgPSB1bmRlZmluZWQ7XG4gICAgICBkcmFnZ2luZyA9IGZhbHNlO1xuICAgIH1cbiAgfSk7XG59XG5cbi8qIFB1dCBkcmFnZ2FibGUgZWxlbWVudHMgYXQgZWFjaCBzaGlwIGxvY2F0aW9uICovXG5mdW5jdGlvbiBwbGFjZURyYWdnYWJsZVNoaXBzKGdhbWVib2FyZCkge1xuICBmb3IgKGxldCBpID0gMDsgaSA8IDEwOyBpKyspIHtcbiAgICBmb3IgKGxldCBqID0gMDsgaiA8IDEwOyBqKyspIHtcbiAgICAgIGNvbnN0IHZhbHVlID0gZ2FtZWJvYXJkLmJvYXJkQXJyYXlbaV1bal07XG4gICAgICBjb25zdCBib2FyZFNxdWFyZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXG4gICAgICAgIGAuZHJhZy1zcXVhcmVbZGF0YS1wb3M9XCIke2l9JHtqfVwiXWBcbiAgICAgICk7XG5cbiAgICAgIGlmICghdmFsdWUpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9IGVsc2UgaWYgKHZhbHVlWzFdID09PSAnMScpIHtcbiAgICAgICAgY29uc3QgW3NoaXBdID0gZ2FtZWJvYXJkLmZsZWV0LmZpbHRlcigoeCkgPT4geC50eXBlWzBdID09IHZhbHVlWzBdKTtcblxuICAgICAgICBjb25zdCBkcmFnZ2FibGUgPSByZW5kZXJEcmFnZ2FibGVTaGlwKHNoaXApO1xuXG4gICAgICAgIGJvYXJkU3F1YXJlLmFwcGVuZENoaWxkKGRyYWdnYWJsZSk7XG5cbiAgICAgICAgLy8gQ2xpY2sgdG8gY2hhbmdlIG9yaWVudGF0aW9uIGV2ZW50IGxpc3RlbmVyXG4gICAgICAgIGRyYWdnYWJsZS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIChldikgPT4ge1xuICAgICAgICAgIGV2LnN0b3BQcm9wYWdhdGlvbigpO1xuXG4gICAgICAgICAgbGV0IG5ld09yaWVudGF0aW9uO1xuXG4gICAgICAgICAgaWYgKGV2LnRhcmdldC5kYXRhc2V0Lm9yaWVudGF0aW9uID09PSAndmVydGljYWwnKSB7XG4gICAgICAgICAgICBuZXdPcmllbnRhdGlvbiA9ICdob3Jpem9udGFsJztcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbmV3T3JpZW50YXRpb24gPSAndmVydGljYWwnO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjb25zdCBjb29yZHMgPSBbXG4gICAgICAgICAgICArZHJhZ2dhYmxlLnBhcmVudE5vZGUuZGF0YXNldC5wb3NbMF0sXG4gICAgICAgICAgICArZHJhZ2dhYmxlLnBhcmVudE5vZGUuZGF0YXNldC5wb3NbMV0sXG4gICAgICAgICAgXTtcbiAgICAgICAgICBjb25zdCB0eXBlID0gZHJhZ2dhYmxlLmRhdGFzZXQudHlwZTtcbiAgICAgICAgICBjb25zdCBsZW5ndGggPSBkcmFnZ2FibGUuZGF0YXNldC5sZW5ndGg7XG5cbiAgICAgICAgICAvLyAgIGNvbnNvbGUubG9nKGNvb3JkcywgdHlwZSwgbmV3T3JpZW50YXRpb24pO1xuXG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGdhbWVib2FyZC5pc1NoaXBMZWdhbCh0eXBlLCBsZW5ndGgsIG5ld09yaWVudGF0aW9uLCBjb29yZHMpO1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coJ3RoaXMgd2FzIGEgbGVnYWwgcGxhY2VtZW50Jyk7XG5cbiAgICAgICAgICAgIHVwZGF0ZUdhbWVib2FyZChnYW1lYm9hcmQsIHR5cGUsIGNvb3JkcywgbmV3T3JpZW50YXRpb24pO1xuXG4gICAgICAgICAgICBkcmFnZ2FibGUuY2xhc3NMaXN0LnRvZ2dsZSgncm90YXRlZCcpO1xuICAgICAgICAgICAgZHJhZ2dhYmxlLmRhdGFzZXQub3JpZW50YXRpb24gPSBuZXdPcmllbnRhdGlvbjtcbiAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coZXJyb3IpO1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coJ3RoaXMgd2FzIG5vdCBhIGxlZ2FsIHBsYWNlbWVudCcpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIHJlbmRlckRyYWdnYWJsZVNoaXAoc2hpcCkge1xuICBjb25zdCBzaGlwUmVuZGVyID0gY3JlYXRlTmV3RWxlbWVudChcbiAgICAnZGl2JyxcbiAgICBbJ2RyYWdnYWJsZS1zaGlwJywgJ3NoaXAtcmVuZGVyJywgYCR7c2hpcC50eXBlWzBdfWBdLFxuICAgIG51bGwsXG4gICAge1xuICAgICAgZHJhZ2dhYmxlOiAndHJ1ZScsXG4gICAgICAnZGF0YS1vcmllbnRhdGlvbic6IHNoaXAub3JpZW50YXRpb24sXG4gICAgICAnZGF0YS1sZW5ndGgnOiBgJHtzaGlwLmxlbmd0aH1gLFxuICAgICAgJ2RhdGEtdHlwZSc6IHNoaXAudHlwZSxcbiAgICB9XG4gICk7XG5cbiAgaWYgKHNoaXAub3JpZW50YXRpb24gPT09ICd2ZXJ0aWNhbCcpIHtcbiAgICBzaGlwUmVuZGVyLmNsYXNzTGlzdC5hZGQoJ3JvdGF0ZWQnKTtcbiAgfVxuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgc2hpcC5sZW5ndGg7IGkrKykge1xuICAgIHNoaXBSZW5kZXIuYXBwZW5kQ2hpbGQoY3JlYXRlTmV3RWxlbWVudCgnZGl2JywgWydzaGlwLXBhcnQnXSkpO1xuICB9XG5cbiAgcmV0dXJuIHNoaXBSZW5kZXI7XG59XG5cbmZ1bmN0aW9uIGNsZWFyRHJhZ2dhYmxlU2hpcHMoKSB7XG4gIGNvbnN0IHNoaXBzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLmRyYWdnYWJsZS1zaGlwJyk7XG4gIHNoaXBzLmZvckVhY2goKHNoaXApID0+IHtcbiAgICBzaGlwLnBhcmVudEVsZW1lbnQucmVtb3ZlQ2hpbGQoc2hpcCk7XG4gIH0pO1xufVxuXG5mdW5jdGlvbiB1cGRhdGVHYW1lYm9hcmQoZ2FtZWJvYXJkLCB0eXBlLCBjb29yZHMsIG9yaWVudGF0aW9uKSB7XG4gIGdhbWVib2FyZC5jbGVhclNoaXBGcm9tQm9hcmQodHlwZSk7XG4gIGdhbWVib2FyZC5jbGVhclNoaXBGcm9tRmxlZXQodHlwZSk7XG4gIGdhbWVib2FyZC5wbGFjZVNoaXAodHlwZSwgY29vcmRzLCBvcmllbnRhdGlvbik7XG59XG4iLCJleHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBjcmVhdGVQbGF5ZXIoKSB7XG4gIGxldCBlbmVteUJvYXJkO1xuXG4gIGxldCBwcmV2aW91c01vdmVzID0gW107XG4gIGxldCBzaGlwSGlzdG9yeSA9ICcnOyAvLyBmb3IgQUkgY29uZGl0aW9uYWxzXG5cbiAgY29uc3QgYWlNb2RlID0ge1xuICAgIGNvbHVtbkF4aXM6IHRydWUsXG4gICAgcG9zRGlyZWN0aW9uOiB0cnVlLFxuICB9O1xuXG4gIGZ1bmN0aW9uIGFzc2lnbkVuZW15R2FtZWJvYXJkKGdhbWVib2FyZCkge1xuICAgIGVuZW15Qm9hcmQgPSBnYW1lYm9hcmQ7XG4gIH1cblxuICBmdW5jdGlvbiBtYWtlQXR0YWNrKFtyb3csIGNvbF0pIHtcbiAgICByZXR1cm4gZW5lbXlCb2FyZC5yZWNlaXZlQXR0YWNrKFtyb3csIGNvbF0pO1xuICB9XG5cbiAgZnVuY3Rpb24gYWlQbGF5KCkge1xuICAgIGxldCB0aGlzTW92ZSA9IHJhbmRvbU1vdmUoKTtcblxuICAgIHdoaWxlIChwbGF5ZWRQcmV2aW91c2x5KHRoaXNNb3ZlKSkge1xuICAgICAgdGhpc01vdmUgPSByYW5kb21Nb3ZlKCk7XG4gICAgfVxuXG4gICAgcHJldmlvdXNNb3Zlcy5wdXNoKHsgbW92ZTogdGhpc01vdmUgfSk7XG5cbiAgICByZXR1cm4gdGhpc01vdmU7XG4gIH1cblxuICBmdW5jdGlvbiBhaVNtYXJ0UGxheSgpIHtcbiAgICBsZXQgdGhpc01vdmU7XG5cbiAgICAvLyBGaXJzdCBtb3ZlXG4gICAgaWYgKCFwcmV2aW91c01vdmVzWzBdKSB7XG4gICAgICB0aGlzTW92ZSA9IHJhbmRvbU1vdmUoKTtcbiAgICAgIC8vIEFsbCBzdWJzZXF1ZW50XG4gICAgfSBlbHNlIHtcbiAgICAgIGV2YWx1YXRlTGFzdE1vdmUoKTtcblxuICAgICAgdGhpc01vdmUgPSBzbWFydE1vdmUoKTtcblxuICAgICAgd2hpbGUgKHBsYXllZFByZXZpb3VzbHkodGhpc01vdmUpKSB7XG4gICAgICAgIGlmIChzaGlwSGlzdG9yeSkge1xuICAgICAgICAgIGNvbnN0IHByZXZpb3VzUmVzdWx0ID0gcXVlcnlQcmV2aW91c1Jlc3VsdCh0aGlzTW92ZSk7XG4gICAgICAgICAgLy8gV2l0aGluIHRoZSBkZXRlcm1pbmlzdGljIGF0dGFjayBzZXF1ZW5jZSwgYW55IHByZXZpb3VzbHkgcGxheWVkIG1vdmUgaXMgcmVjb3JkZWQgYWdhaW4gYXMgaWYgaXQgaXMgYmVpbmcgcGxheWVkIG5vdyBzbyB0aGUgc2VxdWVuY2UgY2FuIGNvbnRpbnVlXG4gICAgICAgICAgcHJldmlvdXNNb3Zlcy5wdXNoKHsgbW92ZTogdGhpc01vdmUsIHJlc3VsdDogcHJldmlvdXNSZXN1bHQgfSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpc01vdmUgPSBzbWFydE1vdmUoKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBwcmV2aW91c01vdmVzLnB1c2goeyBtb3ZlOiB0aGlzTW92ZSB9KTtcblxuICAgIHJldHVybiB0aGlzTW92ZTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJhbmRvbU1vdmUoKSB7XG4gICAgY29uc3QgbW92ZSA9IFtcbiAgICAgIE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDEwKSxcbiAgICAgIE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDEwKSxcbiAgICBdO1xuICAgIHJldHVybiBtb3ZlO1xuICB9XG5cbiAgZnVuY3Rpb24gcGxheWVkUHJldmlvdXNseSh0aGlzTW92ZSkge1xuICAgIGNvbnN0IGNoZWNrTW92ZXMgPSBwcmV2aW91c01vdmVzLmZpbHRlcihcbiAgICAgICh0dXJuKSA9PiB0dXJuLm1vdmVbMF0gPT09IHRoaXNNb3ZlWzBdICYmIHR1cm4ubW92ZVsxXSA9PT0gdGhpc01vdmVbMV1cbiAgICApO1xuXG4gICAgaWYgKGNoZWNrTW92ZXNbMF0pIHJldHVybiB0cnVlO1xuXG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgZnVuY3Rpb24gcXVlcnlQcmV2aW91c1Jlc3VsdCh0aGlzTW92ZSkge1xuICAgIGNvbnN0IGNoZWNrTW92ZXMgPSBwcmV2aW91c01vdmVzLmZpbHRlcihcbiAgICAgICh0dXJuKSA9PiB0dXJuLm1vdmVbMF0gPT09IHRoaXNNb3ZlWzBdICYmIHR1cm4ubW92ZVsxXSA9PT0gdGhpc01vdmVbMV1cbiAgICApO1xuXG4gICAgcmV0dXJuIGNoZWNrTW92ZXNbMF0ucmVzdWx0O1xuICB9XG5cbiAgZnVuY3Rpb24gZXZhbHVhdGVMYXN0TW92ZSgpIHtcbiAgICBjb25zdCBsYXN0TW92ZSA9IHByZXZpb3VzTW92ZXNbcHJldmlvdXNNb3Zlcy5sZW5ndGggLSAxXS5tb3ZlO1xuXG4gICAgLy8gUmVzdWx0IGlzIHJlYWQgb2ZmIG9mIHRoZSBlbmVteSBnYW1lYm9hcmRcbiAgICBjb25zdCBmb3VuZFJlc3VsdCA9IGVuZW15Qm9hcmQuYm9hcmRBcnJheVtsYXN0TW92ZVswXV1bbGFzdE1vdmVbMV1dO1xuXG4gICAgLy8gQW5kIHN0b3JlZCBpbiB0aGUgcHJldmlvdXNNb3ZlIGFycmF5XG4gICAgcHJldmlvdXNNb3Zlc1twcmV2aW91c01vdmVzLmxlbmd0aCAtIDFdLnJlc3VsdCA9IGZvdW5kUmVzdWx0O1xuICB9XG5cbiAgZnVuY3Rpb24gc21hcnRNb3ZlKCkge1xuICAgIGxldCBuZXh0TW92ZTtcbiAgICBsZXQgbGFzdE1vdmUgPSBwcmV2aW91c01vdmVzW3ByZXZpb3VzTW92ZXMubGVuZ3RoIC0gMV07XG5cbiAgICAvLyBSZXNldCBhZnRlciBhIHNoaXAgaXMgc3Vua1xuICAgIGlmIChsYXN0TW92ZS5yZXN1bHQgPT09ICdzdW5rJykge1xuICAgICAgc2hpcEhpc3RvcnkgPSAnJztcblxuICAgICAgYWlNb2RlLmNvbHVtbkF4aXMgPSB0cnVlO1xuICAgICAgYWlNb2RlLnBvc0RpcmVjdGlvbiA9IHRydWU7XG5cbiAgICAgIHJldHVybiByYW5kb21Nb3ZlKCk7XG4gICAgfVxuXG4gICAgLy8gQXR0YWNrIHNlcXVlbmNlIGhpc3RvcnkgYmVnaW5zIHdpdGggdGhlIGZpcnN0IGhpdCBvbiBhIG5ldyBzaGlwXG4gICAgaWYgKHNoaXBIaXN0b3J5WzBdID09PSAnaCcgfHwgbGFzdE1vdmUucmVzdWx0ID09PSAnaGl0Jykge1xuICAgICAgc2hpcEhpc3RvcnkgPSBzaGlwSGlzdG9yeSArIGxhc3RNb3ZlLnJlc3VsdFswXTtcbiAgICB9XG5cbiAgICAvLyBJZiBubyBoaXN0b3J5LCBhIHNoaXAgaGFzIG5vdCBiZWVuIGRpc2NvdmVyZWQgeWV0XG4gICAgaWYgKCFzaGlwSGlzdG9yeSkgcmV0dXJuIHJhbmRvbU1vdmUoKTtcblxuXG4gICAgbGV0IFtzZWNvbmRMYXN0LCB0aGlyZExhc3QsIGZvdXJ0aExhc3QsIGZpZnRoTGFzdF0gPVxuICAgICAgZGVmaW5lUHJldmlvdXNNb3ZlVmFyaWFibGVzKCk7XG5cbiAgICAvKiBDb25kaXRpb25hbCBsb2dpYyBmb3IgRGV0ZXJtaW5pc3RpYyBBSSAqL1xuICAgIC8vIFNlY29uZCBwYXJhbWV0ZXIgaW4gdGhlIGZvbGxvd2luZyBmdW5jdGlvbnMgaXMgdGhlIHByZXZpb3VzIG1vdmUgaW4gcmVmZXJlbmNlIHRvIHdoaWNoIHRoZSBuZXh0IG1vdmUgc2hvdWxkIGJlIG1hZGVcblxuICAgIGlmIChsYXN0TW92ZS5yZXN1bHQgPT09ICdoaXQnKSB7XG4gICAgICBuZXh0TW92ZSA9IGNvbnRpbnVlU2FtZVBhdGgobGFzdE1vdmUpO1xuXG4gICAgICAvLyBJZiBoaXR0aW5nIGEgYm91bmRhcnksIGNhbGN1bGF0ZSBjb3JyZWN0IG1vdmUgdG8gYmFja3RyYWNrIGZyb21cbiAgICAgIGlmIChvdXRPZkJvdW5kcyhuZXh0TW92ZSkpIHtcbiAgICAgICAgbGV0IHJlZmVyZW5jZU1vdmU7XG4gICAgICAgIHN3aXRjaCAoc2hpcEhpc3RvcnkpIHtcbiAgICAgICAgICBjYXNlICdobWhoJzpcbiAgICAgICAgICAgIHJlZmVyZW5jZU1vdmUgPSBmb3VydGhMYXN0Lm1vdmU7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlICdobWgnOlxuICAgICAgICAgICAgcmVmZXJlbmNlTW92ZSA9IHRoaXJkTGFzdC5tb3ZlO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIHJlZmVyZW5jZU1vdmUgPSBsYXN0TW92ZS5tb3ZlO1xuICAgICAgICB9XG4gICAgICAgIHN3aXRjaERpcmVjdGlvbkF0RWRnZXMobmV4dE1vdmUpO1xuICAgICAgICBuZXh0TW92ZSA9IG1vdmVBY2NvcmRpbmdUb01vZGUocmVmZXJlbmNlTW92ZSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBuZXh0TW92ZTtcbiAgICB9XG5cbiAgICBpZiAoZmlmdGhMYXN0ICYmIGZpZnRoTGFzdC5yZXN1bHQgPT09ICdoaXQnKSB7XG4gICAgICByZXR1cm4ga2VlcEF4aXNTd2l0Y2hEaXJlY3Rpb24obmV4dE1vdmUsIGZpZnRoTGFzdCk7XG4gICAgfVxuICAgIGlmIChmb3VydGhMYXN0ICYmIGZvdXJ0aExhc3QucmVzdWx0ID09PSAnaGl0Jykge1xuICAgICAgcmV0dXJuIGtlZXBBeGlzU3dpdGNoRGlyZWN0aW9uKG5leHRNb3ZlLCBmb3VydGhMYXN0KTtcbiAgICB9XG4gICAgaWYgKHRoaXJkTGFzdCAmJiBzaGlwSGlzdG9yeSA9PT0gJ2htbScpIHtcbiAgICAgIHJldHVybiBzd2l0Y2hBeGlzT3JEaXJlY3Rpb24obmV4dE1vdmUsIHRoaXJkTGFzdCk7XG4gICAgfVxuICAgIGlmIChzZWNvbmRMYXN0ICYmIHNlY29uZExhc3QucmVzdWx0ID09PSAnaGl0Jykge1xuICAgICAgcmV0dXJuIHN3aXRjaEF4aXNPckRpcmVjdGlvbihuZXh0TW92ZSwgc2Vjb25kTGFzdCk7XG4gICAgfVxuXG4gICAgLy8gQSBmYWlsc2FmZSByZXNldCBmb3IgZW5jb3VudGVyaW5nIGEgY29uZGl0aW9uIG5vdCBsaXN0ZWQgYWJvdmUgKHNob3VsZCBub3QgYmUgY2FsbGVkKVxuICAgIGNvbnNvbGUubG9nKCdOb25lIG9mIHRoZSBhYm92ZSBjb25kaXRpb25zIGFwcGx5Jyk7XG4gICAgc2hpcEhpc3RvcnkgPSAnJztcbiAgICBhaU1vZGUuY29sdW1uQXhpcyA9IHRydWU7XG4gICAgYWlNb2RlLnBvc0RpcmVjdGlvbiA9IHRydWU7XG5cbiAgICByZXR1cm4gcmFuZG9tTW92ZSgpO1xuICB9XG5cbiAgLyogc21hcnRNb3ZlIEhlbHBlciBGdW5jdGlvbnMgKi9cbiAgZnVuY3Rpb24gZGVmaW5lUHJldmlvdXNNb3ZlVmFyaWFibGVzKCkge1xuICAgIGxldCBzZWNvbmRMYXN0O1xuICAgIGxldCB0aGlyZExhc3Q7XG4gICAgbGV0IGZvdXJ0aExhc3Q7XG4gICAgbGV0IGZpZnRoTGFzdDtcblxuICAgIGlmIChzaGlwSGlzdG9yeS5sZW5ndGggPj0gNSkge1xuICAgICAgZmlmdGhMYXN0ID0gcHJldmlvdXNNb3Zlc1twcmV2aW91c01vdmVzLmxlbmd0aCAtIDVdO1xuICAgIH1cbiAgICBpZiAoc2hpcEhpc3RvcnkubGVuZ3RoID49IDQpIHtcbiAgICAgIGZvdXJ0aExhc3QgPSBwcmV2aW91c01vdmVzW3ByZXZpb3VzTW92ZXMubGVuZ3RoIC0gNF07XG4gICAgfVxuICAgIGlmIChzaGlwSGlzdG9yeS5sZW5ndGggPj0gMykge1xuICAgICAgdGhpcmRMYXN0ID0gcHJldmlvdXNNb3Zlc1twcmV2aW91c01vdmVzLmxlbmd0aCAtIDNdO1xuICAgIH1cbiAgICBpZiAoc2hpcEhpc3RvcnkubGVuZ3RoID49IDIpIHtcbiAgICAgIHNlY29uZExhc3QgPSBwcmV2aW91c01vdmVzW3ByZXZpb3VzTW92ZXMubGVuZ3RoIC0gMl07XG4gICAgfVxuXG4gICAgcmV0dXJuIFtzZWNvbmRMYXN0LCB0aGlyZExhc3QsIGZvdXJ0aExhc3QsIGZpZnRoTGFzdF07XG4gIH1cblxuICBmdW5jdGlvbiBjb250aW51ZVNhbWVQYXRoKGxhc3RNb3ZlKSB7XG4gICAgcmV0dXJuIG1vdmVBY2NvcmRpbmdUb01vZGUobGFzdE1vdmUubW92ZSk7XG4gIH1cblxuICBmdW5jdGlvbiBrZWVwQXhpc1N3aXRjaERpcmVjdGlvbihuZXh0TW92ZSwgcmVmZXJlbmNlTW92ZSkge1xuICAgIGFpTW9kZS5wb3NEaXJlY3Rpb24gPSAhYWlNb2RlLnBvc0RpcmVjdGlvbjtcbiAgICBuZXh0TW92ZSA9IG1vdmVBY2NvcmRpbmdUb01vZGUocmVmZXJlbmNlTW92ZS5tb3ZlKTtcblxuICAgIGlmIChvdXRPZkJvdW5kcyhuZXh0TW92ZSkpIHtcbiAgICAgIHN3aXRjaERpcmVjdGlvbkF0RWRnZXMobmV4dE1vdmUpO1xuICAgICAgbmV4dE1vdmUgPSBtb3ZlQWNjb3JkaW5nVG9Nb2RlKHJlZmVyZW5jZU1vdmUubW92ZSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5leHRNb3ZlO1xuICB9XG5cbiAgZnVuY3Rpb24gc3dpdGNoQXhpc09yRGlyZWN0aW9uKG5leHRNb3ZlLCByZWZlcmVuY2VNb3ZlKSB7XG4gICAgaWYgKGFpTW9kZS5jb2x1bW5BeGlzICYmIGFpTW9kZS5wb3NEaXJlY3Rpb24pIHtcbiAgICAgIC8vIGluaXRpYWwgc3dpdGNoIHVwb24gZmlyc3QgbWlzcyBzaG91bGQgYmUgb2YgZGlyZWN0aW9uXG4gICAgICBhaU1vZGUucG9zRGlyZWN0aW9uID0gIWFpTW9kZS5wb3NEaXJlY3Rpb247XG4gICAgfSBlbHNlIGlmIChhaU1vZGUuY29sdW1uQXhpcyAmJiAhYWlNb2RlLnBvc0RpcmVjdGlvbikge1xuICAgICAgLy8gaWYgZGlyZWN0aW9uIGlzIGFscmVhZHkgc3dpdGNoZWQgcm93IGF4aXMgc2hvdWxkIGJlIHN0YXJ0ZWRcbiAgICAgIGFpTW9kZS5jb2x1bW5BeGlzID0gIWFpTW9kZS5jb2x1bW5BeGlzO1xuICAgICAgLy8gSWYgc2hpcCB0aGVuIG1pc3NlZCB0byBzaWRlLCBzd2l0Y2ggZGlyZWN0aW9uXG4gICAgfSBlbHNlIGlmICghYWlNb2RlLmNvbHVtbkF4aXMgJiYgIWFpTW9kZS5wb3NEaXJlY3Rpb24pIHtcbiAgICAgICFhaU1vZGUucG9zRGlyZWN0aW9uO1xuICAgIH1cblxuICAgIG5leHRNb3ZlID0gbW92ZUFjY29yZGluZ1RvTW9kZShyZWZlcmVuY2VNb3ZlLm1vdmUpO1xuXG4gICAgaWYgKG91dE9mQm91bmRzKG5leHRNb3ZlKSkge1xuICAgICAgc3dpdGNoRGlyZWN0aW9uQXRFZGdlcyhuZXh0TW92ZSk7XG4gICAgICBuZXh0TW92ZSA9IG1vdmVBY2NvcmRpbmdUb01vZGUocmVmZXJlbmNlTW92ZS5tb3ZlKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbmV4dE1vdmU7XG4gIH1cblxuICBmdW5jdGlvbiBtb3ZlQWNjb3JkaW5nVG9Nb2RlKFtyb3csIGNvbHVtbl0pIHtcbiAgICBpZiAoYWlNb2RlLmNvbHVtbkF4aXMgJiYgYWlNb2RlLnBvc0RpcmVjdGlvbikge1xuICAgICAgcmV0dXJuIFtyb3cgKyAxLCBjb2x1bW5dO1xuICAgIH0gZWxzZSBpZiAoYWlNb2RlLmNvbHVtbkF4aXMpIHtcbiAgICAgIHJldHVybiBbcm93IC0gMSwgY29sdW1uXTtcbiAgICB9IGVsc2UgaWYgKGFpTW9kZS5wb3NEaXJlY3Rpb24pIHtcbiAgICAgIHJldHVybiBbcm93LCBjb2x1bW4gKyAxXTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIFtyb3csIGNvbHVtbiAtIDFdO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIG91dE9mQm91bmRzKFtyb3csIGNvbHVtbl0pIHtcbiAgICBpZiAocm93ID4gOSB8fCByb3cgPCAwIHx8IGNvbHVtbiA+IDkgfHwgY29sdW1uIDwgMCkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gc3dpdGNoRGlyZWN0aW9uQXRFZGdlcyhbcm93LCBjb2x1bW5dKSB7XG4gICAgaWYgKHJvdyA+IDkgJiYgYWlNb2RlLmNvbHVtbkF4aXMgPT09IHRydWUpIHtcbiAgICAgIGFpTW9kZS5wb3NEaXJlY3Rpb24gPSBmYWxzZTtcbiAgICB9IGVsc2UgaWYgKHJvdyA8IDAgJiYgY29sdW1uID09IDApIHtcbiAgICAgIC8vIE9OTFkgaGFwcGVucyB3aXRoIGhvcml6b250YWwgc2hpcCBpbiB0b3AgbGVmdCBjb3JuZXJcbiAgICAgIGFpTW9kZS5jb2x1bW5BeGlzID0gZmFsc2U7XG4gICAgICBhaU1vZGUucG9zRGlyZWN0aW9uID0gdHJ1ZTtcbiAgICB9ZWxzZSBpZiAocm93IDwgMCkge1xuICAgICAgLy8gaWYgZGlyZWN0aW9uIGhhcyBhbHJlYWR5IGJlZW4gc3dpdGNoZWRcbiAgICAgIGFpTW9kZS5jb2x1bW5BeGlzID0gZmFsc2U7XG4gICAgfSBlbHNlIGlmIChjb2x1bW4gPCAwKSB7XG4gICAgICBhaU1vZGUucG9zRGlyZWN0aW9uID0gdHJ1ZTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4ge1xuICAgIG1ha2VBdHRhY2ssXG4gICAgYXNzaWduRW5lbXlHYW1lYm9hcmQsXG4gICAgYWlQbGF5LFxuICAgIGFpU21hcnRQbGF5LFxuICAgIC8vIEV2ZXJ5dGhpbmcgYmVsb3cgaXMgaW50ZXJuYWwgYW5kIHdhcyB1c2VkIG9ubHkgZm9yIHRlc3RpbmdcbiAgICBnZXQgZW5lbXlCb2FyZCgpIHtcbiAgICAgIHJldHVybiBlbmVteUJvYXJkO1xuICAgIH0sXG4gICAgZ2V0IHByZXZpb3VzTW92ZXMoKSB7XG4gICAgICByZXR1cm4gWy4uLnByZXZpb3VzTW92ZXNdO1xuICAgIH0sXG4gICAgLy8gT25seSBmb3IgdGVzdGluZyB3b3VsZCB0aGVzZSBldmVyIGJlIHNldFxuICAgIHNldCBwcmV2aW91c01vdmVzKGhpc3RvcnlBcnJheSkge1xuICAgICAgcHJldmlvdXNNb3ZlcyA9IGhpc3RvcnlBcnJheTtcbiAgICB9LFxuICAgIGFpTW9kZSxcbiAgICBzZXQgc2hpcEhpc3Rvcnkoc3RyaW5nKSB7XG4gICAgICBzaGlwSGlzdG9yeSA9IHN0cmluZztcbiAgICB9LFxuICB9O1xufVxuIiwiZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVNoaXAobGVuZ3RoKSB7XG4gICAgY29uc3Qgc2hpcEFycmF5ID0gQXJyYXkobGVuZ3RoKS5maWxsKDApO1xuXG4gICAgZnVuY3Rpb24gaGl0KHBvc2l0aW9uKSB7XG4gICAgICAgIC8qIDAgLSBub3QgaGl0OyAxIC0gaGl0ICovXG4gICAgICAgIHNoaXBBcnJheVtwb3NpdGlvbiAtIDFdID0gMTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaXNTdW5rKCkge1xuICAgICAgICBjb25zdCBoaXRzID0gc2hpcEFycmF5LmZpbHRlcihwb3NpdGlvbiA9PlxuICAgICAgICAgICAgcG9zaXRpb24gPT0gMSk7XG4gICAgICAgIHJldHVybiBoaXRzLmxlbmd0aCA9PSBsZW5ndGhcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBoaXQsXG4gICAgICAgIGdldCBzaGlwQXJyYXkoKXtcbiAgICAgICAgICAgIHJldHVybiBbLi4uc2hpcEFycmF5XVxuICAgICAgICB9LFxuICAgICAgICBnZXQgbGVuZ3RoKCkge1xuICAgICAgICAgICAgcmV0dXJuIGxlbmd0aFxuICAgICAgICB9LFxuICAgICAgICBpc1N1bmtcbiAgICB9XG59XG5cbiIsImltcG9ydCB7IGNyZWF0ZVNoaXAgfSBmcm9tICcuL3NoaXBzJztcbmltcG9ydCB7IHB1Ymxpc2ggfSBmcm9tICcuL3B1YnN1Yic7XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGNyZWF0ZUdhbWVib2FyZCgpIHtcbiAgbGV0IGJvYXJkQXJyYXkgPSBBcnJheSgxMClcbiAgICAuZmlsbChudWxsKVxuICAgIC5tYXAoKHgpID0+IEFycmF5KDEwKS5maWxsKG51bGwpKTtcblxuICBsZXQgZmxlZXQgPSBbXTtcblxuICAvKiBGcm9tIFdpa2lwZWRpYSAqL1xuICBjb25zdCBzaGlwTGVuZ3RocyA9IFs1LCA0LCAzLCAzLCAyXTtcbiAgY29uc3Qgc2hpcFR5cGVzID0gW1xuICAgICdjYXJyaWVyJyxcbiAgICAnYmF0dGxlc2hpcCcsXG4gICAgJ2Rlc3Ryb3llcicsXG4gICAgJ3N1Ym1hcmluZScsXG4gICAgJ3BhdHJvbCBib2F0JyxcbiAgXTtcblxuICBmdW5jdGlvbiBwbGFjZVNoaXAodHlwZSwgW3JvdywgY29sdW1uXSwgb3JpZW50YXRpb24pIHtcbiAgICBjb25zdCBzaGlwSW5kZXggPSBzaGlwVHlwZXMuaW5kZXhPZih0eXBlKTtcbiAgICBjb25zdCBzaGlwTGVuZ3RoID0gc2hpcExlbmd0aHNbc2hpcEluZGV4XTtcblxuICAgIC8qIFRlc3QgbGVnYWxpdHkgb2YgYWxsIHBvc2l0aW9ucyBiZWZvcmUgbWFya2luZyBhbnkgKi9cbiAgICBpc1NoaXBMZWdhbCh0eXBlLCBzaGlwTGVuZ3RoLCBvcmllbnRhdGlvbiwgW3JvdywgY29sdW1uXSk7XG5cbiAgICAvKiBNYXJrIGJvYXJkIGFycmF5ICovXG4gICAgZm9yIChsZXQgaSA9IDE7IGkgPD0gc2hpcExlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBzaGlwTWFya2VyID0gdHlwZVswXSArIGk7XG5cbiAgICAgIGlmIChpID09PSAxKSB7XG4gICAgICAgIGJvYXJkQXJyYXlbcm93XVtjb2x1bW5dID0gc2hpcE1hcmtlcjtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGlmIChvcmllbnRhdGlvbiA9PT0gJ2hvcml6b250YWwnKSB7XG4gICAgICAgIGJvYXJkQXJyYXlbcm93XVtjb2x1bW4gKyAoaSAtIDEpXSA9IHNoaXBNYXJrZXI7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBib2FyZEFycmF5W3JvdyArIChpIC0gMSldW2NvbHVtbl0gPSBzaGlwTWFya2VyO1xuICAgICAgfVxuICAgIH1cblxuICAgIGxldCBjcmVhdGVkU2hpcCA9IGNyZWF0ZVNoaXAoc2hpcExlbmd0aCk7XG4gICAgY3JlYXRlZFNoaXAudHlwZSA9IHR5cGU7XG4gICAgY3JlYXRlZFNoaXAub3JpZW50YXRpb24gPSBvcmllbnRhdGlvbjsgLy8gZm9yIGRyYWcgYW5kIGRyb3BcblxuICAgIGZsZWV0LnB1c2goY3JlYXRlZFNoaXApO1xuICB9XG5cbiAgZnVuY3Rpb24gaXNTaGlwTGVnYWwodHlwZSwgc2hpcExlbmd0aCwgb3JpZW50YXRpb24sIFtyb3csIGNvbHVtbl0pIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNoaXBMZW5ndGg7IGkrKykge1xuICAgICAgbGV0IHRlc3RTcXVhcmU7XG5cbiAgICAgIGlmIChvcmllbnRhdGlvbiA9PT0gJ2hvcml6b250YWwnKSB7XG4gICAgICAgIHRlc3RTcXVhcmUgPSBbcm93LCBjb2x1bW4gKyBpXTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRlc3RTcXVhcmUgPSBbcm93ICsgaSwgY29sdW1uXTtcbiAgICAgIH1cblxuICAgICAgaWYgKHRlc3RTcXVhcmVbMF0gPiA5IHx8IHRlc3RTcXVhcmVbMV0gPiA5KSB7XG4gICAgICAgIHRocm93ICdTaGlwIG91dHNpZGUgYm91bmRzIG9mIGJvYXJkJztcbiAgICAgIH1cbiAgICAgIGlmIChhZGphY2VudFNoaXAodGVzdFNxdWFyZSwgdHlwZSkpIHtcbiAgICAgICAgdGhyb3cgJ1NoaXAgYWRqYWNlbnQgdG8gYW5vdGhlciBzaGlwJztcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBwbGFjZUFsbFNoaXBzUmFuZG9tbHkoKSB7XG4gICAgZm9yIChjb25zdCBzaGlwIG9mIHNoaXBUeXBlcykge1xuICAgICAgYXR0ZW1wdFBsYWNlbWVudChzaGlwKTtcbiAgICB9XG4gIH1cblxuICBjb25zdCBvcmllbnRhdGlvbnMgPSBbJ2hvcml6b250YWwnLCAndmVydGljYWwnXTtcblxuICBmdW5jdGlvbiByYW5kb21Qb3NpdGlvbigpIHtcbiAgICByZXR1cm4gW01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDEwKSwgTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogMTApXTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGF0dGVtcHRQbGFjZW1lbnQoc2hpcCkge1xuICAgIGxldCBwb3NpdGlvbiA9IHJhbmRvbVBvc2l0aW9uKCk7XG4gICAgbGV0IG9yaWVudGF0aW9uID0gb3JpZW50YXRpb25zW01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDIpXTtcbiAgICB0cnkge1xuICAgICAgcGxhY2VTaGlwKHNoaXAsIHBvc2l0aW9uLCBvcmllbnRhdGlvbik7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGF0dGVtcHRQbGFjZW1lbnQoc2hpcCk7XG4gICAgfVxuICB9XG5cbiAgLyogSGVscGVyIGZ1bmN0aW9ucyBmb3IgdGVzdGluZyBzaGlwIGxlZ2FsaXR5ICovXG4gIGZ1bmN0aW9uIGFkamFjZW50U2hpcChbcm93LCBjb2xdLCBzaGlwTWFya2VyKSB7XG4gICAgY29uc3QgYm91bmRpbmdTcXVhcmVzID0gZGVmaW5lQm91bmRpbmdCb3goW3JvdywgY29sXSk7XG4gICAgZm9yIChjb25zdCBbc3FSb3csIHNxQ29sXSBvZiBib3VuZGluZ1NxdWFyZXMpIHtcbiAgICAgIGxldCB0ZXN0ID0gYm9hcmRBcnJheVtzcVJvd11bc3FDb2xdO1xuICAgICAgaWYgKHRlc3QgJiYgdGVzdFswXSAhPT0gc2hpcE1hcmtlclswXSkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgZnVuY3Rpb24gZGVmaW5lQm91bmRpbmdCb3goW3JvdywgY29sXSkge1xuICAgIGNvbnN0IHNxdWFyZXMgPSBbXTtcbiAgICAvLyBDbG9ja3dpc2UgY2lyY2xlIGZyb20gdG9wIGxlZnRcbiAgICBzcXVhcmVzLnB1c2goXG4gICAgICBbcm93IC0gMSwgY29sIC0gMV0sXG4gICAgICBbcm93IC0gMSwgY29sXSxcbiAgICAgIFtyb3cgLSAxLCBjb2wgKyAxXSxcbiAgICAgIFtyb3csIGNvbCArIDFdLFxuICAgICAgW3JvdyArIDEsIGNvbCArIDFdLFxuICAgICAgW3JvdyArIDEsIGNvbF0sXG4gICAgICBbcm93ICsgMSwgY29sIC0gMV0sXG4gICAgICBbcm93LCBjb2wgLSAxXVxuICAgICk7XG5cbiAgICBjb25zdCB3aXRoaW5Cb2FyZCA9IHNxdWFyZXMuZmlsdGVyKChbc3FSb3csIHNxQ29sXSkgPT4ge1xuICAgICAgcmV0dXJuIHNxUm93ID4gLTEgJiYgc3FSb3cgPCAxMCAmJiBzcUNvbCA+IC0xICYmIHNxQ29sIDwgMTA7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gd2l0aGluQm9hcmQ7XG4gIH1cblxuICBmdW5jdGlvbiByZWNlaXZlQXR0YWNrKFtyb3csIGNvbHVtbl0pIHtcbiAgICBjb25zdCB2YWx1ZUF0UG9zaXRpb24gPSBib2FyZEFycmF5W3Jvd11bY29sdW1uXTtcblxuICAgIGlmICghdmFsdWVBdFBvc2l0aW9uKSB7XG4gICAgICBib2FyZEFycmF5W3Jvd11bY29sdW1uXSA9ICdtaXNzJztcbiAgICAgIHB1Ymxpc2goJ21pc3MnLCBbcm93LCBjb2x1bW5dKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgaGl0U2hpcCA9IGZsZWV0LmZpbHRlcihcbiAgICAgIChzaGlwKSA9PiBzaGlwLnR5cGVbMF0gPT09IHZhbHVlQXRQb3NpdGlvblswXVxuICAgIClbMF07XG4gICAgaGl0U2hpcC5oaXQodmFsdWVBdFBvc2l0aW9uWzFdKTtcbiAgICBib2FyZEFycmF5W3Jvd11bY29sdW1uXSA9ICdoaXQnO1xuICAgIHB1Ymxpc2goJ2hpdCcsIFtyb3csIGNvbHVtbl0pO1xuXG4gICAgaWYgKGhpdFNoaXAuaXNTdW5rKCkpIHtcbiAgICAgIHB1Ymxpc2goJ3NoaXBTdW5rJywgW2hpdFNoaXAsIFtyb3csIGNvbHVtbl1dKTtcbiAgICAgIGJvYXJkQXJyYXlbcm93XVtjb2x1bW5dID0gJ3N1bmsnO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGlzRmxlZXRTdW5rKCkge1xuICAgIGNvbnN0IHN1bmtTaGlwcyA9IGZsZWV0LmZpbHRlcigoc2hpcCkgPT4gc2hpcC5pc1N1bmsoKSA9PT0gdHJ1ZSk7XG4gICAgcmV0dXJuIHN1bmtTaGlwcy5sZW5ndGggPT09IGZsZWV0Lmxlbmd0aDtcbiAgfVxuXG4gIGZ1bmN0aW9uIGNsZWFyU2hpcEZyb21Cb2FyZCh0eXBlKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCAxMDsgaSsrKSB7XG4gICAgICBmb3IgKGxldCBqID0gMDsgaiA8IDEwOyBqKyspIHtcbiAgICAgICAgaWYgKGJvYXJkQXJyYXlbaV1bal0gJiYgYm9hcmRBcnJheVtpXVtqXVswXSA9PT0gdHlwZVswXSkge1xuICAgICAgICAgIGJvYXJkQXJyYXlbaV1bal0gPSBudWxsO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gY2xlYXJTaGlwRnJvbUZsZWV0KHR5cGUpIHtcbiAgICBmbGVldCA9IGZsZWV0LmZpbHRlcigoeCkgPT4geC50eXBlICE9PSB0eXBlKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGNsZWFyQm9hcmQoKSB7XG4gICAgZmxlZXQgPSBbXTtcbiAgICBib2FyZEFycmF5ID0gQXJyYXkoMTApXG4gICAgICAuZmlsbChudWxsKVxuICAgICAgLm1hcCgoeCkgPT4gQXJyYXkoMTApLmZpbGwobnVsbCkpO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBnZXQgYm9hcmRBcnJheSgpIHtcbiAgICAgIC8qIDJEIGFycmF5IHNvIGVhY2ggZWxlbWVudCBuZWVkcyBkZXN0cnVjdHVyaW5nICovXG4gICAgICByZXR1cm4gYm9hcmRBcnJheS5tYXAoKHgpID0+IFsuLi54XSk7XG4gICAgfSxcbiAgICByZWNlaXZlQXR0YWNrLFxuICAgIHBsYWNlU2hpcCxcbiAgICBwbGFjZUFsbFNoaXBzUmFuZG9tbHksXG4gICAgZ2V0IGZsZWV0KCkge1xuICAgICAgcmV0dXJuIFsuLi5mbGVldF07XG4gICAgfSxcbiAgICBpc0ZsZWV0U3VuayxcbiAgICAvLyBUaGUgZm9sbG93aW5nIGltcGxlbWVudGVkIGZvciB1c2UgYnkgdGhlIGRyYWcgYW5kIGRyb3Agc2hpcCBwbGFjZW1lbnQuIEFsc28gY2hhbmdlZCBib3RoIGJvYXJkIGFuZCBmbGVldCBhcnJheXMgdG8gbGV0IGluc3RlYWQgb2YgY29uc3QgZm9yIHRoaXNcbiAgICBpc1NoaXBMZWdhbCxcbiAgICBjbGVhclNoaXBGcm9tQm9hcmQsXG4gICAgY2xlYXJTaGlwRnJvbUZsZWV0LFxuICAgIGNsZWFyQm9hcmQsXG4gIH07XG59XG4iLCJpbXBvcnQge1xuICBjcmVhdGVDb250YWluZXJzLFxuICBtYWtlQW5ub3VuY2VtZW50cyxcbiAgY2xpY2tMaXN0ZW5lcixcbiAgcmVuZGVyQm9hcmQsXG4gIHJlbmRlclR1cm5TY3JlZW4sXG4gIHJlbmRlclN0YXJ0U2NyZWVuLFxufSBmcm9tICcuL2RvbSc7XG5pbXBvcnQgeyByZW5kZXJTaGlwU2NyZWVuIH0gZnJvbSAnLi9kcmFnRHJvcCc7XG5pbXBvcnQgY3JlYXRlUGxheWVyIGZyb20gJy4vcGxheWVyJztcbmltcG9ydCBjcmVhdGVHYW1lYm9hcmQgZnJvbSAnLi9nYW1lYm9hcmQnO1xuaW1wb3J0IHsgc3Vic2NyaWJlLCBwdWJsaXNoIH0gZnJvbSAnLi9wdWJzdWInO1xuXG5leHBvcnQgZnVuY3Rpb24gbmV3R2FtZSgpIHtcbiAgY3JlYXRlQ29udGFpbmVycygpO1xuXG4gIGNvbnN0IHBsYXllcjEgPSBjcmVhdGVQbGF5ZXIoKTtcbiAgY29uc3QgcGxheWVyMiA9IGNyZWF0ZVBsYXllcigpO1xuXG4gIGNvbnN0IGJvYXJkMSA9IGNyZWF0ZUdhbWVib2FyZCgpO1xuICBjb25zdCBib2FyZDIgPSBjcmVhdGVHYW1lYm9hcmQoKTtcblxuICBwbGF5ZXIxLmFzc2lnbkVuZW15R2FtZWJvYXJkKGJvYXJkMik7XG4gIHBsYXllcjIuYXNzaWduRW5lbXlHYW1lYm9hcmQoYm9hcmQxKTtcblxuICBib2FyZDEucGxhY2VBbGxTaGlwc1JhbmRvbWx5KCk7XG4gIGJvYXJkMi5wbGFjZUFsbFNoaXBzUmFuZG9tbHkoKTtcblxuICAvLyBFdmVudCBsaXN0ZW5lcnMgdG8gdHJhY2sgZ2FtZSBldmVudHNcbiAgbWFrZUFubm91bmNlbWVudHMoKTtcblxuICAvLyBFdmVudCBsaXN0ZW5lcnMgdG8gc2VsZWN0IHR5cGUgb2YgZ2FtZVxuICBjb25zdCBbc2luZ2xlUGxheWVyQnV0dG9uLCB0d29QbGF5ZXJCdXR0b25dID0gcmVuZGVyU3RhcnRTY3JlZW4oKTtcblxuICBzaW5nbGVQbGF5ZXJCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoZXYpID0+IHtcbiAgICBldi5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5zdGFydC1zY3JlZW4nKS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuXG4gICAgcGxheWVyVnNBSUxvb3AoeyBwbGF5ZXIxLCBwbGF5ZXIyLCBib2FyZDEsIGJvYXJkMiB9KTtcbiAgfSk7XG5cbiAgdHdvUGxheWVyQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKGV2KSA9PiB7XG4gICAgZXYucHJldmVudERlZmF1bHQoKTtcbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuc3RhcnQtc2NyZWVuJykuc3R5bGUuZGlzcGxheSA9ICdub25lJztcblxuICAgIHR3b1BsYXllckdhbWVMb29wKHsgcGxheWVyMSwgcGxheWVyMiwgYm9hcmQxLCBib2FyZDIgfSk7XG4gIH0pO1xufVxuXG5mdW5jdGlvbiBwbGF5ZXJWc0FJTG9vcCh7IHBsYXllcjEsIHBsYXllcjIsIGJvYXJkMSwgYm9hcmQyIH0pIHtcbiAgcmVuZGVyU2hpcFNjcmVlbihib2FyZDEpOyAvLyBpbnRlcmVzdGluZyB0aGF0IGRvaW5nIHNvbWV0aGluZyB3aXRoIHRoaXMgcHJvbWlzZSBpcyBub3QgbmVjZXNzYXJ5XG5cbiAgcmVuZGVyQm9hcmQoYm9hcmQxLmJvYXJkQXJyYXksICdvd24nKTtcbiAgcmVuZGVyQm9hcmQoYm9hcmQyLmJvYXJkQXJyYXksICdlbmVteScpO1xuXG4gIC8vIE1ha2UgYm9hcmQgY2xpY2thYmxlIHRvIGh1bWFuIHBsYXllclxuICBjbGlja0xpc3RlbmVyKHBsYXllcjEsICdlbmVteScpO1xuXG4gIHN1YnNjcmliZSgnc3F1YXJlQXR0YWNrZWQnLCBodW1hbkF0dGFjayk7XG5cbiAgZnVuY3Rpb24gaHVtYW5BdHRhY2soW3BsYXllciwgdGFyZ2V0XSkge1xuICAgIHB1Ymxpc2goJ3RhcmdldENoYW5nZScsICdlbmVteScpO1xuXG4gICAgcGxheWVyLm1ha2VBdHRhY2soW3RhcmdldFswXSwgdGFyZ2V0WzFdXSk7XG5cbiAgICByZW5kZXJCb2FyZChib2FyZDIuYm9hcmRBcnJheSwgJ2VuZW15Jyk7XG5cbiAgICBpZiAoYm9hcmQyLmlzRmxlZXRTdW5rKCkpIHtcbiAgICAgIHB1Ymxpc2goJ2ZsZWV0U3VuaycsIFsnQ29tcHV0ZXInLCAnSHVtYW4nXSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICBwdWJsaXNoKCd0YXJnZXRDaGFuZ2UnLCAnb3duJyk7XG5cbiAgICAgIHBsYXllcjIubWFrZUF0dGFjayhwbGF5ZXIyLmFpU21hcnRQbGF5KCkpO1xuICAgICAgcmVuZGVyQm9hcmQoYm9hcmQxLmJvYXJkQXJyYXksICdvd24nKTtcblxuICAgICAgaWYgKGJvYXJkMS5pc0ZsZWV0U3VuaygpKSB7XG4gICAgICAgIHB1Ymxpc2goJ2ZsZWV0U3VuaycsIFsnSHVtYW4nLCAnQ29tcHV0ZXInXSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgc2V0VGltZW91dCgoKSA9PiB7fSwgMTUwMCk7XG4gICAgfSwgMTAwMCk7XG4gIH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gdHdvUGxheWVyR2FtZUxvb3AoeyBwbGF5ZXIxLCBwbGF5ZXIyLCBib2FyZDEsIGJvYXJkMiB9KSB7XG4gIFxuICBhd2FpdCByZW5kZXJUdXJuU2NyZWVuKCdQTEFZRVIgMScpLnRoZW4oY29uc29sZS5sb2cpXG4gIGF3YWl0IHJlbmRlclNoaXBTY3JlZW4oYm9hcmQxKS50aGVuKGNvbnNvbGUubG9nKTtcblxuICBhd2FpdCByZW5kZXJUdXJuU2NyZWVuKCdQTEFZRVIgMicpLnRoZW4oY29uc29sZS5sb2cpO1xuICBhd2FpdCByZW5kZXJTaGlwU2NyZWVuKGJvYXJkMikudGhlbihjb25zb2xlLmxvZyk7XG5cbiAgLy8gR2FtZSBsb29wXG5cbn1cbiIsImltcG9ydCB7IG5ld0dhbWUgfSBmcm9tICcuL2dhbWUuanMnO1xuXG5uZXdHYW1lKCk7XG5cbiJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==
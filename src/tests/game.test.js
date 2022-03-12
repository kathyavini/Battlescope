/**
 * @jest-environment jsdom
 */

import { screen } from '@testing-library/dom';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { newGame } from '../game';

const { player1, player2, board1, board2 } = newGame();

test('Initial page load snapshot', () => {
  const body = document.querySelector('body');
  expect(body).toMatchSnapshot();
});

test('1 Player button loads ship placement screen', () => {
  const onePlayerBtn = screen.getByText('1-Player');
  userEvent.click(onePlayerBtn);

  const shipPlacementInstructions = screen.getByText('Hide your wildlife');

  expect(shipPlacementInstructions).toBeInTheDocument();
});

test('Ship placement board contains 5 ships', () => {
  const draggableShips = document.querySelectorAll('.draggable-ship');
  expect(draggableShips.length).toBe(5);
});

test('Ships are placed according to underlying gameboard', () => {
    const testShip = document.querySelector('.draggable-ship');
    const [row, col] = testShip.parentElement.dataset.pos;
    const boardValue = board1.boardArray[row][col];
    expect(boardValue).not.toBeNull()
});

test('Randomize button changes location of ship elements - only tests one square; rerun test if it fails', () => {
    const testShip1 = document.querySelector('.draggable-ship');
    const [row1, col1] = testShip1.parentElement.dataset.pos;

    const randomizeBtn = screen.getByText('Randomize');
    userEvent.click(randomizeBtn);

    const testShip2 = document.querySelector('.draggable-ship');
    const [row2, col2] = testShip2.parentElement.dataset.pos;

    // Technically it could coincidentally be true
    expect(row1 === row2 && col1 === col2).toBe(false);
})

test('Randomize button changes underlying gameboard', () => {
    const initialBoard = board1.boardArray;

    const randomizeBtn = screen.getByText('Randomize');
    userEvent.click(randomizeBtn);

    const newBoard = board1.boardArray;
    expect(initialBoard).not.toEqual(newBoard);
})

test("Start button doesn't alter underlying gameboard", () => {
    const initialBoard = board1.boardArray;
    
    const startBtn = screen.getByText('Start');
    userEvent.click(startBtn);

    const newBoard = board1.boardArray;
    expect(initialBoard).toEqual(newBoard);
})
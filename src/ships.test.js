import { createShip } from './ships';

test('ship factory returns object with given length', () => {
  expect(createShip(3).length).toBe(3);
});

/* private data - test to be removed later */
test('ship factory creates array with given length', () => {
    expect(createShip(3).shipArray).toEqual([0, 0, 0]);
  });
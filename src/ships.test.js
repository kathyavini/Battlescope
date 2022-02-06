import { createShip } from './ships';

test('ship factory returns object with given length', () => {
  expect(createShip(5).length).toBe(5);
});

/* private data - test to be removed later? */
test('returned object contains array of given length', () => {
  expect(createShip(5).shipArray).toEqual([0, 0, 0, 0, 0]);
});

test('hit function marks position 1 as hit', () => {
  expect(createShip(3).hit(1).shipArray).toEqual([1, 0, 0]);
});

test('hit function marks position 3 as hit', () => {
  expect(createShip(3).hit(3).shipArray).toEqual([0, 0, 1]);
});

test('isSunk() returns false if only hit once', () => {
  expect(createShip(3).hit(3).isSunk()).toBe(false);
});

test('isSunk() returns true if hit length times', () => {
  expect(createShip(3).hit(1).hit(2).hit(3).isSunk()).toBe(true);
});

test('Getter blocks messing with ship length', () => {
  function reassignLength() {
    createShip(2).length = 2
  }
  expect(reassignLength).toThrow();
})

test('Getter blocks messing with ship array', () => {
  const testShip3 = createShip(3)
    testShip3.shipArray[1] = 'test value'
  expect(testShip3.shipArray[1]).toBe(0);
})


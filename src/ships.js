export function createShip(length) {

    const shipArray = Array(length).fill(0);

    function hit() {
    }

    function isSunk() {
    }

    return {
        shipArray,
        length,
        hit,
        isSunk
    }
}


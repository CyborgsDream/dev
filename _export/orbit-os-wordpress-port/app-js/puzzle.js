WinAPI.createWindow('puzzle-game');

const puzzleState = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,0];

window.initPuzzleGame = function() {
    shuffleArray(puzzleState);
    const board = document.getElementById('puzzle-board');
    if (!board) return;
    board.innerHTML = '';
    for (let i = 0; i < 16; i++) {
        const value = puzzleState[i];
        const tile = document.createElement('div');
        tile.className = `game-tile ${value === 0 ? 'empty' : ''}`;
        tile.textContent = value === 0 ? '' : value;
        tile.dataset.index = i;
        tile.dataset.value = value;
        if (value !== 0) {
            tile.addEventListener('click', () => moveTile(i));
        }
        board.appendChild(tile);
    }
};

window.moveTile = function(index) {
    const emptyIndex = puzzleState.indexOf(0);
    const row = Math.floor(index / 4);
    const col = index % 4;
    const emptyRow = Math.floor(emptyIndex / 4);
    const emptyCol = emptyIndex % 4;

    if ((Math.abs(row - emptyRow) === 1 && col === emptyCol) ||
        (Math.abs(col - emptyCol) === 1 && row === emptyRow)) {
        [puzzleState[index], puzzleState[emptyIndex]] = [puzzleState[emptyIndex], puzzleState[index]];
        window.initPuzzleGame();
        if (isPuzzleSolved()) {
            setTimeout(() => alert('Congratulations! Puzzle solved!'), 100);
        }
    }
};

function isPuzzleSolved() {
    for (let i = 0; i < 15; i++) {
        if (puzzleState[i] !== i + 1) return false;
    }
    return puzzleState[15] === 0;
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    let inversions = 0;
    for (let i = 0; i < array.length; i++) {
        for (let j = i + 1; j < array.length; j++) {
            if (array[i] > array[j] && array[i] !== 0 && array[j] !== 0) {
                inversions++;
            }
        }
    }
    const emptyRow = 4 - Math.floor(array.indexOf(0) / 4);
    if ((inversions % 2 === 0) !== (emptyRow % 2 === 1)) {
        if (array[0] !== 0 && array[1] !== 0) {
            [array[0], array[1]] = [array[1], array[0]];
        } else {
            [array[2], array[3]] = [array[3], array[2]];
        }
    }
}

window.initPuzzleGame();

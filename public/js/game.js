const GameStatus = {
  inProgress: 1,
  gameOver: 2
}

const Game = (() => {
  let canvas = [],
    context = [],
    grid = [],
    gridHeight = 380,
    gridWidth = 380,
    gridBorder = 1,
    gridRows = 10,
    gridCols = 10,
    markPadding = 5,
    shipPadding = 1,
    squareHeight = (gridHeight - gridBorder * gridRows - gridBorder) / gridRows,
    squareWidth = (gridWidth - gridBorder * gridCols - gridBorder) / gridCols,
    turn = false,
    gameStatus,
    squareHover = {
      x: -1,
      y: -1
    };

  canvas[0] = document.getElementById('player-grid1'); // Your grid
  canvas[1] = document.getElementById('player-grid2'); // Opponent's grid
  context[0] = canvas[0].getContext('2d');
  context[1] = canvas[1].getContext('2d');

  // Highlight on hover...
  canvas[1].addEventListener('mousemove', function(e) {
    var pos = getCanvasCoordinates(e, canvas[1]);
    squareHover = getSquare(pos.x, pos.y);
    drawGrid(1);
  });

  // No highlight once mouse leaves...
  canvas[1].addEventListener('mouseout', function(e) {
    squareHover = {
      x: -1,
      y: -1
    };
    drawGrid(1);
  });

  // Click to fire a shot...
  canvas[1].addEventListener('click', function(e) {
    if (turn) {
      var pos = getCanvasCoordinates(e, canvas[1]);
      var square = getSquare(pos.x, pos.y);
      sendShot(square);
    }
  });

  // Get the coordinates of square...
  const getSquare = (x, y) => {
    return {
      x: Math.floor(x / (gridWidth / gridCols)),
      y: Math.floor(y / (gridHeight / gridRows))
    };
  };

  // Get the mouse position on the canvas...
  const getCanvasCoordinates = (event, canvas) => {
    rect = canvas.getBoundingClientRect();
    return {
      x: Math.round((event.clientX - rect.left) / (rect.right - rect.left) * canvas.width),
      y: Math.round((event.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height)
    };
  };

  // Init a game...
  const initGame = () => {

    gameStatus = GameStatus.inProgress;

    // Create the empty grids for both...
    grid[0] = {
      shots: Array(gridRows * gridCols),
      ships: []
    };
    grid[1] = {
      shots: Array(gridRows * gridCols),
      ships: []
    };

    for (let i = 0; i < gridRows * gridCols; i++) {
      grid[0].shots[i] = 0;
      grid[1].shots[i] = 0;
    }

    // Reset turns in UI
    $('#turn-status').removeClass('alert-your-turn').removeClass('alert-opponent-turn').removeClass('alert-winner').removeClass('alert-loser');

    drawGrid(0);
    drawGrid(1);
  };

  // Get state and update grid...
  const updateGrid = (player, gridState) => {
    grid[player] = gridState;
    drawGrid(player);
  };

  // Set a turn...
  const setTurn = (turnState) => {
    if (gameStatus !== GameStatus.gameOver) {
      turn = turnState;

      if (turn) {
        $('#turn-status').removeClass('alert-opponent-turn').addClass('alert-your-turn').html('Your Turn <br /> GO!');
      } else {
        $('#turn-status').removeClass('alert-your-turn').addClass('alert-opponent-turn').html('Opponent\'s Turn...');
      }
    }
  };

  // Handle game over...
  const setGameOver = (isWinner) => {
    gameStatus = GameStatus.gameOver;
    turn = false;

    if (isWinner) {
      $('#turn-status').removeClass('alert-opponent-turn').removeClass('alert-your-turn').addClass('alert-winner').html('You Won 😎 <br /> <a href="#" class="btn-leave-game">Play Again?</a>');
    } else {
      $('#turn-status').removeClass('alert-opponent-turn').removeClass('alert-your-turn').addClass('alert-loser').html('You Lost 🤕 <br /> <a href="#" class="btn-leave-game">Play Again?</a>');
    }
    $('.btn-leave-game').click(sendLeaveRequest);
  }

  // Draw grid with all data...
  const drawGrid = (gridIndex) => {
    drawSquares(gridIndex);
    drawShips(gridIndex);
    drawMarks(gridIndex);
  };

  // Draw sqaures...
  const drawSquares = (gridIndex) => {

    context[gridIndex].fillStyle = '#1d1e21'
    context[gridIndex].fillRect(0, 0, gridWidth, gridHeight);

    for (let i = 0; i < gridRows; i++) {
      for (let j = 0; j < gridCols; j++) {
        let squareX = j * (squareWidth + gridBorder) + gridBorder;
        let squareY = i * (squareHeight + gridBorder) + gridBorder;

        context[gridIndex].fillStyle = '#2a2b30'

        if (j === squareHover.x && i === squareHover.y && gridIndex === 1 && grid[gridIndex].shots[i * gridCols + j] === 0 && turn) {
          context[gridIndex].fillStyle = '#5c5edc';
        }

        context[gridIndex].fillRect(squareX, squareY, squareWidth, squareHeight);
      }
    }
  };

  // Draw the ships...
  const drawShips = (gridIndex) => {

    context[gridIndex].fillStyle = '#5c5edc';

    for (let i = 0; i < grid[gridIndex].ships.length; i++) {
      let ship = grid[gridIndex].ships[i];

      let x = ship.x * (squareWidth + gridBorder) + gridBorder + shipPadding;
      let y = ship.y * (squareHeight + gridBorder) + gridBorder + shipPadding;
      let shipWidth = squareWidth - shipPadding * 2;
      let shipLength = squareWidth * ship.size + (gridBorder * (ship.size - 1)) - shipPadding * 2;

      if (ship.horizontal) {
        context[gridIndex].fillRect(x, y, shipLength, shipWidth);
      } else {
        context[gridIndex].fillRect(x, y, shipWidth, shipLength);
      }
    }
  };

  // Draw the shotmarks x for miss and circle for hit...
  const drawMarks = (gridIndex) => {

    for (let i = 0; i < gridRows; i++) {
      for (let j = 0; j < gridCols; j++) {
        let squareX = j * (squareWidth + gridBorder) + gridBorder;
        let squareY = i * (squareHeight + gridBorder) + gridBorder;

        if (grid[gridIndex].shots[i * gridCols + j] === 1) {
          context[gridIndex].beginPath();
          context[gridIndex].moveTo(squareX + markPadding, squareY + markPadding);
          context[gridIndex].lineTo(squareX + squareWidth - markPadding, squareY + squareHeight - markPadding);
          context[gridIndex].moveTo(squareX + squareWidth - markPadding, squareY + markPadding);
          context[gridIndex].lineTo(squareX + markPadding, squareY + squareHeight - markPadding);
          context[gridIndex].strokeStyle = '#5c5edc';
          context[gridIndex].stroke();
        } else if (grid[gridIndex].shots[i * gridCols + j] === 2) {
          context[gridIndex].beginPath();
          context[gridIndex].arc(squareX + squareWidth / 2, squareY + squareWidth / 2, squareWidth / 2 - markPadding, 0, 2 * Math.PI, false);
          context[gridIndex].fillStyle = '#b32927';
          context[gridIndex].fill();
        }
      }
    }
  };

  return {'initGame': initGame, 'updateGrid': updateGrid, 'setTurn': setTurn, 'setGameOver': setGameOver};
})();

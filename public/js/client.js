var socket = io();

$(() => {

  // Socket connected to server...
  socket.on('connect', () => {
    console.log('Connected to server');
    $('#disconnected').hide();
    $('#waiting-room').show();
  });

  // Socket disconnected from sever...
  socket.on('disconnect', () => {
    console.log('Disconnected from server');
    $('#waiting-room').hide();
    $('#game').hide();
    $('#disconnected').show();
  });

  // User has joined init the game...
  socket.on('join', (gameId) => {
    Game.initGame();
    $('#messages').empty();
    $('#disconnected').hide();
    $('#waiting-room').hide();
    $('#game').show();
    $('#room-number').html(gameId);
  })

  // Keeping track of game state...
  socket.on('update', (gameState) => {
    Game.setTurn(gameState.turn);
    Game.updateGrid(gameState.gridIndex, gameState.grid);
  });

  // In game chat message...
  socket.on('chat', (msg) => {
    $('#messages').append('<li><strong>' + msg.name + ':</strong> ' + msg.message + '</li>');
    $('#messages-list').scrollTop($('#messages-list')[0].scrollHeight);
  });

  // In game notification i.e. player has left game...
  socket.on('notification', (msg) => {
    $('#messages').append('<li>' + msg.message + '</li>');
    $('#messages-list').scrollTop($('#messages-list')[0].scrollHeight);
  });

  // Game over event...
  socket.on('gameover', (isWinner) => {
    Game.setGameOver(isWinner);
  });

  // Leave and go back in the waiting romm to wait...
  socket.on('leave', () => {
    $('#game').hide();
    $('#waiting-room').show();
  });

  // Submit chat to server...
  $('#message-form').submit(() => {
    socket.emit('chat', $('#message').val());
    $('#message').val('');
    return false;
  });

});

// Submit leave game request to server...
const sendLeaveRequest = (e) => {
  e.preventDefault();
  socket.emit('leave');
}

// Submit shot coordinates to server...
const sendShot = (square) => {
  socket.emit('shot', square);
}

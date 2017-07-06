const path = require('path');
const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const Entities = require('html-entities').AllHtmlEntities;
const entities = new Entities();

const BattleshipGame = require('./app/game.js');
const GameStatus = require('./app/status.js');

app.use(express.static(path.join(__dirname + '/public')));

const port = process.env.PORT || 3000;

http.listen(port, () => {
  console.log(`Listening on port ${port}`);
});

const users = {};
let gameRoomNum = 1;

// Create the game if there are at least 2 players in waiting room...
const joinWaitingPlayers = () => {
  let players = getClientsInRoom('waiting room');

  if (players.length >= 2) {

    let game = new BattleshipGame(gameRoomNum++, players[0].id, players[1].id);

    // Create the room for the game and assign it the game.id...
    players[0].leave('waiting room');
    players[1].leave('waiting room');
    players[0].join('game' + game.id);
    players[1].join('game' + game.id);

    users[players[0].id].player = 0;
    users[players[1].id].player = 1;
    users[players[0].id].inGame = game;
    users[players[1].id].inGame = game;

    io.to('game' + game.id).emit('join', game.id);

    // Emit the ship placements on grid...
    io.to(players[0].id).emit('update', game.getGameState(0, 0));
    io.to(players[1].id).emit('update', game.getGameState(1, 1));

    console.log(`${new Date().toISOString()} Players with socketIDs: ${players[0].id} & ${players[1].id} have started a game in room # ${game.id}.`);
  }
}

// Get all the clients in the room push the into an array...
const getClientsInRoom = (room) => {
  const clients = [];
  for (var id in io.sockets.adapter.rooms[room]) {
    clients.push(io.sockets.adapter.nsp.connected[id]);
  }
  return clients;
}

// Handle leave game event...
const leaveGame = (socket) => {
  if (users[socket.id].inGame !== null) {
    console.log(`${new Date().toISOString()} Player with socketID: ${socket.id} has left Room # ${users[socket.id].inGame.id}`);

    // Broadcast to opponent...
    socket.broadcast.to('game' + users[socket.id].inGame.id).emit('notification', {message: 'Opponent has left the game'});

    if (users[socket.id].inGame.gameStatus !== GameStatus.gameOver) {
      users[socket.id].inGame.abortGame(users[socket.id].player);
      checkGameOver(users[socket.id].inGame);
    }

    socket.leave('game' + users[socket.id].inGame.id);

    users[socket.id].inGame = null;
    users[socket.id].player = null;

    io.to(socket.id).emit('leave');
  }
}

// Check to see if game is over...
const checkGameOver = (game) => {
  if (game.gameStatus === GameStatus.gameOver) {
    console.log(`${new Date().toISOString()} The game in room # ${game.id} has ended.`);
    io.to(game.getWinnerId()).emit('gameover', true);
    io.to(game.getLoserId()).emit('gameover', false);
  }
}

io.on('connection', (socket) => {
  console.log(`${new Date().toISOString()} Player with socketID: ${socket.id} is now connected & waiting in the waiting room.`);
  // Individual user
  users[socket.id] = {
    inGame: null,
    player: null
  };

  // On connecting join the waiting room and wait for another player to start the game...
  socket.join('waiting room');

  // In game chat functionality...
  socket.on('chat', (msg) => {
    if (users[socket.id].inGame !== null && msg) {
      console.log(`${new Date().toISOString()} Chat message from PLayer with socketID: ${socket.id}: ${msg}`);

      socket.broadcast.to('game' + users[socket.id].inGame.id).emit('chat', {
        name: 'Opponent',
        message: entities.encode(msg)
      });

      io.to(socket.id).emit('chat', {
        name: 'Me',
        message: entities.encode(msg)
      });
    }
  });

  // Handle shot event...
  socket.on('shot', (position) => {
    let game = users[socket.id].inGame;

    if (game !== null) {
      // Is it your turn?
      if (game.currentPlayer === users[socket.id].player) {
        let opponent = game.currentPlayer === 0
          ? 1
          : 0;
        if (game.shoot(position)) {
          checkGameOver(game);
          // Update the game state...
          io.to(socket.id).emit('update', game.getGameState(users[socket.id].player, opponent));
          io.to(game.getPlayerId(opponent)).emit('update', game.getGameState(opponent, opponent));
        }
      }
    }
  });

  // Hnadle the leave game event...
  socket.on('leave', () => {
    if (users[socket.id].inGame !== null) {
      leaveGame(socket);
      // Go back to waiting room...
      socket.join('waiting room');
      joinWaitingPlayers();
    }
  });

  // Handle the disconnect event...
  socket.on('disconnect', () => {
    console.log(`${new Date().toISOString()} Player with socketID: ${socket.id} has left the room & is now disconnected`);
    leaveGame(socket);
    delete users[socket.id];
  });

  joinWaitingPlayers();
});

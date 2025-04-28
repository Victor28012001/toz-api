const WebSocket = require('ws');
const wss = new WebSocket.Server({ noServer: true });

const players = [];

wss.on('connection', (ws) => {
  console.log('New player connected');
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      // Handle specific message types
      if (data.type === 'JOIN_GAME') {
        players.push({ ws, playerId: data.playerId });
        console.log(`Player ${data.playerId} joined`);
      }
      
      if (data.type === 'GAME_UPDATE') {
        // Broadcast game updates (e.g., game status, player actions)
        players.forEach(player => {
          if (player.ws.readyState === WebSocket.OPEN) {
            player.ws.send(JSON.stringify({ type: 'GAME_UPDATE', message: data.message }));
          }
        });
      }

    } catch (error) {
      console.error("Error parsing message:", error);
      // Optionally send a message back to the client indicating the error
      ws.send(JSON.stringify({ type: 'ERROR', message: 'Invalid JSON format' }));
    }
  });

  ws.on('close', () => {
    console.log('Player disconnected');
    // Remove player from list on disconnect
    const index = players.findIndex(player => player.ws === ws);
    if (index !== -1) {
      players.splice(index, 1);
    }
  });
});

module.exports = wss;

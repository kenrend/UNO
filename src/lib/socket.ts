import { Server } from 'socket.io';
import { db } from '@/lib/db';

interface GameRoom {
  gameCode: string;
  players: Set<string>;
}

const gameRooms = new Map<string, GameRoom>();

export const setupSocket = (io: Server) => {
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    // Handle joining a game room
    socket.on('joinGame', async (data: { gameCode: string; playerName: string }) => {
      try {
        const { gameCode, playerName } = data;
        
        // Verify game exists and player is in it
        const game = await db.game.findUnique({
          where: { code: gameCode.toUpperCase() },
          include: { players: true },
        });
        
        if (!game) {
          socket.emit('error', { message: 'Game not found' });
          return;
        }
        
        const player = game.players.find(p => p.name === playerName);
        if (!player) {
          socket.emit('error', { message: 'Player not in game' });
          return;
        }
        
        // Join the game room
        socket.join(gameCode);
        
        // Update player's socket ID
        await db.player.update({
          where: { id: player.id },
          data: { socketId: socket.id },
        });
        
        // Add to game rooms tracking
        if (!gameRooms.has(gameCode)) {
          gameRooms.set(gameCode, { gameCode, players: new Set() });
        }
        gameRooms.get(gameCode)!.players.add(socket.id);
        
        // Notify player they joined successfully
        socket.emit('gameJoined', { gameCode, playerName });
        
        // Broadcast updated player list to all players in the room
        const updatedGame = await db.game.findUnique({
          where: { code: gameCode.toUpperCase() },
          include: { 
            players: {
              select: {
                id: true,
                name: true,
                position: true,
                isReady: true,
              },
              orderBy: {
                position: 'asc',
              },
            },
          },
        });
        
        io.to(gameCode).emit('gameStateUpdate', { game: updatedGame });
        
        console.log(`Player ${playerName} joined game ${gameCode}`);
        
      } catch (error) {
        console.error('Error joining game:', error);
        socket.emit('error', { message: 'Failed to join game' });
      }
    });
    
    // Handle player ready status change
    socket.on('playerReady', async (data: { gameCode: string; playerName: string; isReady: boolean }) => {
      try {
        const { gameCode, playerName, isReady } = data;
        
        const game = await db.game.findUnique({
          where: { code: gameCode.toUpperCase() },
          include: { players: true },
        });
        
        if (!game) return;
        
        const player = game.players.find(p => p.name === playerName);
        if (!player) return;
        
        // Update player ready status
        await db.player.update({
          where: { id: player.id },
          data: { isReady },
        });
        
        // Broadcast updated game state
        const updatedGame = await db.game.findUnique({
          where: { code: gameCode.toUpperCase() },
          include: { 
            players: {
              select: {
                id: true,
                name: true,
                position: true,
                isReady: true,
              },
              orderBy: {
                position: 'asc',
              },
            },
          },
        });
        
        io.to(gameCode).emit('gameStateUpdate', { game: updatedGame });
        io.to(gameCode).emit('playerReadyUpdate', { playerName, isReady });
        
      } catch (error) {
        console.error('Error updating player ready status:', error);
      }
    });
    
    // Handle game start
    socket.on('startGame', async (data: { gameCode: string; playerName: string }) => {
      try {
        const { gameCode, playerName } = data;
        
        // This would trigger the same logic as the API endpoint
        // For now, we'll just broadcast that the game is starting
        io.to(gameCode).emit('gameStarting', { gameCode });
        
      } catch (error) {
        console.error('Error starting game:', error);
      }
    });
    
    // Handle card played
    socket.on('cardPlayed', async (data: { gameCode: string; playerName: string; card: any }) => {
      try {
        const { gameCode, playerName, card } = data;
        
        // Broadcast to all players in the game
        io.to(gameCode).emit('cardPlayedUpdate', { playerName, card });
        
        // Get updated game state and broadcast
        const updatedGame = await db.game.findUnique({
          where: { code: gameCode.toUpperCase() },
          include: { 
            players: {
              select: {
                id: true,
                name: true,
                position: true,
                isReady: true,
                hand: true,
              },
              orderBy: {
                position: 'asc',
              },
            },
          },
        });
        
        if (updatedGame) {
          const playersWithParsedHands = updatedGame.players.map(player => ({
            ...player,
            hand: updatedGame.status === 'PLAYING' ? JSON.parse(player.hand) : undefined
          }));
          
          const gameData = {
            ...updatedGame,
            players: playersWithParsedHands,
            deck: updatedGame.status === 'PLAYING' ? JSON.parse(updatedGame.deck) : undefined,
            discardPile: updatedGame.status === 'PLAYING' ? JSON.parse(updatedGame.discardPile) : undefined,
          };
          
          io.to(gameCode).emit('gameStateUpdate', { game: gameData });
        }
        
      } catch (error) {
        console.error('Error handling card played:', error);
      }
    });
    
    // Handle card drawn
    socket.on('cardDrawn', async (data: { gameCode: string; playerName: string }) => {
      try {
        const { gameCode, playerName } = data;
        
        // Broadcast to all players in the game
        io.to(gameCode).emit('cardDrawnUpdate', { playerName });
        
        // Get updated game state and broadcast
        const updatedGame = await db.game.findUnique({
          where: { code: gameCode.toUpperCase() },
          include: { 
            players: {
              select: {
                id: true,
                name: true,
                position: true,
                isReady: true,
                hand: true,
              },
              orderBy: {
                position: 'asc',
              },
            },
          },
        });
        
        if (updatedGame) {
          const playersWithParsedHands = updatedGame.players.map(player => ({
            ...player,
            hand: updatedGame.status === 'PLAYING' ? JSON.parse(player.hand) : undefined
          }));
          
          const gameData = {
            ...updatedGame,
            players: playersWithParsedHands,
            deck: updatedGame.status === 'PLAYING' ? JSON.parse(updatedGame.deck) : undefined,
            discardPile: updatedGame.status === 'PLAYING' ? JSON.parse(updatedGame.discardPile) : undefined,
          };
          
          io.to(gameCode).emit('gameStateUpdate', { game: gameData });
        }
        
      } catch (error) {
        console.error('Error handling card drawn:', error);
      }
    });
    
    // Handle turn change
    socket.on('turnChanged', async (data: { gameCode: string; currentPlayerName: string; nextPlayerName: string }) => {
      try {
        const { gameCode, currentPlayerName, nextPlayerName } = data;
        
        io.to(gameCode).emit('turnUpdate', { currentPlayerName, nextPlayerName });
        
      } catch (error) {
        console.error('Error handling turn change:', error);
      }
    });
    
    // Handle game end
    socket.on('gameEnded', async (data: { gameCode: string; winnerName: string }) => {
      try {
        const { gameCode, winnerName } = data;
        
        io.to(gameCode).emit('gameEndedUpdate', { winnerName });
        
      } catch (error) {
        console.error('Error handling game end:', error);
      }
    });
    
    // Handle player leaving
    socket.on('leaveGame', async (data: { gameCode: string; playerName: string }) => {
      try {
        const { gameCode, playerName } = data;
        
        // Leave the socket room
        socket.leave(gameCode);
        
        // Remove from game rooms tracking
        const room = gameRooms.get(gameCode);
        if (room) {
          room.players.delete(socket.id);
          if (room.players.size === 0) {
            gameRooms.delete(gameCode);
          }
        }
        
        // Broadcast player left to remaining players
        socket.to(gameCode).emit('playerLeft', { playerName });
        
        console.log(`Player ${playerName} left game ${gameCode}`);
        
      } catch (error) {
        console.error('Error handling player leave:', error);
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      
      // Clean up from any game rooms
      for (const [gameCode, room] of gameRooms.entries()) {
        if (room.players.has(socket.id)) {
          room.players.delete(socket.id);
          if (room.players.size === 0) {
            gameRooms.delete(gameCode);
          } else {
            // Notify other players that someone disconnected
            socket.to(gameCode).emit('playerDisconnected', { socketId: socket.id });
          }
        }
      }
    });

    // Send welcome message
    socket.emit('message', {
      text: 'Welcome to UNO Multiplayer!',
      senderId: 'system',
      timestamp: new Date().toISOString(),
    });
  });
};
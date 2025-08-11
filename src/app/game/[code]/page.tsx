'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { io, Socket } from 'socket.io-client';
import { UnoCard, UnoCardLarge } from '@/components/uno-card';

interface Player {
  id: string;
  name: string;
  position: number;
  isReady: boolean;
  hand?: any[];
}

interface Game {
  id: string;
  code: string;
  status: 'WAITING' | 'PLAYING' | 'FINISHED';
  maxPlayers: number;
  currentPlayerIndex: number;
  direction: number;
  currentColor?: string;
  currentValue?: string;
  players: Player[];
  discardPile?: any[];
  deck?: any[];
}

interface Card {
  color: string;
  value: string;
  type: string;
}

export default function GamePage() {
  const params = useParams();
  const router = useRouter();
  const gameCode = params.code as string;
  
  const [game, setGame] = useState<Game | null>(null);
  const [playerName, setPlayerName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isReady, setIsReady] = useState(false);
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    // Get player name from localStorage or prompt
    const savedName = localStorage.getItem('unoPlayerName');
    if (savedName) {
      setPlayerName(savedName);
    } else {
      const name = prompt('Enter your name:');
      if (name) {
        setPlayerName(name);
        localStorage.setItem('unoPlayerName', name);
      } else {
        router.push('/');
        return;
      }
    }

    // Initialize socket connection
    const newSocket = io(process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000');
    setSocket(newSocket);

    // Socket event listeners
    newSocket.on('connect', () => {
      console.log('Connected to socket server');
      if (playerName) {
        newSocket.emit('joinGame', { gameCode, playerName });
      }
    });

    newSocket.on('gameStateUpdate', (data: { game: Game }) => {
      setGame(data.game);
      const currentPlayer = data.game.players.find((p: Player) => p.name === playerName);
      if (currentPlayer) {
        setIsReady(currentPlayer.isReady);
      }
    });

    newSocket.on('playerReadyUpdate', (data: { playerName: string; isReady: boolean }) => {
      if (data.playerName === playerName) {
        setIsReady(data.isReady);
      }
    });

    newSocket.on('gameStarting', (data: { gameCode: string }) => {
      fetchGameState();
    });

    newSocket.on('cardPlayedUpdate', (data: { playerName: string; card: Card }) => {
      fetchGameState();
    });

    newSocket.on('cardDrawnUpdate', (data: { playerName: string }) => {
      fetchGameState();
    });

    newSocket.on('turnUpdate', (data: { currentPlayerName: string; nextPlayerName: string }) => {
      fetchGameState();
    });

    newSocket.on('gameEndedUpdate', (data: { winnerName: string }) => {
      alert(`Game Over! ${data.winnerName} wins!`);
      fetchGameState();
    });

    newSocket.on('playerLeft', (data: { playerName: string }) => {
      fetchGameState();
    });

    newSocket.on('error', (data: { message: string }) => {
      setError(data.message);
    });

    fetchGameState();

    return () => {
      newSocket.disconnect();
    };
  }, [gameCode, playerName, router]);

  useEffect(() => {
    if (game?.status === 'PLAYING' && !socket) {
      // Fallback polling if socket is not available
      const interval = setInterval(fetchGameState, 2000);
      return () => clearInterval(interval);
    }
  }, [game?.status, socket]);

  const fetchGameState = async () => {
    try {
      const response = await fetch(`/api/game/${gameCode}/state`);
      if (response.ok) {
        const data = await response.json();
        setGame(data.game);
        
        // Check if current player is ready
        const currentPlayer = data.game.players.find((p: Player) => p.name === playerName);
        if (currentPlayer) {
          setIsReady(currentPlayer.isReady);
        }
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to fetch game state');
      }
    } catch (error) {
      setError('Failed to fetch game state');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReadyToggle = async () => {
    try {
      const response = await fetch(`/api/game/${gameCode}/ready`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ playerName, isReady: !isReady }),
      });

      if (response.ok) {
        if (socket) {
          socket.emit('playerReady', { gameCode, playerName, isReady: !isReady });
        }
        setIsReady(!isReady);
        fetchGameState(); // Refresh game state
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update ready status');
      }
    } catch (error) {
      setError('Failed to update ready status');
    }
  };

  const handleStartGame = async () => {
    try {
      const response = await fetch(`/api/game/${gameCode}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ playerName }),
      });

      if (response.ok) {
        if (socket) {
          socket.emit('startGame', { gameCode, playerName });
        }
        fetchGameState(); // Refresh game state
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to start game');
      }
    } catch (error) {
      setError('Failed to start game');
    }
  };

  const handleLeaveGame = async () => {
    try {
      if (socket) {
        socket.emit('leaveGame', { gameCode, playerName });
      }
      
      await fetch(`/api/game/${gameCode}/leave`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ playerName }),
      });
      
      router.push('/');
    } catch (error) {
      console.error('Error leaving game:', error);
      router.push('/');
    }
  };

  const handlePlayCard = async () => {
    if (selectedCard === null) return;
    
    try {
      const response = await fetch(`/api/game/${gameCode}/play`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          playerName, 
          cardIndex: selectedCard 
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (socket) {
          const currentPlayer = game?.players.find(p => p.name === playerName);
          const card = currentPlayer?.hand?.[selectedCard];
          if (card) {
            socket.emit('cardPlayed', { gameCode, playerName, card });
          }
        }
        setSelectedCard(null);
        fetchGameState(); // Refresh game state
        
        if (data.gameStatus === 'FINISHED') {
          if (socket) {
            socket.emit('gameEnded', { gameCode, winnerName: playerName });
          }
        }
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to play card');
      }
    } catch (error) {
      setError('Failed to play card');
    }
  };

  const handleDrawCard = async () => {
    try {
      const response = await fetch(`/api/game/${gameCode}/draw`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ playerName }),
      });

      if (response.ok) {
        if (socket) {
          socket.emit('cardDrawn', { gameCode, playerName });
        }
        fetchGameState(); // Refresh game state
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to draw card');
      }
    } catch (error) {
      setError('Failed to draw card');
    }
  };

  const copyGameCode = () => {
    navigator.clipboard.writeText(gameCode);
    alert('Game code copied to clipboard!');
  };

  const getCardColor = (color: string) => {
    switch (color) {
      case 'RED': return 'bg-red-500';
      case 'BLUE': return 'bg-blue-500';
      case 'GREEN': return 'bg-green-500';
      case 'YELLOW': return 'bg-yellow-400';
      case 'WILD': return 'bg-gray-800';
      default: return 'bg-gray-400';
    }
  };

  const getCardDisplay = (card: Card) => {
    if (card.type === 'NUMBER') {
      return card.value;
    } else if (card.type === 'SKIP') {
      return '⊘';
    } else if (card.type === 'REVERSE') {
      return '⟲';
    } else if (card.type === 'DRAW_TWO') {
      return '+2';
    } else if (card.type === 'WILD') {
      return 'W';
    } else if (card.type === 'WILD_DRAW_FOUR') {
      return '+4';
    }
    return card.value;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-blue-50 to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading game...</p>
        </div>
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-blue-50 to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert className="mb-4">
              <AlertDescription>{error || 'Game not found'}</AlertDescription>
            </Alert>
            <Button onClick={() => router.push('/')} className="w-full">
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentPlayer = game.players.find(p => p.name === playerName);
  const isCurrentPlayerTurn = game.players[game.currentPlayerIndex]?.name === playerName;
  const allPlayersReady = game.players.length >= 2 && game.players.every(p => p.isReady);
  const canStartGame = game.players.length >= 2 && allPlayersReady;

  // Render lobby view
  if (game.status === 'WAITING') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-blue-50 to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Game Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white mb-2">
                Game Lobby
              </h1>
              <div className="flex items-center justify-center gap-4 mb-4">
                <div className="text-lg font-mono bg-white dark:bg-gray-800 px-4 py-2 rounded-lg border-2 border-gray-300 dark:border-gray-600">
                  Code: {gameCode}
                </div>
                <Button onClick={copyGameCode} variant="outline" size="sm">
                  Copy Code
                </Button>
              </div>
              <Badge variant={game.status === 'WAITING' ? 'secondary' : 'default'}>
                {game.status}
              </Badge>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Players List */}
              <Card>
                <CardHeader>
                  <CardTitle>Players ({game.players.length}/{game.maxPlayers})</CardTitle>
                  <CardDescription>
                    {game.players.length < 2 ? 'Need at least 2 players to start' : 'Ready to start!'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {game.players.map((player) => (
                      <div
                        key={player.id}
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          player.name === playerName
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                            : 'border-gray-200 dark:border-gray-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-400 to-blue-400 flex items-center justify-center text-white font-semibold text-sm">
                            {player.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium">
                              {player.name}
                              {player.name === playerName && ' (You)'}
                            </div>
                            <div className="text-sm text-gray-500">Position {player.position + 1}</div>
                          </div>
                        </div>
                        <Badge variant={player.isReady ? 'default' : 'secondary'}>
                          {player.isReady ? 'Ready' : 'Not Ready'}
                        </Badge>
                      </div>
                    ))}
                    
                    {game.players.length < game.maxPlayers && (
                      <div className="text-center text-sm text-gray-500 mt-4">
                        Waiting for more players to join...
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Game Controls */}
              <Card>
                <CardHeader>
                  <CardTitle>Game Controls</CardTitle>
                  <CardDescription>
                    {game.players.length < 2
                      ? 'Waiting for more players...'
                      : allPlayersReady
                      ? 'All players ready! Start the game.'
                      : 'Waiting for all players to be ready.'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Button
                      onClick={handleReadyToggle}
                      variant={isReady ? 'outline' : 'default'}
                      className="w-full"
                      size="lg"
                    >
                      {isReady ? 'Not Ready' : 'Ready!'}
                    </Button>
                    
                    {canStartGame && (
                      <Button
                        onClick={handleStartGame}
                        className="w-full bg-green-600 hover:bg-green-700"
                        size="lg"
                      >
                        Start Game
                      </Button>
                    )}
                    
                    <Button
                      onClick={handleLeaveGame}
                      variant="outline"
                      className="w-full"
                    >
                      Leave Game
                    </Button>
                  </div>

                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <h4 className="font-medium mb-2">How to Play:</h4>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <li>• Click "Ready!" when you're prepared to play</li>
                      <li>• All players must be ready to start</li>
                      <li>• Need at least 2 players to begin</li>
                      <li>• Share the game code with friends!</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render game board view
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 via-blue-100 to-red-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-4">
        {/* Game Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="text-lg font-mono bg-white dark:bg-gray-800 px-3 py-1 rounded border">
              Code: {gameCode}
            </div>
            <Badge variant="default" className="bg-green-600">
              {game.status}
            </Badge>
            {game.currentColor && (
              <Badge variant="outline" className={`${getCardColor(game.currentColor)} text-white`}>
                {game.currentColor}
              </Badge>
            )}
          </div>
          <Button onClick={handleLeaveGame} variant="outline">
            Leave Game
          </Button>
        </div>

        {/* Game Board */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[calc(100vh-120px)]">
          {/* Other Players */}
          <div className="lg:col-span-3 space-y-4">
            {/* Top Players */}
            <div className="flex flex-wrap justify-center gap-2 sm:gap-4">
              {game.players
                .filter(p => p.position !== currentPlayer?.position)
                .filter(p => p.position === 1 || p.position === 2)
                .map(player => (
                  <Card key={player.id} className="w-24 sm:w-32">
                    <CardHeader className="pb-1 sm:pb-2">
                      <CardTitle className="text-xs sm:text-sm text-center">
                        {player.name}
                        {game.players[game.currentPlayerIndex]?.id === player.id && (
                          <Badge variant="default" className="ml-1 text-xs">TURN</Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="text-center">
                        <div className="text-xl sm:text-2xl mb-1">🎴</div>
                        <div className="text-xs text-gray-500">
                          {player.hand?.length || 0} cards
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>

            {/* Center Area */}
            <div className="flex justify-center items-center gap-4 sm:gap-8">
              {/* Draw Pile */}
              <Card className="w-16 h-24 sm:w-24 sm:h-32 bg-gray-800 text-white flex items-center justify-center cursor-pointer hover:bg-gray-700 transition-colors" onClick={handleDrawCard}>
                <div className="text-center">
                  <div className="text-xl sm:text-2xl mb-1">🎴</div>
                  <div className="text-xs">DRAW</div>
                </div>
              </Card>

              {/* Discard Pile */}
              {game.discardPile && game.discardPile.length > 0 && (
                <UnoCardLarge
                  color={game.discardPile[game.discardPile.length - 1].color}
                  value={game.discardPile[game.discardPile.length - 1].value}
                  type={game.discardPile[game.discardPile.length - 1].type}
                  className="w-16 h-24 sm:w-24 sm:h-32"
                />
              )}
            </div>

            {/* Bottom Player */}
            <div className="flex justify-center">
              {game.players
                .filter(p => p.position !== currentPlayer?.position)
                .filter(p => p.position === 3)
                .map(player => (
                  <Card key={player.id} className="w-24 sm:w-32">
                    <CardHeader className="pb-1 sm:pb-2">
                      <CardTitle className="text-xs sm:text-sm text-center">
                        {player.name}
                        {game.players[game.currentPlayerIndex]?.id === player.id && (
                          <Badge variant="default" className="ml-1 text-xs">TURN</Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="text-center">
                        <div className="text-xl sm:text-2xl mb-1">🎴</div>
                        <div className="text-xs text-gray-500">
                          {player.hand?.length || 0} cards
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>

          {/* Current Player Hand */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-1 sm:pb-2">
                <CardTitle className="text-xs sm:text-sm">
                  Your Hand
                  {isCurrentPlayerTurn && (
                    <Badge variant="default" className="ml-1 text-xs">YOUR TURN</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 sm:gap-2 max-h-48 sm:max-h-64 overflow-y-auto">
                  {currentPlayer?.hand?.map((card, index) => (
                    <UnoCard
                      key={index}
                      color={card.color}
                      value={card.value}
                      type={card.type}
                      isSelected={selectedCard === index}
                      isPlayable={isCurrentPlayerTurn}
                      onClick={() => isCurrentPlayerTurn && setSelectedCard(index)}
                      className="w-12 h-16 sm:w-16 sm:h-24"
                    />
                  ))}
                </div>
                
                {isCurrentPlayerTurn && (
                  <div className="mt-3 sm:mt-4 space-y-1 sm:space-y-2">
                    <Button
                      onClick={handlePlayCard}
                      disabled={selectedCard === null}
                      className="w-full text-xs sm:text-sm"
                      size="sm"
                    >
                      Play Card
                    </Button>
                    <Button
                      onClick={handleDrawCard}
                      variant="outline"
                      className="w-full text-xs sm:text-sm"
                      size="sm"
                    >
                      Draw Card
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Game Info */}
            <Card>
              <CardHeader className="pb-1 sm:pb-2">
                <CardTitle className="text-xs sm:text-sm">Game Info</CardTitle>
              </CardHeader>
              <CardContent className="text-xs space-y-1 sm:space-y-2">
                <div>Direction: {game.direction === 1 ? 'Clockwise' : 'Counter-clockwise'}</div>
                <div>Current Player: {game.players[game.currentPlayerIndex]?.name}</div>
                <div>Cards in deck: {game.deck?.length || 0}</div>
                {game.currentColor && (
                  <div>Current Color: {game.currentColor}</div>
                )}
                {game.currentValue && (
                  <div>Current Value: {game.currentValue}</div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
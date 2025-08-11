'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

export default function Home() {
  const [playerName, setPlayerName] = useState('');
  const [gameCode, setGameCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateGame = async () => {
    if (!playerName.trim()) {
      alert('Please enter your name');
      return;
    }
    
    setIsCreating(true);
    try {
      const response = await fetch('/api/game/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ playerName }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Redirect to game page
        window.location.href = `/game/${data.gameCode}`;
      } else {
        alert(data.error || 'Failed to create game');
      }
    } catch (error) {
      alert('Failed to create game');
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinGame = async () => {
    if (!playerName.trim()) {
      alert('Please enter your name');
      return;
    }
    
    if (!gameCode.trim()) {
      alert('Please enter a game code');
      return;
    }
    
    setIsJoining(true);
    try {
      const response = await fetch('/api/game/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ playerName, gameCode: gameCode.toUpperCase() }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Redirect to game page
        window.location.href = `/game/${data.gameCode}`;
      } else {
        alert(data.error || 'Failed to join game');
      }
    } catch (error) {
      alert('Failed to join game');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-blue-50 to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-800 dark:text-white mb-4">
            UNO Multiplayer
          </h1>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300">
            Play the classic UNO game with friends online!
          </p>
        </div>

        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-6">
          {/* Create Game Card */}
          <Card className="border-2 border-red-200 dark:border-red-800">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-red-600 dark:text-red-400">
                Create New Game
              </CardTitle>
              <CardDescription>
                Start a new game and share the code with friends
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="playerName">Your Name</Label>
                <Input
                  id="playerName"
                  placeholder="Enter your name"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  maxLength={20}
                />
              </div>
              
              <Button 
                onClick={handleCreateGame}
                disabled={isCreating || !playerName.trim()}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3"
                size="lg"
              >
                {isCreating ? 'Creating...' : 'Create Game'}
              </Button>
              
              <div className="flex flex-wrap gap-2 justify-center">
                <Badge variant="secondary">2-4 Players</Badge>
                <Badge variant="secondary">Real-time</Badge>
                <Badge variant="secondary">Free to Play</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Join Game Card */}
          <Card className="border-2 border-blue-200 dark:border-blue-800">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-blue-600 dark:text-blue-400">
                Join Existing Game
              </CardTitle>
              <CardDescription>
                Enter a game code to join an existing game
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="joinPlayerName">Your Name</Label>
                <Input
                  id="joinPlayerName"
                  placeholder="Enter your name"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  maxLength={20}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="gameCode">Game Code</Label>
                <Input
                  id="gameCode"
                  placeholder="Enter 6-digit code"
                  value={gameCode}
                  onChange={(e) => setGameCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  className="text-center text-lg font-mono tracking-wider"
                />
              </div>
              
              <Button 
                onClick={handleJoinGame}
                disabled={isJoining || !playerName.trim() || !gameCode.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3"
                size="lg"
              >
                {isJoining ? 'Joining...' : 'Join Game'}
              </Button>
              
              <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                Game codes are case-insensitive
              </div>
            </CardContent>
          </Card>
        </div>

        {/* How to Play */}
        <Card className="max-w-4xl mx-auto mt-8">
          <CardHeader>
            <CardTitle className="text-center text-green-600 dark:text-green-400">
              How to Play
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4 text-center">
              <div className="space-y-2">
                <div className="text-2xl">🎮</div>
                <h3 className="font-semibold">1. Create or Join</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Create a new game or join with a code
                </p>
              </div>
              <div className="space-y-2">
                <div className="text-2xl">👥</div>
                <h3 className="font-semibold">2. Invite Friends</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Share the game code with 2-4 players
                </p>
              </div>
              <div className="space-y-2">
                <div className="text-2xl">🏆</div>
                <h3 className="font-semibold">3. Play & Win</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  First to empty their hand wins!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
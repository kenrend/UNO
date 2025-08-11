import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

function generateGameCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function POST(request: NextRequest) {
  try {
    const { playerName } = await request.json();

    if (!playerName || !playerName.trim()) {
      return NextResponse.json({ error: 'Player name is required' }, { status: 400 });
    }

    // Generate a unique game code
    let gameCode;
    let existingGame;
    do {
      gameCode = generateGameCode();
      existingGame = await db.game.findUnique({
        where: { code: gameCode }
      });
    } while (existingGame);

    // Create the game
    const game = await db.game.create({
      data: {
        code: gameCode,
        status: 'WAITING',
        maxPlayers: 4,
        currentPlayerIndex: 0,
        direction: 1,
        deck: '[]',
        discardPile: '[]',
      }
    });

    // Add the creator as the first player
    const player = await db.player.create({
      data: {
        gameId: game.id,
        name: playerName.trim(),
        hand: '[]',
        position: 0,
        isReady: false,
      }
    });

    return NextResponse.json({
      gameCode: game.code,
      playerId: player.id,
      message: 'Game created successfully'
    });

  } catch (error) {
    console.error('Error creating game:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
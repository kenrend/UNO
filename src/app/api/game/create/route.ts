import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { playerName, gameCode } = await request.json();

    if (!playerName || !playerName.trim()) {
      return NextResponse.json({ error: 'Player name is required' }, { status: 400 });
    }

    if (!gameCode || !gameCode.trim()) {
      return NextResponse.json({ error: 'Game code is required' }, { status: 400 });
    }

    // Find the game
    const game = await db.game.findUnique({
      where: { code: gameCode.toUpperCase() },
      include: { players: true }
    });

    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    if (game.status !== 'WAITING') {
      return NextResponse.json({ error: 'Game has already started' }, { status: 400 });
    }

    if (game.players.length >= game.maxPlayers) {
      return NextResponse.json({ error: 'Game is full' }, { status: 400 });
    }

    // Check if player name is already taken in this game
    const existingPlayer = game.players.find(player => 
      player.name.toLowerCase() === playerName.trim().toLowerCase()
    );

    if (existingPlayer) {
      return NextResponse.json({ error: 'Player name already taken' }, { status: 400 });
    }

    // Add the player to the game
    const player = await db.player.create({
      data: {
        gameId: game.id,
        name: playerName.trim(),
        hand: '[]',
        position: game.players.length,
        isReady: false,
      }
    });

    return NextResponse.json({
      gameCode: game.code,
      playerId: player.id,
      message: 'Joined game successfully'
    });

  } catch (error) {
    console.error('Error joining game:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
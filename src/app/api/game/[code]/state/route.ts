import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const gameCode = params.code;

    const game = await db.game.findUnique({
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

    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    // Parse hand data for players if game is playing
    const playersWithParsedHands = game.players.map(player => ({
      ...player,
      hand: game.status === 'PLAYING' ? JSON.parse(player.hand) : undefined
    }));

    const gameData = {
      ...game,
      players: playersWithParsedHands,
      deck: game.status === 'PLAYING' ? JSON.parse(game.deck) : undefined,
      discardPile: game.status === 'PLAYING' ? JSON.parse(game.discardPile) : undefined,
    };

    return NextResponse.json({ game: gameData });
  } catch (error) {
    console.error('Error fetching game state:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
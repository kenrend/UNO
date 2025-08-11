import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const gameCode = params.code;
    const { playerName } = await request.json();

    if (!playerName || !playerName.trim()) {
      return NextResponse.json({ error: 'Player name is required' }, { status: 400 });
    }

    const game = await db.game.findUnique({
      where: { code: gameCode.toUpperCase() },
      include: { players: true },
    });

    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    const player = game.players.find(p => p.name === playerName.trim());
    if (!player) {
      return NextResponse.json({ error: 'Player not found in game' }, { status: 404 });
    }

    // Remove the player
    await db.player.delete({
      where: { id: player.id },
    });

    // If no players left, delete the game
    if (game.players.length === 1) {
      await db.game.delete({
        where: { id: game.id },
      });
      return NextResponse.json({ message: 'Game deleted as last player left' });
    }

    // If game was playing and player left, we might need to handle that logic
    // For now, just return success
    return NextResponse.json({ message: 'Player left game successfully' });
  } catch (error) {
    console.error('Error leaving game:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const gameCode = params.code;
    const { playerName, isReady } = await request.json();

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

    if (game.status !== 'WAITING') {
      return NextResponse.json({ error: 'Game has already started' }, { status: 400 });
    }

    const player = game.players.find(p => p.name === playerName.trim());
    if (!player) {
      return NextResponse.json({ error: 'Player not found in game' }, { status: 404 });
    }

    // Update player ready status
    await db.player.update({
      where: { id: player.id },
      data: { isReady },
    });

    return NextResponse.json({ 
      message: `Player ${isReady ? 'ready' : 'not ready'}`,
      isReady 
    });
  } catch (error) {
    console.error('Error updating ready status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
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

    if (game.status !== 'PLAYING') {
      return NextResponse.json({ error: 'Game is not in progress' }, { status: 400 });
    }

    const player = game.players.find(p => p.name === playerName.trim());
    if (!player) {
      return NextResponse.json({ error: 'Player not found in game' }, { status: 404 });
    }

    // Check if it's the player's turn
    if (game.players[game.currentPlayerIndex]?.id !== player.id) {
      return NextResponse.json({ error: 'Not your turn' }, { status: 400 });
    }

    // Parse deck and player's hand
    const deck = JSON.parse(game.deck);
    const playerHand = JSON.parse(player.hand);

    // Check if deck is empty
    if (deck.length === 0) {
      return NextResponse.json({ error: 'No cards left to draw' }, { status: 400 });
    }

    // Draw a card
    const drawnCard = deck.pop();
    playerHand.push(drawnCard);

    // Update player's hand
    await db.player.update({
      where: { id: player.id },
      data: { hand: JSON.stringify(playerHand) },
    });

    // Update deck
    await db.game.update({
      where: { id: game.id },
      data: { deck: JSON.stringify(deck) },
    });

    // Move to next player
    const nextPlayerIndex = getNextPlayerIndex(game.currentPlayerIndex, game.direction, game.players.length);
    await db.game.update({
      where: { id: game.id },
      data: { currentPlayerIndex: nextPlayerIndex },
    });

    return NextResponse.json({ 
      message: 'Card drawn successfully',
      drawnCard,
      nextPlayerIndex
    });

  } catch (error) {
    console.error('Error drawing card:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function getNextPlayerIndex(currentIndex: number, direction: number, playerCount: number): number {
  let nextIndex = currentIndex + direction;
  if (nextIndex >= playerCount) {
    nextIndex = 0;
  } else if (nextIndex < 0) {
    nextIndex = playerCount - 1;
  }
  return nextIndex;
}
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

    if (game.status !== 'WAITING') {
      return NextResponse.json({ error: 'Game has already started' }, { status: 400 });
    }

    if (game.players.length < 2) {
      return NextResponse.json({ error: 'Need at least 2 players to start' }, { status: 400 });
    }

    // Check if all players are ready
    const allPlayersReady = game.players.every(p => p.isReady);
    if (!allPlayersReady) {
      return NextResponse.json({ error: 'All players must be ready to start' }, { status: 400 });
    }

    // Initialize the game
    // Create a standard UNO deck
    const colors = ['RED', 'BLUE', 'GREEN', 'YELLOW'];
    const values = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    const specialCards = ['SKIP', 'REVERSE', 'DRAW_TWO'];
    
    let deck: any[] = [];
    
    // Add number cards (0 appears once, 1-9 appear twice per color)
    colors.forEach(color => {
      deck.push({ color, value: '0', type: 'NUMBER' });
      values.slice(1).forEach(value => {
        deck.push({ color, value, type: 'NUMBER' });
        deck.push({ color, value, type: 'NUMBER' });
      });
    });
    
    // Add special cards (2 of each per color)
    colors.forEach(color => {
      specialCards.forEach(special => {
        deck.push({ color, value: special, type: special });
        deck.push({ color, value: special, type: special });
      });
    });
    
    // Add wild cards
    for (let i = 0; i < 4; i++) {
      deck.push({ color: 'WILD', value: 'WILD', type: 'WILD' });
      deck.push({ color: 'WILD', value: 'WILD_DRAW_FOUR', type: 'WILD_DRAW_FOUR' });
    }
    
    // Shuffle the deck
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    
    // Deal cards to players (7 cards each)
    const playersWithHands = game.players.map(player => {
      const hand = deck.splice(0, 7);
      return {
        ...player,
        hand: JSON.stringify(hand)
      };
    });
    
    // Start discard pile with the top card
    const firstCard = deck.pop();
    let discardPile = firstCard ? [firstCard] : [];
    
    // If first card is wild, draw another card
    while (firstCard && (firstCard.type === 'WILD' || firstCard.type === 'WILD_DRAW_FOUR')) {
      discardPile.push(deck.pop()!);
    }
    
    // Update game state
    await db.game.update({
      where: { id: game.id },
      data: {
        status: 'PLAYING',
        deck: JSON.stringify(deck),
        discardPile: JSON.stringify(discardPile),
        currentColor: discardPile[discardPile.length - 1]?.color || null,
        currentValue: discardPile[discardPile.length - 1]?.value || null,
      },
    });
    
    // Update players with their hands
    for (const player of playersWithHands) {
      await db.player.update({
        where: { id: player.id },
        data: { hand: player.hand },
      });
    }

    return NextResponse.json({ 
      message: 'Game started successfully',
      gameStatus: 'PLAYING'
    });
  } catch (error) {
    console.error('Error starting game:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
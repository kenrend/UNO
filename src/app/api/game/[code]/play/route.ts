import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const gameCode = params.code;
    const { playerName, cardIndex } = await request.json();

    if (!playerName || !playerName.trim()) {
      return NextResponse.json({ error: 'Player name is required' }, { status: 400 });
    }

    if (cardIndex === undefined || cardIndex === null) {
      return NextResponse.json({ error: 'Card index is required' }, { status: 400 });
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

    // Parse player's hand
    const playerHand = JSON.parse(player.hand);
    if (cardIndex < 0 || cardIndex >= playerHand.length) {
      return NextResponse.json({ error: 'Invalid card index' }, { status: 400 });
    }

    const cardToPlay = playerHand[cardIndex];
    
    // Parse discard pile
    const discardPile = JSON.parse(game.discardPile);
    const topCard = discardPile[discardPile.length - 1];

    // Check if the card can be played
    if (!canPlayCard(cardToPlay, topCard, game.currentColor)) {
      return NextResponse.json({ error: 'Invalid move - card cannot be played' }, { status: 400 });
    }

    // Remove card from player's hand
    playerHand.splice(cardIndex, 1);
    
    // Add card to discard pile
    discardPile.push(cardToPlay);

    // Check for win condition
    const hasWon = playerHand.length === 0;

    // Handle special cards
    let nextPlayerIndex = game.currentPlayerIndex;
    let direction = game.direction;
    let currentColor = cardToPlay.color;
    let cardsToDraw = 0;

    if (cardToPlay.type === 'SKIP') {
      nextPlayerIndex = getNextPlayerIndex(game.currentPlayerIndex, direction, game.players.length);
    } else if (cardToPlay.type === 'REVERSE') {
      direction = -direction;
    } else if (cardToPlay.type === 'DRAW_TWO') {
      cardsToDraw = 2;
      nextPlayerIndex = getNextPlayerIndex(game.currentPlayerIndex, direction, game.players.length);
    } else if (cardToPlay.type === 'WILD' || cardToPlay.type === 'WILD_DRAW_FOUR') {
      // For simplicity, we'll set a random color for wild cards
      // In a real implementation, the player would choose the color
      const colors = ['RED', 'BLUE', 'GREEN', 'YELLOW'];
      currentColor = colors[Math.floor(Math.random() * colors.length)];
      
      if (cardToPlay.type === 'WILD_DRAW_FOUR') {
        cardsToDraw = 4;
        nextPlayerIndex = getNextPlayerIndex(game.currentPlayerIndex, direction, game.players.length);
      }
    }

    // Move to next player
    if (cardToPlay.type !== 'SKIP' && cardToPlay.type !== 'REVERSE' && cardToPlay.type !== 'DRAW_TWO' && cardToPlay.type !== 'WILD_DRAW_FOUR') {
      nextPlayerIndex = getNextPlayerIndex(game.currentPlayerIndex, direction, game.players.length);
    }

    // Handle card drawing for next player
    if (cardsToDraw > 0) {
      const nextPlayer = game.players[nextPlayerIndex];
      const nextPlayerHand = JSON.parse(nextPlayer.hand);
      const deck = JSON.parse(game.deck);
      
      for (let i = 0; i < cardsToDraw; i++) {
        if (deck.length > 0) {
          const drawnCard = deck.pop();
          nextPlayerHand.push(drawnCard);
        }
      }
      
      // Update next player's hand
      await db.player.update({
        where: { id: nextPlayer.id },
        data: { hand: JSON.stringify(nextPlayerHand) },
      });
      
      // Update deck
      await db.game.update({
        where: { id: game.id },
        data: { deck: JSON.stringify(deck) },
      });
    }

    // Update game state
    await db.game.update({
      where: { id: game.id },
      data: {
        currentPlayerIndex: nextPlayerIndex,
        direction: direction,
        currentColor: currentColor,
        currentValue: cardToPlay.value,
        discardPile: JSON.stringify(discardPile),
        status: hasWon ? 'FINISHED' : 'PLAYING',
      },
    });

    // Update player's hand
    await db.player.update({
      where: { id: player.id },
      data: { hand: JSON.stringify(playerHand) },
    });

    return NextResponse.json({ 
      message: hasWon ? 'You won!' : 'Card played successfully',
      gameStatus: hasWon ? 'FINISHED' : 'PLAYING',
      currentColor,
      nextPlayerIndex
    });

  } catch (error) {
    console.error('Error playing card:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function canPlayCard(card: any, topCard: any, currentColor: string): boolean {
  // Wild cards can always be played
  if (card.type === 'WILD' || card.type === 'WILD_DRAW_FOUR') {
    return true;
  }
  
  // If colors match, can play
  if (card.color === currentColor) {
    return true;
  }
  
  // If values match, can play
  if (card.value === topCard.value) {
    return true;
  }
  
  return false;
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
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface UnoCardProps {
  color: string;
  value: string;
  type: string;
  onClick?: () => void;
  isSelected?: boolean;
  isPlayable?: boolean;
  className?: string;
  showFace?: boolean;
}

export function UnoCard({ 
  color, 
  value, 
  type, 
  onClick, 
  isSelected = false, 
  isPlayable = false,
  className = '',
  showFace = true 
}: UnoCardProps) {
  const getCardColor = (cardColor: string) => {
    switch (cardColor) {
      case 'RED': return 'bg-red-500 hover:bg-red-600';
      case 'BLUE': return 'bg-blue-500 hover:bg-blue-600';
      case 'GREEN': return 'bg-green-500 hover:bg-green-600';
      case 'YELLOW': return 'bg-yellow-400 hover:bg-yellow-500';
      case 'WILD': return 'bg-gradient-to-br from-purple-500 to-black hover:from-purple-600 hover:to-black';
      default: return 'bg-gray-400 hover:bg-gray-500';
    }
  };

  const getCardDisplay = (cardValue: string, cardType: string) => {
    if (cardType === 'NUMBER') {
      return cardValue;
    } else if (cardType === 'SKIP') {
      return '⊘';
    } else if (cardType === 'REVERSE') {
      return '⟲';
    } else if (cardType === 'DRAW_TWO') {
      return '+2';
    } else if (cardType === 'WILD') {
      return 'W';
    } else if (cardType === 'WILD_DRAW_FOUR') {
      return '+4';
    }
    return cardValue;
  };

  const getCardSymbol = (cardType: string) => {
    switch (cardType) {
      case 'SKIP': return '🚫';
      case 'REVERSE': return '🔄';
      case 'DRAW_TWO': return '➕';
      case 'WILD': return '🌈';
      case 'WILD_DRAW_FOUR': return '⚡';
      default: return '';
    }
  };

  const cardColor = getCardColor(color);
  const displayValue = getCardDisplay(value, type);
  const symbol = getCardSymbol(type);

  if (!showFace) {
    return (
      <Card 
        className={`w-16 h-24 bg-gray-800 border-2 border-gray-600 cursor-pointer ${className}`}
        onClick={onClick}
      >
        <CardContent className="p-2 h-full flex items-center justify-center">
          <div className="text-white text-2xl">🎴</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className={`
        w-16 h-24 ${cardColor} text-white border-2 border-white 
        cursor-pointer transition-all duration-200 transform hover:scale-105
        ${isSelected ? 'ring-4 ring-yellow-400 ring-offset-2 scale-105' : ''}
        ${isPlayable ? 'shadow-lg hover:shadow-xl' : 'opacity-60'}
        ${className}
      `}
      onClick={onClick}
    >
      <CardContent className="p-2 h-full flex flex-col justify-between">
        {/* Top value */}
        <div className="text-left">
          <div className="text-lg font-bold leading-none">{displayValue}</div>
          {symbol && <div className="text-xs">{symbol}</div>}
        </div>
        
        {/* Center symbol/value */}
        <div className="text-center flex-1 flex items-center justify-center">
          <div className="text-2xl font-bold">{displayValue}</div>
        </div>
        
        {/* Bottom value (upside down) */}
        <div className="text-right transform rotate-180">
          <div className="text-lg font-bold leading-none">{displayValue}</div>
          {symbol && <div className="text-xs">{symbol}</div>}
        </div>
      </CardContent>
    </Card>
  );
}

interface UnoCardLargeProps {
  color: string;
  value: string;
  type: string;
  onClick?: () => void;
  isSelected?: boolean;
  isPlayable?: boolean;
  className?: string;
}

export function UnoCardLarge({ 
  color, 
  value, 
  type, 
  onClick, 
  isSelected = false, 
  isPlayable = false,
  className = '' 
}: UnoCardLargeProps) {
  const getCardColor = (cardColor: string) => {
    switch (cardColor) {
      case 'RED': return 'bg-red-500 hover:bg-red-600';
      case 'BLUE': return 'bg-blue-500 hover:bg-blue-600';
      case 'GREEN': return 'bg-green-500 hover:bg-green-600';
      case 'YELLOW': return 'bg-yellow-400 hover:bg-yellow-500';
      case 'WILD': return 'bg-gradient-to-br from-purple-500 to-black hover:from-purple-600 hover:to-black';
      default: return 'bg-gray-400 hover:bg-gray-500';
    }
  };

  const getCardDisplay = (cardValue: string, cardType: string) => {
    if (cardType === 'NUMBER') {
      return cardValue;
    } else if (cardType === 'SKIP') {
      return 'SKIP';
    } else if (cardType === 'REVERSE') {
      return 'REVERSE';
    } else if (cardType === 'DRAW_TWO') {
      return 'DRAW TWO';
    } else if (cardType === 'WILD') {
      return 'WILD';
    } else if (cardType === 'WILD_DRAW_FOUR') {
      return 'WILD +4';
    }
    return cardValue;
  };

  const getCardSymbol = (cardType: string) => {
    switch (cardType) {
      case 'SKIP': return '🚫';
      case 'REVERSE': return '🔄';
      case 'DRAW_TWO': return '➕';
      case 'WILD': return '🌈';
      case 'WILD_DRAW_FOUR': return '⚡';
      default: return '';
    }
  };

  const cardColor = getCardColor(color);
  const displayValue = getCardDisplay(value, type);
  const symbol = getCardSymbol(type);

  return (
    <Card 
      className={`
        w-24 h-32 ${cardColor} text-white border-2 border-white 
        cursor-pointer transition-all duration-200 transform hover:scale-105
        ${isSelected ? 'ring-4 ring-yellow-400 ring-offset-2 scale-105' : ''}
        ${isPlayable ? 'shadow-lg hover:shadow-xl' : 'opacity-60'}
        ${className}
      `}
      onClick={onClick}
    >
      <CardContent className="p-3 h-full flex flex-col justify-between">
        {/* Top value */}
        <div className="text-left">
          <div className="text-xl font-bold leading-none">{displayValue}</div>
          {symbol && <div className="text-sm">{symbol}</div>}
        </div>
        
        {/* Center symbol/value */}
        <div className="text-center flex-1 flex flex-col items-center justify-center space-y-2">
          <div className="text-4xl font-bold">{displayValue}</div>
          {symbol && <div className="text-3xl">{symbol}</div>}
        </div>
        
        {/* Bottom value (upside down) */}
        <div className="text-right transform rotate-180">
          <div className="text-xl font-bold leading-none">{displayValue}</div>
          {symbol && <div className="text-sm">{symbol}</div>}
        </div>
      </CardContent>
    </Card>
  );
}
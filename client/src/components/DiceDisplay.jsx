import { useState, useEffect } from 'react';
import './DiceDisplay.css';

const DICE_FACES = {
  1: '⚀',
  2: '⚁',
  3: '⚂',
  4: '⚃',
  5: '⚄',
  6: '⚅'
};

function DiceDisplay({ roll, onRightClick }) {
  const [animating, setAnimating] = useState(true);

  useEffect(() => {
    setAnimating(true);
    const timer = setTimeout(() => setAnimating(false), 500);
    return () => clearTimeout(timer);
  }, [roll]);

  if (!roll) return null;

  const isSeven = roll.total === 7;

  const handleContextMenu = (e) => {
    if (onRightClick) {
      e.preventDefault();
      onRightClick(e, 'diceRoll', {
        title: `Dice Roll: ${roll.total}`,
        icon: '🎲',
        description: isSeven 
          ? 'Rolling a 7 activates the robber! Players with 8+ cards must discard half. Then move the robber and steal.'
          : `Hexes with number ${roll.total} produce resources for adjacent settlements/cities.`,
        number: roll.total
      });
    }
  };

  return (
    <div 
      className={`dice-display ${animating ? 'animating' : ''} ${isSeven ? 'seven' : ''}`}
      onContextMenu={handleContextMenu}
      title="Right-click for info"
      style={{ cursor: 'context-menu' }}
    >
      <div className="dice-container">
        <div className="die">{DICE_FACES[roll.die1]}</div>
        <div className="die">{DICE_FACES[roll.die2]}</div>
      </div>
      <div className="dice-total">
        {roll.total}
        {isSeven && <span className="robber-alert">🥷 Robber!</span>}
      </div>
    </div>
  );
}

export default DiceDisplay;

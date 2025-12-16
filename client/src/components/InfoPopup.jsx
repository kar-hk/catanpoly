import { useState, useEffect, useCallback } from 'react';
import './InfoPopup.css';

// Centralized info data for all game elements
const INFO_DATA = {
  // Player card symbols
  settlements: {
    icon: '🏠',
    title: 'Settlements',
    description: 'Small buildings worth 1 Victory Point each. Produce 1 resource when adjacent hex number is rolled.',
    cost: '🧱1 🪵1 🐑1 🌾1'
  },
  cities: {
    icon: '🏰',
    title: 'Cities',
    description: 'Upgraded settlements worth 2 Victory Points. Produce 2 resources when adjacent hex number is rolled.',
    cost: '⛏️3 🌾2'
  },
  roads: {
    icon: '━',
    title: 'Roads',
    description: 'Connect your settlements and cities. Longest continuous road (5+) earns 2 VP bonus.',
    cost: '🧱1 🪵1'
  },
  devCards: {
    icon: '📜',
    title: 'Development Cards',
    description: 'Special cards with various powers: Knights, Victory Points, Road Building, Year of Plenty, Monopoly.',
    cost: '⛏️1 🌾1 🐑1'
  },
  victoryPoints: {
    icon: '🏆',
    title: 'Victory Points',
    description: 'First player to reach 10 VP wins! Earned from settlements (1), cities (2), longest road (2), largest army (2), and VP cards.',
  },
  longestRoad: {
    icon: '🛤️',
    title: 'Longest Road',
    description: 'Player with the longest continuous road of 5+ segments earns 2 Victory Points.',
  },
  largestArmy: {
    icon: '⚔️',
    title: 'Largest Army',
    description: 'Player who has played 3+ Knight cards (most) earns 2 Victory Points.',
  },
  knights: {
    icon: '🛡️',
    title: 'Knights Played',
    description: 'Number of Knight cards played. 3+ knights can earn Largest Army bonus (2 VP).',
  },
  
  // Resources
  brick: {
    icon: '🧱',
    title: 'Brick',
    description: 'Produced by Hills (brown/red hexes). Used for roads and settlements.',
    terrain: 'Hills'
  },
  lumber: {
    icon: '🪵',
    title: 'Lumber',
    description: 'Produced by Forests (dark green hexes). Used for roads and settlements.',
    terrain: 'Forest'
  },
  wool: {
    icon: '🐑',
    title: 'Wool',
    description: 'Produced by Pastures (light green hexes). Used for settlements and dev cards.',
    terrain: 'Pasture'
  },
  grain: {
    icon: '🌾',
    title: 'Grain',
    description: 'Produced by Fields (yellow hexes). Used for settlements, cities, and dev cards.',
    terrain: 'Fields'
  },
  ore: {
    icon: '⛏️',
    title: 'Ore',
    description: 'Produced by Mountains (gray hexes). Used for cities and dev cards.',
    terrain: 'Mountains'
  },
  
  // Terrain types
  hills: {
    icon: '🧱',
    title: 'Hills',
    description: 'Produces Brick when the number token is rolled.',
    resource: 'Brick'
  },
  forest: {
    icon: '🪵',
    title: 'Forest',
    description: 'Produces Lumber when the number token is rolled.',
    resource: 'Lumber'
  },
  pasture: {
    icon: '🐑',
    title: 'Pasture',
    description: 'Produces Wool when the number token is rolled.',
    resource: 'Wool'
  },
  fields: {
    icon: '🌾',
    title: 'Fields',
    description: 'Produces Grain when the number token is rolled.',
    resource: 'Grain'
  },
  mountains: {
    icon: '⛏️',
    title: 'Mountains',
    description: 'Produces Ore when the number token is rolled.',
    resource: 'Ore'
  },
  desert: {
    icon: '🏜️',
    title: 'Desert',
    description: 'Produces nothing. The robber starts here.',
    resource: 'None'
  },
  
  // Port types
  portGeneric: {
    icon: '⚓',
    title: '3:1 Generic Port',
    description: 'Trade any 3 of the same resource for 1 of any other resource.',
  },
  portBrick: {
    icon: '🧱',
    title: '2:1 Brick Port',
    description: 'Trade 2 Brick for 1 of any other resource.',
  },
  portLumber: {
    icon: '🪵',
    title: '2:1 Lumber Port',
    description: 'Trade 2 Lumber for 1 of any other resource.',
  },
  portWool: {
    icon: '🐑',
    title: '2:1 Wool Port',
    description: 'Trade 2 Wool for 1 of any other resource.',
  },
  portGrain: {
    icon: '🌾',
    title: '2:1 Grain Port',
    description: 'Trade 2 Grain for 1 of any other resource.',
  },
  portOre: {
    icon: '⛏️',
    title: '2:1 Ore Port',
    description: 'Trade 2 Ore for 1 of any other resource.',
  },
  
  // Game elements
  robber: {
    icon: '🥷',
    title: 'The Robber',
    description: 'Blocks resource production on this hex. Moved when a 7 is rolled or a Knight is played.',
  },
  diceRoll: {
    icon: '🎲',
    title: 'Dice Roll',
    description: 'Sum of two dice (2-12). Hexes with this number produce resources. 7 activates the robber.',
  },
  turnOrder: {
    icon: '🔢',
    title: 'Turn Order',
    description: 'The number indicates when this player takes their turn. Randomly determined at game start.',
  },
};

// Number probability info
const NUMBER_PROBABILITIES = {
  2: { dots: 1, probability: '2.8%', rolls: '1 in 36' },
  3: { dots: 2, probability: '5.6%', rolls: '2 in 36' },
  4: { dots: 3, probability: '8.3%', rolls: '3 in 36' },
  5: { dots: 4, probability: '11.1%', rolls: '4 in 36' },
  6: { dots: 5, probability: '13.9%', rolls: '5 in 36' },
  8: { dots: 5, probability: '13.9%', rolls: '5 in 36' },
  9: { dots: 4, probability: '11.1%', rolls: '4 in 36' },
  10: { dots: 3, probability: '8.3%', rolls: '3 in 36' },
  11: { dots: 2, probability: '5.6%', rolls: '2 in 36' },
  12: { dots: 1, probability: '2.8%', rolls: '1 in 36' },
};

function InfoPopup({ position, info, onClose }) {
  useEffect(() => {
    const handleClickOutside = () => onClose();
    const handleEscape = (e) => e.key === 'Escape' && onClose();
    
    // Delay adding listener to prevent immediate close
    const timer = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
      document.addEventListener('contextmenu', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }, 100);
    
    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('contextmenu', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  if (!info) return null;

  // Adjust position to keep popup on screen
  const style = {
    left: Math.min(position.x, window.innerWidth - 280),
    top: Math.min(position.y, window.innerHeight - 200),
  };

  return (
    <div className="info-popup" style={style} onClick={e => e.stopPropagation()}>
      <div className="info-popup-header">
        <span className="info-popup-icon">{info.icon}</span>
        <span className="info-popup-title">{info.title}</span>
      </div>
      <div className="info-popup-body">
        <p className="info-popup-description">{info.description}</p>
        {info.cost && (
          <div className="info-popup-cost">
            <span className="cost-label">Cost:</span> {info.cost}
          </div>
        )}
        {info.resource && (
          <div className="info-popup-detail">
            <span className="detail-label">Resource:</span> {info.resource}
          </div>
        )}
        {info.terrain && (
          <div className="info-popup-detail">
            <span className="detail-label">Terrain:</span> {info.terrain}
          </div>
        )}
        {info.number && (
          <div className="info-popup-number">
            <span className="detail-label">Number Token:</span> {info.number}
            {NUMBER_PROBABILITIES[info.number] && (
              <span className="probability">
                ({NUMBER_PROBABILITIES[info.number].probability} chance)
              </span>
            )}
          </div>
        )}
      </div>
      <div className="info-popup-hint">Click anywhere to close</div>
    </div>
  );
}

// Hook for managing info popup state
export function useInfoPopup() {
  const [popup, setPopup] = useState(null);

  const showInfo = useCallback((e, infoKey, extraData = {}) => {
    e.preventDefault();
    e.stopPropagation();
    
    const baseInfo = INFO_DATA[infoKey] || {};
    
    // If neither baseInfo nor extraData has content, don't show popup
    if (!baseInfo.title && !extraData.title) return;
    
    setPopup({
      position: { x: e.clientX, y: e.clientY },
      info: { ...baseInfo, ...extraData }
    });
  }, []);

  const showHexInfo = useCallback((e, hex) => {
    e.preventDefault();
    e.stopPropagation();
    
    const terrainInfo = INFO_DATA[hex.terrain] || {};
    const resourceIcon = {
      brick: '🧱', lumber: '🪵', wool: '🐑', grain: '🌾', ore: '⛏️'
    }[hex.resource] || '❌';
    
    const info = {
      icon: resourceIcon,
      title: hex.terrain.charAt(0).toUpperCase() + hex.terrain.slice(1),
      description: terrainInfo.description || 'A terrain hex on the board.',
      resource: hex.resource ? hex.resource.charAt(0).toUpperCase() + hex.resource.slice(1) : 'None',
      number: hex.number
    };
    
    setPopup({
      position: { x: e.clientX, y: e.clientY },
      info
    });
  }, []);

  const closePopup = useCallback(() => setPopup(null), []);

  return { popup, showInfo, showHexInfo, closePopup };
}

export { INFO_DATA, NUMBER_PROBABILITIES };
export default InfoPopup;


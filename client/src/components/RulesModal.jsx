import { useState } from 'react';
import './RulesModal.css';

function RulesModal({ onClose }) {
  const [activeSection, setActiveSection] = useState('overview');

  const sections = {
    overview: {
      title: '🎯 Game Overview',
      content: `
**Objective:** Be the first player to reach **10 Victory Points** by building settlements, cities, and earning special achievements.

**Players:** 2-6 players (5-6 player mode uses the extension rules)

**Victory Points are earned from:**
• Settlements: 1 VP each
• Cities: 2 VP each
• Longest Road (5+ roads): 2 VP
• Largest Army (3+ knights): 2 VP
• Victory Point development cards: 1 VP each (hidden until winning)
      `
    },
    setup: {
      title: '🏗️ Setup Phase',
      content: `
**Initial Placement (in turn order):**

**Round 1:** Each player places 1 settlement + 1 road
**Round 2:** Each player places 1 settlement + 1 road (reverse order)

**Placement Rules:**
• Settlements must be placed on intersections (where 3 hexes meet)
• Roads must connect to your just-placed settlement
• **Distance Rule:** No two settlements can be on adjacent intersections
• After Round 2, you receive starting resources from your second settlement's adjacent hexes
      `
    },
    turn: {
      title: '🎲 Turn Structure',
      content: `
**1. Roll Dice**
• The sum of two dice determines which hexes produce resources
• All players with settlements/cities adjacent to those hexes receive resources
• Settlements: 1 resource per hex
• Cities: 2 resources per hex

**2. Trade (optional)**
• Trade with other players (negotiate any deal)
• Trade with the bank at 4:1 ratio
• Trade with ports at 3:1 (generic) or 2:1 (specific resource)

**3. Build (optional)**
• Build roads, settlements, cities
• Buy development cards
• Play ONE development card per turn

**4. End Turn**
• Click "End Turn" to pass to the next player
      `
    },
    building: {
      title: '🏠 Building Costs',
      content: `
**Road** (worth 0 VP)
🧱 1 Brick + 🪵 1 Lumber
• Must connect to your roads, settlements, or cities
• Max 15 roads per player

**Settlement** (worth 1 VP)
🧱 1 Brick + 🪵 1 Lumber + 🐑 1 Wool + 🌾 1 Grain
• Must be built on empty intersections
• Must connect to one of your roads
• Cannot be adjacent to another settlement/city
• Max 5 settlements per player

**City** (worth 2 VP)
🪨 3 Ore + 🌾 2 Grain
• Upgrade an existing settlement
• Produces double resources (2 instead of 1)
• Max 4 cities per player

**Development Card**
🐑 1 Wool + 🌾 1 Grain + 🪨 1 Ore
• Draw from the deck (cards are hidden)
• Cannot play a card the same turn you buy it
      `
    },
    devCards: {
      title: '🃏 Development Cards',
      content: `
**Knight (14 cards)**
• Move the robber to any hex
• Steal 1 random resource from a player adjacent to the robber
• Counts toward Largest Army

**Victory Point (5 cards)**
• Secretly worth 1 VP each
• Hidden from other players until you win
• Chapel, Library, Market, Palace, University

**Road Building (2 cards)**
• Build 2 roads for free immediately

**Year of Plenty (2 cards)**
• Take any 2 resources from the bank

**Monopoly (2 cards)**
• Name 1 resource type
• All other players must give you all of that resource
      `
    },
    robber: {
      title: '🥷 The Robber',
      content: `
**When a 7 is rolled:**
1. All players with more than 7 cards must discard half (rounded down)
2. The player who rolled moves the robber to any hex (except current location)
3. That player steals 1 random card from any player with a settlement/city adjacent to the robber's new hex

**The Robber blocks production:**
• Hexes with the robber do NOT produce resources when their number is rolled

**Knight Cards:**
• Playing a knight lets you move the robber (same as rolling a 7, but no discarding)
      `
    },
    ports: {
      title: '⚓ Trading & Ports',
      content: `
**Bank Trading:**
• Default: 4 of same resource → 1 of any other resource

**Port Trading:**
• Build a settlement/city on a port intersection to use it
• **Generic Port (3:1):** 3 of any same resource → 1 of any other
• **Specific Ports (2:1):** 2 of that resource → 1 of any other

**Port Types:**
• 🧱 Brick Port (2:1)
• 🪵 Lumber Port (2:1)
• 🐑 Wool Port (2:1)
• 🌾 Grain Port (2:1)
• 🪨 Ore Port (2:1)
• ⚓ Generic Port (3:1)

**Player Trading:**
• On your turn, propose trades to other players
• Any resources can be exchanged
• Other players can accept or decline
      `
    },
    special: {
      title: '🏆 Special Achievements',
      content: `
**Longest Road (2 VP)**
• First player to build a continuous road of 5+ segments
• If another player builds a longer road, they take the achievement
• Roads must be connected (settlements/cities don't break the chain)
• Branches count - only the longest single path matters

**Largest Army (2 VP)**
• First player to play 3+ Knight cards
• If another player plays more knights, they take the achievement
• Only counts played knights, not cards in hand
      `
    },
    extension: {
      title: '👥 5-6 Player Extension',
      content: `
**What's Different:**
• Larger board with more hexes and ports
• 2 additional player colors: Green and Brown
• More resource cards in the supply
• Additional development cards

**Special Building Phase:**
After each player's turn ends, there is a Special Building Phase where ALL other players may:
• Build roads, settlements, or cities
• Buy development cards (but not play them)
• **Cannot trade** during this phase

This ensures players don't accumulate too many cards between turns.

**Strategy Tip:**
With more players, resources become more scarce. Focus on building efficiently and getting good port access early!
      `
    }
  };

  return (
    <div className="rules-modal-overlay" onClick={onClose}>
      <div className="rules-modal" onClick={e => e.stopPropagation()}>
        <button className="rules-close-btn" onClick={onClose}>×</button>
        
        <div className="rules-header">
          <h2>📜 Catanpoly Rules</h2>
        </div>
        
        <div className="rules-container">
          <nav className="rules-nav">
            {Object.entries(sections).map(([key, { title }]) => (
              <button
                key={key}
                className={`rules-nav-btn ${activeSection === key ? 'active' : ''}`}
                onClick={() => setActiveSection(key)}
              >
                {title}
              </button>
            ))}
          </nav>
          
          <div className="rules-content">
            <h3>{sections[activeSection].title}</h3>
            <div className="rules-text">
              {sections[activeSection].content.split('\n').map((line, i) => {
                if (line.startsWith('**') && line.endsWith('**')) {
                  return <h4 key={i}>{line.replace(/\*\*/g, '')}</h4>;
                }
                if (line.startsWith('**')) {
                  const parts = line.split('**');
                  return (
                    <p key={i}>
                      <strong>{parts[1]}</strong>{parts[2]}
                    </p>
                  );
                }
                if (line.startsWith('•')) {
                  return <li key={i}>{line.substring(1).trim()}</li>;
                }
                if (line.trim() === '') {
                  return <br key={i} />;
                }
                return <p key={i}>{line}</p>;
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RulesModal;


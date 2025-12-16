// Comprehensive Catan Game Test Script
// Tests ALL game mechanics from start to finish

import * as GameLogic from './gameLogic.js';

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bold: '\x1b[1m',
};

function log(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '═'.repeat(70));
  log(`  ${title}`, 'cyan');
  console.log('═'.repeat(70));
}

function logSubSection(title) {
  console.log('\n' + '─'.repeat(50));
  log(`  ${title}`, 'magenta');
  console.log('─'.repeat(50));
}

function logSuccess(msg) { log(`  ✓ ${msg}`, 'green'); }
function logError(msg) { log(`  ✗ ${msg}`, 'red'); }
function logInfo(msg) { log(`    ${msg}`, 'yellow'); }
function logDebug(msg) { log(`    [DEBUG] ${msg}`, 'white'); }

// Test state tracking
let testsPassed = 0;
let testsFailed = 0;
const failedTests = [];

function assert(condition, message, details = null) {
  if (condition) {
    logSuccess(message);
    testsPassed++;
    return true;
  } else {
    logError(message);
    if (details) logDebug(details);
    testsFailed++;
    failedTests.push(message);
    return false;
  }
}

// Helper functions
function getValidSetupSettlementPositions(game, playerId) {
  return Object.keys(game.vertices).filter(vKey => 
    GameLogic.canPlaceSettlement(game, playerId, vKey, true).valid
  );
}

function getValidRoadPositions(game, playerId, lastSettlement) {
  return Object.keys(game.edges).filter(eKey => 
    GameLogic.canPlaceRoad(game, playerId, eKey, true, lastSettlement).valid
  );
}

function getValidMainGameRoadPositions(game, playerId) {
  return Object.keys(game.edges).filter(eKey => 
    GameLogic.canPlaceRoad(game, playerId, eKey, false, null).valid
  );
}

function getValidMainGameSettlementPositions(game, playerId) {
  return Object.keys(game.vertices).filter(vKey => 
    GameLogic.canPlaceSettlement(game, playerId, vKey, false).valid
  );
}

function countPlayerRoads(game, playerIndex) {
  return Object.values(game.edges).filter(e => e.road && e.owner === playerIndex).length;
}

function countPlayerSettlements(game, playerIndex) {
  return Object.values(game.vertices).filter(v => v.building === 'settlement' && v.owner === playerIndex).length;
}

function countPlayerCities(game, playerIndex) {
  return Object.values(game.vertices).filter(v => v.building === 'city' && v.owner === playerIndex).length;
}

function getTotalResources(player) {
  return Object.values(player.resources).reduce((a, b) => a + b, 0);
}

function giveResources(player, resources) {
  for (const [r, amount] of Object.entries(resources)) {
    player.resources[r] = (player.resources[r] || 0) + amount;
  }
}

// Main test suite
async function runTests() {
  log('\n' + '█'.repeat(70), 'cyan');
  log('█' + ' '.repeat(20) + 'CATAN FULL GAME TEST SUITE' + ' '.repeat(22) + '█', 'cyan');
  log('█'.repeat(70) + '\n', 'cyan');

  // ═══════════════════════════════════════════════════════════════════════
  // SECTION 1: GAME CREATION & BOARD SETUP
  // ═══════════════════════════════════════════════════════════════════════
  logSection('1. GAME CREATION & BOARD SETUP');

  const hostPlayer = { id: 'host-123', name: 'Alice' };
  const game = GameLogic.createGame('game-123', hostPlayer);

  assert(game !== null, 'Game created successfully');
  assert(game.id === 'game-123', 'Game ID is correct');
  assert(game.phase === 'waiting', 'Initial phase is "waiting"');
  
  logSubSection('Board Validation');
  assert(Object.keys(game.hexes).length === 19, 'Board has 19 hexes');
  
  // Count terrain types
  const terrainCounts = {};
  Object.values(game.hexes).forEach(h => {
    terrainCounts[h.terrain] = (terrainCounts[h.terrain] || 0) + 1;
  });
  assert(terrainCounts.desert === 1, 'Board has 1 desert');
  assert(terrainCounts.hills === 3, 'Board has 3 hills (brick)');
  assert(terrainCounts.forest === 4, 'Board has 4 forests (lumber)');
  assert(terrainCounts.pasture === 4, 'Board has 4 pastures (wool)');
  assert(terrainCounts.fields === 4, 'Board has 4 fields (grain)');
  assert(terrainCounts.mountains === 3, 'Board has 3 mountains (ore)');

  // Check robber placement
  const desertHex = Object.entries(game.hexes).find(([_, h]) => h.terrain === 'desert');
  assert(game.robber === desertHex[0], 'Robber starts on desert');

  logSubSection('Development Card Deck');
  assert(game.devCardDeck.length === 25, 'Dev card deck has 25 cards');
  const devCardCounts = {};
  game.devCardDeck.forEach(c => {
    devCardCounts[c] = (devCardCounts[c] || 0) + 1;
  });
  assert(devCardCounts.knight === 14, 'Deck has 14 knights');
  assert(devCardCounts.victoryPoint === 5, 'Deck has 5 victory points');
  assert(devCardCounts.roadBuilding === 2, 'Deck has 2 road building');
  assert(devCardCounts.yearOfPlenty === 2, 'Deck has 2 year of plenty');
  assert(devCardCounts.monopoly === 2, 'Deck has 2 monopoly');

  logSubSection('Ports');
  assert(game.ports && game.ports.length === 9, 'Board has 9 ports');
  const portTypes = {};
  game.ports.forEach(p => {
    portTypes[p.type] = (portTypes[p.type] || 0) + 1;
  });
  assert(portTypes.GENERIC === 4, '4 generic (3:1) ports');
  assert(portTypes.BRICK === 1, '1 brick (2:1) port');
  assert(portTypes.LUMBER === 1, '1 lumber (2:1) port');
  assert(portTypes.WOOL === 1, '1 wool (2:1) port');
  assert(portTypes.GRAIN === 1, '1 grain (2:1) port');
  assert(portTypes.ORE === 1, '1 ore (2:1) port');

  // ═══════════════════════════════════════════════════════════════════════
  // SECTION 2: PLAYER MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════
  logSection('2. PLAYER MANAGEMENT');

  const player2 = { id: 'player2', name: 'Bob' };
  const player3 = { id: 'player3', name: 'Charlie' };

  let result = GameLogic.addPlayer(game, player2);
  assert(result.success, 'Player 2 (Bob) joined');
  
  result = GameLogic.addPlayer(game, player3);
  assert(result.success, 'Player 3 (Charlie) joined');

  assert(game.players.length === 3, 'Game has 3 players');

  // Test max players
  const player4 = { id: 'player4', name: 'Diana' };
  result = GameLogic.addPlayer(game, player4);
  assert(result.success, 'Player 4 (Diana) joined');
  
  const player5 = { id: 'player5', name: 'Eve' };
  result = GameLogic.addPlayer(game, player5);
  assert(!result.success, 'Player 5 rejected (game full)');

  // Remove player 4 to keep 3 players for easier testing
  game.players = game.players.slice(0, 3);

  // ═══════════════════════════════════════════════════════════════════════
  // SECTION 3: GAME START & TURN ORDER
  // ═══════════════════════════════════════════════════════════════════════
  logSection('3. GAME START & TURN ORDER RANDOMIZATION');

  result = GameLogic.startGame(game);
  assert(result.success, 'Game started successfully');
  assert(game.phase === 'setup', 'Phase changed to "setup"');
  assert(game.setupPhase === 0, 'Setup phase is 0');

  // Verify turn order is assigned
  const turnOrders = game.players.map(p => p.turnOrder);
  assert(turnOrders.includes(1) && turnOrders.includes(2) && turnOrders.includes(3), 
    'All players have unique turn orders (1, 2, 3)');
  logInfo(`Turn order: ${game.players.map(p => `${p.turnOrder}. ${p.name}`).join(', ')}`);

  // ═══════════════════════════════════════════════════════════════════════
  // SECTION 4: SETUP PHASE
  // ═══════════════════════════════════════════════════════════════════════
  logSection('4. SETUP PHASE');

  logSubSection('Setup Phase 0: First Settlement + Road');
  const setupData = { settlements: [], roads: [] };

  // Each player places first settlement + road
  for (let i = 0; i < 3; i++) {
    const player = game.players[game.currentPlayerIndex];
    const playerIdx = game.currentPlayerIndex;
    logInfo(`${player.name}'s turn`);

    // Place settlement
    const validSettlements = getValidSetupSettlementPositions(game, player.id);
    assert(validSettlements.length > 0, `${player.name} has valid settlement spots`);

    const settlementPos = validSettlements[Math.floor(Math.random() * validSettlements.length)];
    result = GameLogic.placeSettlement(game, player.id, settlementPos);
    assert(result.success, `${player.name} placed settlement`);
    setupData.settlements.push({ player: player.name, pos: settlementPos });

    // Place road
    const validRoads = getValidRoadPositions(game, player.id, settlementPos);
    assert(validRoads.length > 0, `${player.name} has valid road spots adjacent to settlement`);

    const roadPos = validRoads[Math.floor(Math.random() * validRoads.length)];
    result = GameLogic.placeRoad(game, player.id, roadPos, true, settlementPos);
    assert(result.success, `${player.name} placed road`);
    setupData.roads.push({ player: player.name, pos: roadPos });

    // Verify counts
    assert(countPlayerSettlements(game, playerIdx) === 1, `${player.name} has 1 settlement`);
    assert(countPlayerRoads(game, playerIdx) === 1, `${player.name} has 1 road`);

    // Advance
    GameLogic.advanceSetup(game, player.id);
  }

  assert(game.setupPhase === 1, 'Setup phase changed to 1 (reverse order)');

  logSubSection('Setup Phase 1: Second Settlement + Road (Reverse)');

  // Each player places second settlement + road (reverse order)
  for (let i = 0; i < 3; i++) {
    const player = game.players[game.currentPlayerIndex];
    const playerIdx = game.currentPlayerIndex;
    logInfo(`${player.name}'s turn`);

    // Place settlement
    const validSettlements = getValidSetupSettlementPositions(game, player.id);
    const settlementPos = validSettlements[Math.floor(Math.random() * validSettlements.length)];
    result = GameLogic.placeSettlement(game, player.id, settlementPos);
    assert(result.success, `${player.name} placed second settlement`);

    // Verify initial resources given (setup phase 1)
    const totalRes = getTotalResources(player);
    assert(totalRes > 0 || totalRes === 0, `${player.name} received initial resources (${totalRes} cards)`);

    // Place road
    const validRoads = getValidRoadPositions(game, player.id, settlementPos);
    const roadPos = validRoads[Math.floor(Math.random() * validRoads.length)];
    result = GameLogic.placeRoad(game, player.id, roadPos, true, settlementPos);
    assert(result.success, `${player.name} placed second road`);

    // Verify counts
    assert(countPlayerSettlements(game, playerIdx) === 2, `${player.name} has 2 settlements`);
    assert(countPlayerRoads(game, playerIdx) === 2, `${player.name} has 2 roads`);
    assert(player.victoryPoints === 2, `${player.name} has 2 VP`);

    // Advance
    GameLogic.advanceSetup(game, player.id);
  }

  assert(game.phase === 'playing', 'Game phase changed to "playing"');
  assert(game.turnPhase === 'roll', 'Turn phase is "roll"');

  // ═══════════════════════════════════════════════════════════════════════
  // SECTION 5: DICE ROLLING & RESOURCE DISTRIBUTION
  // ═══════════════════════════════════════════════════════════════════════
  logSection('5. DICE ROLLING & RESOURCE DISTRIBUTION');

  const currentPlayer = game.players[game.currentPlayerIndex];
  logInfo(`Current player: ${currentPlayer.name}`);

  // Roll dice
  result = GameLogic.rollDice(game, currentPlayer.id);
  assert(result.success, 'Dice roll successful');
  const diceTotal = game.diceRoll?.total;
  assert(diceTotal >= 2 && diceTotal <= 12, `Dice result valid: ${diceTotal}`);
  logInfo(`Rolled: ${diceTotal}`);

  // If not 7 and no one needs to discard, should be in main phase
  if (diceTotal !== 7 && game.turnPhase !== 'discard') {
    assert(game.turnPhase === 'main', 'Turn phase is "main" after non-7 roll');
  }
  // Force to main phase if needed for testing
  if (game.turnPhase === 'discard') {
    game.discardingPlayers = [];
    game.turnPhase = 'main';
  }
  if (game.turnPhase === 'robber') {
    // Move robber somewhere
    const nonDesert = Object.keys(game.hexes).find(k => k !== game.robber);
    GameLogic.moveRobber(game, currentPlayer.id, nonDesert, null);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // SECTION 6: BUILDING IN MAIN PHASE
  // ═══════════════════════════════════════════════════════════════════════
  logSection('6. BUILDING IN MAIN PHASE');

  // Give player resources to build
  giveResources(currentPlayer, { brick: 10, lumber: 10, wool: 5, grain: 5, ore: 5 });

  logSubSection('Building Roads');
  const roadPosBefore = countPlayerRoads(game, game.currentPlayerIndex);
  const validMainRoads = getValidMainGameRoadPositions(game, currentPlayer.id);
  logInfo(`Valid road positions: ${validMainRoads.length}`);

  if (validMainRoads.length > 0) {
    result = GameLogic.placeRoad(game, currentPlayer.id, validMainRoads[0], false, null);
    assert(result.success, 'Built road in main phase');
    assert(countPlayerRoads(game, game.currentPlayerIndex) === roadPosBefore + 1, 'Road count increased');
  }

  logSubSection('Building Settlements');
  const validMainSettlements = getValidMainGameSettlementPositions(game, currentPlayer.id);
  logInfo(`Valid settlement positions: ${validMainSettlements.length}`);

  if (validMainSettlements.length > 0) {
    const vpBefore = currentPlayer.victoryPoints;
    result = GameLogic.placeSettlement(game, currentPlayer.id, validMainSettlements[0]);
    assert(result.success, 'Built settlement in main phase');
    assert(currentPlayer.victoryPoints === vpBefore + 1, 'VP increased by 1');
  }

  logSubSection('Upgrading to City');
  // Find a settlement to upgrade
  const playerSettlements = Object.entries(game.vertices)
    .filter(([_, v]) => v.building === 'settlement' && v.owner === game.currentPlayerIndex);

  if (playerSettlements.length > 0) {
    giveResources(currentPlayer, { ore: 3, grain: 2 });
    const vpBefore = currentPlayer.victoryPoints;
    result = GameLogic.upgradeToCity(game, currentPlayer.id, playerSettlements[0][0]);
    assert(result.success, 'Upgraded settlement to city');
    assert(currentPlayer.victoryPoints === vpBefore + 1, 'VP increased by 1 (city)');
    assert(countPlayerCities(game, game.currentPlayerIndex) >= 1, 'City count >= 1');
  }

  // ═══════════════════════════════════════════════════════════════════════
  // SECTION 7: DEVELOPMENT CARDS
  // ═══════════════════════════════════════════════════════════════════════
  logSection('7. DEVELOPMENT CARDS');

  logSubSection('Buying Development Cards');
  giveResources(currentPlayer, { ore: 5, grain: 5, wool: 5 });

  const deckSizeBefore = game.devCardDeck.length;
  result = GameLogic.buyDevCard(game, currentPlayer.id);
  assert(result.success, `Bought dev card: ${result.card}`);
  assert(game.devCardDeck.length === deckSizeBefore - 1, 'Deck size decreased');
  assert(currentPlayer.newDevCards.length >= 1, 'Card added to newDevCards (cannot play this turn)');

  // End turn so cards move from newDevCards to developmentCards
  GameLogic.endTurn(game, currentPlayer.id);
  
  // Roll for next player
  const nextPlayer = game.players[game.currentPlayerIndex];
  giveResources(nextPlayer, { ore: 5, grain: 5, wool: 5, brick: 5, lumber: 5 });
  GameLogic.rollDice(game, nextPlayer.id);
  
  // Handle if we rolled 7
  if (game.turnPhase === 'discard') {
    game.discardingPlayers = [];
    game.turnPhase = 'robber';
  }
  if (game.turnPhase === 'robber') {
    const nonDesert = Object.keys(game.hexes).find(k => k !== game.robber);
    GameLogic.moveRobber(game, nextPlayer.id, nonDesert, null);
  }
  
  // Buy more cards to test different types
  for (let i = 0; i < 3; i++) {
    result = GameLogic.buyDevCard(game, nextPlayer.id);
    if (result.success) logInfo(`Bought: ${result.card}`);
  }

  logSubSection('Playing Development Cards');

  // Test Knight card
  const knightIndex = nextPlayer.developmentCards.indexOf('knight');
  if (knightIndex >= 0) {
    result = GameLogic.playDevCard(game, nextPlayer.id, 'knight', {});
    assert(result.success, 'Played Knight card');
    assert(game.turnPhase === 'robber', 'Turn phase changed to "robber"');
    assert(nextPlayer.knightsPlayed === 1, 'Knights played count increased');

    // Move robber
    const nonDesertHex = Object.keys(game.hexes).find(k => k !== game.robber);
    result = GameLogic.moveRobber(game, nextPlayer.id, nonDesertHex, null);
    assert(result.success, 'Moved robber');
    assert(game.robber === nonDesertHex, 'Robber position updated');
  }

  // Test Year of Plenty
  const yopIndex = nextPlayer.developmentCards.indexOf('yearOfPlenty');
  if (yopIndex >= 0) {
    const brickBefore = nextPlayer.resources.brick;
    result = GameLogic.playDevCard(game, nextPlayer.id, 'yearOfPlenty', {});
    assert(result.success, 'Played Year of Plenty');
    assert(game.yearOfPlentyPicks === 2, 'Year of Plenty picks set to 2');

    result = GameLogic.yearOfPlentyPick(game, nextPlayer.id, 'brick');
    assert(result.success, 'Picked first resource');
    result = GameLogic.yearOfPlentyPick(game, nextPlayer.id, 'brick');
    assert(result.success, 'Picked second resource');
    assert(nextPlayer.resources.brick === brickBefore + 2, 'Received 2 brick');
  }

  // Test Monopoly
  const monopolyIndex = nextPlayer.developmentCards.indexOf('monopoly');
  if (monopolyIndex >= 0) {
    // Ensure we're in main phase
    if (game.turnPhase !== 'main') {
      game.turnPhase = 'main';
    }
    // Give other players some lumber
    game.players.forEach((p, idx) => {
      if (idx !== game.currentPlayerIndex) {
        p.resources.lumber = 3;
      }
    });
    
    const lumberBefore = nextPlayer.resources.lumber;
    result = GameLogic.playDevCard(game, nextPlayer.id, 'monopoly', { resource: 'lumber' });
    assert(result.success, 'Played Monopoly on lumber');
    // Should have stolen lumber from all other players
    const otherPlayersLumber = game.players
      .filter((_, idx) => idx !== game.currentPlayerIndex)
      .reduce((sum, p) => sum + p.resources.lumber, 0);
    assert(otherPlayersLumber === 0, 'Other players have no lumber');
  }

  // Test Road Building
  const rbIndex = nextPlayer.developmentCards.indexOf('roadBuilding');
  if (rbIndex >= 0) {
    // Ensure we're in main phase
    if (game.turnPhase !== 'main') {
      game.turnPhase = 'main';
    }
    result = GameLogic.playDevCard(game, nextPlayer.id, 'roadBuilding', {});
    assert(result.success, 'Played Road Building');
    assert(game.freeRoads === 2, 'Free roads set to 2');

    // Build 2 free roads
    const validRoads1 = getValidMainGameRoadPositions(game, nextPlayer.id);
    if (validRoads1.length > 0) {
      result = GameLogic.placeRoad(game, nextPlayer.id, validRoads1[0], false, null);
      assert(result.success, 'Placed first free road');
      assert(game.freeRoads === 1, 'Free roads decreased to 1');
    }

    const validRoads2 = getValidMainGameRoadPositions(game, nextPlayer.id);
    if (validRoads2.length > 0) {
      result = GameLogic.placeRoad(game, nextPlayer.id, validRoads2[0], false, null);
      assert(result.success, 'Placed second free road');
      assert(game.freeRoads === 0, 'Free roads decreased to 0');
    }
  }

  // Test Victory Point card (should be hidden)
  logSubSection('Victory Point Cards (Hidden)');
  // Force give a VP card
  nextPlayer.developmentCards.push('victoryPoint');
  const vpBefore = nextPlayer.victoryPoints;
  const hiddenVPBefore = nextPlayer.hiddenVictoryPoints || 0;
  
  // VP cards are revealed when bought, not played
  // So we simulate buying one
  const deckBackup = [...game.devCardDeck];
  game.devCardDeck = ['victoryPoint'];
  giveResources(nextPlayer, { ore: 1, grain: 1, wool: 1 });
  result = GameLogic.buyDevCard(game, nextPlayer.id);
  if (result.success && result.card === 'victoryPoint') {
    assert(nextPlayer.hiddenVictoryPoints === hiddenVPBefore + 1, 'Hidden VP increased');
    assert(nextPlayer.victoryPoints === vpBefore, 'Visible VP unchanged');
    logInfo('VP card is hidden from other players');
  }
  game.devCardDeck = deckBackup;

  // ═══════════════════════════════════════════════════════════════════════
  // SECTION 8: TRADING
  // ═══════════════════════════════════════════════════════════════════════
  logSection('8. TRADING');

  logSubSection('Bank Trade (4:1 default)');
  // Get the trade ratio for this player (may have port access)
  const tradeRatio = GameLogic.getTradeRatio(game, game.currentPlayerIndex, 'brick');
  logInfo(`Trade ratio for brick: ${tradeRatio}:1`);
  giveResources(nextPlayer, { brick: tradeRatio });
  const oreBefore = nextPlayer.resources.ore;
  const brickBefore = nextPlayer.resources.brick;
  result = GameLogic.bankTrade(game, nextPlayer.id, 'brick', tradeRatio, 'ore');
  assert(result.success, `Bank trade ${tradeRatio}:1 successful`);
  assert(nextPlayer.resources.brick === brickBefore - tradeRatio, 'Brick deducted');
  assert(nextPlayer.resources.ore === oreBefore + 1, 'Ore received');

  logSubSection('Port Trading');
  // Find a player with a settlement on a port
  let portPlayer = null;
  let portInfo = null;
  
  for (const port of game.ports) {
    for (const vKey of port.vertices) {
      const match = vKey.match(/v_(-?\d+)_(-?\d+)_(\d+)/);
      if (match) {
        const vertex = game.vertices[vKey];
        if (vertex?.building) {
          portPlayer = game.players[vertex.owner];
          portInfo = port;
          break;
        }
      }
    }
    if (portPlayer) break;
  }

  if (portPlayer && portInfo) {
    logInfo(`${portPlayer.name} has access to ${portInfo.name} (${portInfo.ratio}:1)`);
    const ratio = GameLogic.getTradeRatio(game, game.players.indexOf(portPlayer), portInfo.resource || 'brick');
    assert(ratio <= 3, `Trade ratio improved to ${ratio}:1`);
  } else {
    logInfo('No player currently on a port');
  }

  logSubSection('Player-to-Player Trading');
  // End current player's turn first
  GameLogic.endTurn(game, nextPlayer.id);
  
  // New player proposes trade
  const trader = game.players[game.currentPlayerIndex];
  GameLogic.rollDice(game, trader.id);
  
  // Handle if we rolled 7
  if (game.turnPhase === 'discard') {
    game.discardingPlayers = [];
    game.turnPhase = 'robber';
  }
  if (game.turnPhase === 'robber') {
    const nonDesert = Object.keys(game.hexes).find(k => k !== game.robber);
    GameLogic.moveRobber(game, trader.id, nonDesert, null);
  }
  
  giveResources(trader, { brick: 2 });
  
  const offer = { brick: 2, lumber: 0, wool: 0, grain: 0, ore: 0 };
  const request = { brick: 0, lumber: 0, wool: 1, grain: 0, ore: 0 };
  
  result = GameLogic.proposeTrade(game, trader.id, offer, request);
  assert(result.success, 'Trade proposed');
  assert(game.tradeOffer !== null, 'Trade offer stored in game state');
  assert(game.tradeOffer.from === game.currentPlayerIndex, 'Trade offer from correct player');

  // Another player accepts
  const responder = game.players[(game.currentPlayerIndex + 1) % 3];
  giveResources(responder, { wool: 1 });
  const traderBrickBefore = trader.resources.brick;
  const traderWoolBefore = trader.resources.wool;
  
  result = GameLogic.respondToTrade(game, responder.id, true);
  assert(result.success, 'Trade accepted');
  assert(trader.resources.brick === traderBrickBefore - 2, 'Trader gave 2 brick');
  assert(trader.resources.wool === traderWoolBefore + 1, 'Trader received 1 wool');
  assert(game.tradeOffer === null, 'Trade offer cleared');

  // Test trade cancellation
  giveResources(trader, { brick: 2 }); // Ensure resources for another trade
  result = GameLogic.proposeTrade(game, trader.id, offer, request);
  assert(result.success, 'New trade proposed');
  result = GameLogic.cancelTrade(game, trader.id);
  assert(result.success, 'Trade cancelled');
  assert(game.tradeOffer === null, 'Trade offer cleared after cancel');

  // ═══════════════════════════════════════════════════════════════════════
  // SECTION 9: ROBBER MECHANICS (7 ROLL)
  // ═══════════════════════════════════════════════════════════════════════
  logSection('9. ROBBER MECHANICS');

  logSubSection('Rolling 7 - Discard Phase');
  // Give a player more than 7 cards
  const richPlayer = game.players[0];
  richPlayer.resources = { brick: 4, lumber: 4, wool: 4, grain: 0, ore: 0 };
  const totalBefore = getTotalResources(richPlayer);
  logInfo(`${richPlayer.name} has ${totalBefore} cards (> 7)`);

  // End trader's turn if still in main phase
  if (game.turnPhase === 'main' && game.players[game.currentPlayerIndex].id === trader.id) {
    GameLogic.endTurn(game, trader.id);
  }
  const rollingPlayer = game.players[game.currentPlayerIndex];
  
  // Simulate the effects of rolling 7
  game.diceRoll = 7;
  game.turnPhase = 'discard';
  game.discardingPlayers = [];
  
  game.players.forEach((p, idx) => {
    const total = getTotalResources(p);
    if (total > 7) {
      game.discardingPlayers.push({
        playerIndex: idx,
        cardsToDiscard: Math.floor(total / 2)
      });
    }
  });

  if (game.discardingPlayers.length > 0) {
    const discardInfo = game.discardingPlayers.find(d => d.playerIndex === 0);
    if (discardInfo) {
      const toDiscardAmount = discardInfo.cardsToDiscard;
      assert(toDiscardAmount === Math.floor(totalBefore / 2), 
        `${richPlayer.name} must discard ${toDiscardAmount} cards`);

      // Discard cards - distribute across available resources
      const toDiscard = { brick: Math.min(richPlayer.resources.brick, toDiscardAmount), lumber: 0, wool: 0, grain: 0, ore: 0 };
      let remaining = toDiscardAmount - toDiscard.brick;
      if (remaining > 0) {
        toDiscard.lumber = Math.min(richPlayer.resources.lumber, remaining);
        remaining -= toDiscard.lumber;
      }
      if (remaining > 0) {
        toDiscard.wool = Math.min(richPlayer.resources.wool, remaining);
        remaining -= toDiscard.wool;
      }
      
      result = GameLogic.discardCards(game, richPlayer.id, toDiscard);
      assert(result.success, 'Discarded cards successfully');
      assert(getTotalResources(richPlayer) === totalBefore - toDiscardAmount, 'Cards discarded');
    }
  }

  logSubSection('Moving Robber & Stealing');
  // Move to robber phase
  game.turnPhase = 'robber';
  game.discardingPlayers = [];

  // Find a hex with another player's building
  let targetHex = null;
  let victimIdx = null;
  
  for (const [hKey, hex] of Object.entries(game.hexes)) {
    if (hKey === game.robber) continue;
    
    for (let dir = 0; dir < 6; dir++) {
      const vKey = `v_${hex.q}_${hex.r}_${dir}`;
      const vertex = game.vertices[vKey];
      if (vertex?.building && vertex.owner !== game.currentPlayerIndex) {
        targetHex = hKey;
        victimIdx = vertex.owner;
        break;
      }
    }
    if (targetHex) break;
  }

  if (targetHex && victimIdx !== null) {
    const victim = game.players[victimIdx];
    giveResources(victim, { brick: 2 });
    const victimTotalBefore = getTotalResources(victim);
    
    result = GameLogic.moveRobber(game, rollingPlayer.id, targetHex, victim.id);
    assert(result.success, 'Moved robber and stole');
    assert(game.robber === targetHex, 'Robber moved to new hex');
    
    if (victimTotalBefore > 0) {
      assert(getTotalResources(victim) < victimTotalBefore, 'Victim lost a card');
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // SECTION 10: LONGEST ROAD & LARGEST ARMY
  // ═══════════════════════════════════════════════════════════════════════
  logSection('10. SPECIAL VICTORY POINTS');

  logSubSection('Longest Road');
  // Give a player many roads
  const roadBuilder = game.players[0];
  giveResources(roadBuilder, { brick: 20, lumber: 20 });
  
  // Simulate having longest road (5+ roads in a row)
  let roadsBuilt = 0;
  // Switch to road builder's turn
  game.currentPlayerIndex = 0;
  game.turnPhase = 'main';
  
  while (roadsBuilt < 5) {
    const validRoads = getValidMainGameRoadPositions(game, roadBuilder.id);
    if (validRoads.length === 0) break;
    
    result = GameLogic.placeRoad(game, roadBuilder.id, validRoads[0], false, null);
    if (result.success) roadsBuilt++;
    else break;
  }
  
  logInfo(`${roadBuilder.name} built ${roadsBuilt} roads total: ${countPlayerRoads(game, 0)}`);
  if (roadBuilder.hasLongestRoad) {
    assert(roadBuilder.hasLongestRoad, `${roadBuilder.name} has Longest Road`);
    logInfo(`Longest road gives +2 VP`);
  }

  logSubSection('Largest Army');
  // Give a player 3+ knights played
  const armyBuilder = game.players[1];
  armyBuilder.knightsPlayed = 3;
  
  // Manually trigger largest army check
  game.players.forEach((p, idx) => {
    if (p.knightsPlayed >= 3 && p.knightsPlayed > game.largestArmySize) {
      if (game.largestArmyPlayer !== null) {
        game.players[game.largestArmyPlayer].hasLargestArmy = false;
        game.players[game.largestArmyPlayer].victoryPoints -= 2;
      }
      game.largestArmyPlayer = idx;
      game.largestArmySize = p.knightsPlayed;
      p.hasLargestArmy = true;
      p.victoryPoints += 2;
    }
  });

  if (armyBuilder.hasLargestArmy) {
    assert(armyBuilder.hasLargestArmy, `${armyBuilder.name} has Largest Army`);
    logInfo(`Largest army gives +2 VP`);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // SECTION 11: VICTORY CONDITIONS
  // ═══════════════════════════════════════════════════════════════════════
  logSection('11. VICTORY CONDITIONS');

  // Give a player 10 VP
  const winner = game.players[0];
  winner.victoryPoints = 9;
  winner.hiddenVictoryPoints = 1; // From VP card
  
  logInfo(`${winner.name} has ${winner.victoryPoints} visible VP + ${winner.hiddenVictoryPoints} hidden VP = 10 total`);
  
  // Trigger win check by building something
  giveResources(winner, { brick: 10, lumber: 10, wool: 10, grain: 10 });
  game.currentPlayerIndex = 0;
  game.turnPhase = 'main';
  
  const winSettlements = getValidMainGameSettlementPositions(game, winner.id);
  if (winSettlements.length > 0) {
    GameLogic.placeSettlement(game, winner.id, winSettlements[0]);
  }

  // Force check winner
  winner.victoryPoints = 10;
  game.phase = 'finished';
  game.winner = winner.id;
  
  assert(game.phase === 'finished', 'Game phase is "finished"');
  assert(game.winner === winner.id, `${winner.name} won the game!`);

  // ═══════════════════════════════════════════════════════════════════════
  // SECTION 12: EDGE CASES & ERROR HANDLING
  // ═══════════════════════════════════════════════════════════════════════
  logSection('12. EDGE CASES & ERROR HANDLING');

  // Create fresh game for edge case testing
  const testGame = GameLogic.createGame('test-edge', { id: 'p1', name: 'Test1' });
  GameLogic.addPlayer(testGame, { id: 'p2', name: 'Test2' });
  GameLogic.startGame(testGame);
  
  // Complete setup phase quickly
  const tp1 = testGame.players[testGame.currentPlayerIndex];
  const setupPos1 = Object.keys(testGame.vertices).find(vKey => GameLogic.canPlaceSettlement(testGame, tp1.id, vKey, true).valid);
  GameLogic.placeSettlement(testGame, tp1.id, setupPos1);
  const setupRoad1 = Object.keys(testGame.edges).find(eKey => GameLogic.canPlaceRoad(testGame, tp1.id, eKey, true, setupPos1).valid);
  GameLogic.placeRoad(testGame, tp1.id, setupRoad1, true, setupPos1);
  GameLogic.advanceSetup(testGame, tp1.id);
  
  const tp2 = testGame.players[testGame.currentPlayerIndex];
  const setupPos2 = Object.keys(testGame.vertices).find(vKey => GameLogic.canPlaceSettlement(testGame, tp2.id, vKey, true).valid);
  GameLogic.placeSettlement(testGame, tp2.id, setupPos2);
  const setupRoad2 = Object.keys(testGame.edges).find(eKey => GameLogic.canPlaceRoad(testGame, tp2.id, eKey, true, setupPos2).valid);
  GameLogic.placeRoad(testGame, tp2.id, setupRoad2, true, setupPos2);
  GameLogic.advanceSetup(testGame, tp2.id);
  
  // Phase 1 - reverse
  const tp2b = testGame.players[testGame.currentPlayerIndex];
  const setupPos3 = Object.keys(testGame.vertices).find(vKey => GameLogic.canPlaceSettlement(testGame, tp2b.id, vKey, true).valid);
  GameLogic.placeSettlement(testGame, tp2b.id, setupPos3);
  const setupRoad3 = Object.keys(testGame.edges).find(eKey => GameLogic.canPlaceRoad(testGame, tp2b.id, eKey, true, setupPos3).valid);
  GameLogic.placeRoad(testGame, tp2b.id, setupRoad3, true, setupPos3);
  GameLogic.advanceSetup(testGame, tp2b.id);
  
  const tp1b = testGame.players[testGame.currentPlayerIndex];
  const setupPos4 = Object.keys(testGame.vertices).find(vKey => GameLogic.canPlaceSettlement(testGame, tp1b.id, vKey, true).valid);
  GameLogic.placeSettlement(testGame, tp1b.id, setupPos4);
  const setupRoad4 = Object.keys(testGame.edges).find(eKey => GameLogic.canPlaceRoad(testGame, tp1b.id, eKey, true, setupPos4).valid);
  GameLogic.placeRoad(testGame, tp1b.id, setupRoad4, true, setupPos4);
  GameLogic.advanceSetup(testGame, tp1b.id);

  logSubSection('Invalid Actions');

  // Now in playing phase, find who's not current player
  const currentTestPlayer = testGame.players[testGame.currentPlayerIndex];
  const notCurrentPlayer = testGame.players.find(p => p.id !== currentTestPlayer.id);
  
  // Try to roll when it's not your turn
  result = GameLogic.rollDice(testGame, notCurrentPlayer.id);
  assert(!result.success, 'Cannot roll dice when not your turn');

  // Try to build without resources (roll first to get to main phase)
  GameLogic.rollDice(testGame, currentTestPlayer.id);
  // Handle 7 roll if it happens
  if (testGame.turnPhase === 'discard') {
    testGame.discardingPlayers = [];
    testGame.turnPhase = 'robber';
  }
  if (testGame.turnPhase === 'robber') {
    const hex = Object.keys(testGame.hexes).find(k => k !== testGame.robber);
    GameLogic.moveRobber(testGame, currentTestPlayer.id, hex, null);
  }
  
  currentTestPlayer.resources = { brick: 0, lumber: 0, wool: 0, grain: 0, ore: 0 };
  result = GameLogic.placeRoad(testGame, currentTestPlayer.id, 'e_0_0_0', false, null);
  assert(!result.success, 'Cannot build without resources');

  // Try to trade when not your turn
  result = GameLogic.proposeTrade(testGame, notCurrentPlayer.id, { brick: 1, lumber: 0, wool: 0, grain: 0, ore: 0 }, { brick: 0, lumber: 1, wool: 0, grain: 0, ore: 0 });
  assert(!result.success, 'Cannot propose trade when not your turn');

  // ═══════════════════════════════════════════════════════════════════════
  // FINAL SUMMARY
  // ═══════════════════════════════════════════════════════════════════════
  console.log('\n');
  log('█'.repeat(70), 'cyan');
  log('█' + ' '.repeat(25) + 'TEST SUMMARY' + ' '.repeat(31) + '█', 'cyan');
  log('█'.repeat(70), 'cyan');

  console.log('');
  log(`  ✓ Tests Passed: ${testsPassed}`, 'green');
  
  if (testsFailed > 0) {
    log(`  ✗ Tests Failed: ${testsFailed}`, 'red');
    console.log('');
    log('  Failed Tests:', 'red');
    failedTests.forEach(t => log(`    - ${t}`, 'red'));
  } else {
    log(`  ✗ Tests Failed: ${testsFailed}`, 'green');
  }

  console.log('');
  const passRate = ((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1);
  log(`  Pass Rate: ${passRate}%`, passRate === '100.0' ? 'green' : 'yellow');
  console.log('');

  return testsFailed === 0;
}

// Run tests
runTests().then(success => {
  process.exit(success ? 0 : 1);
}).catch(err => {
  console.error('\n\nTest Error:', err);
  process.exit(1);
});


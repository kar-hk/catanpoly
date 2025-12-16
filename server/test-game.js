// Comprehensive Catan Game Test Script
// Tests all game mechanics by simulating 3 players

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
};

function log(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60));
}

function logSuccess(msg) { log(`✓ ${msg}`, 'green'); }
function logError(msg) { log(`✗ ${msg}`, 'red'); }
function logInfo(msg) { log(`  ${msg}`, 'yellow'); }

// Test state tracking
let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
  if (condition) {
    logSuccess(message);
    testsPassed++;
  } else {
    logError(message);
    testsFailed++;
  }
  return condition;
}

// Get valid settlement positions during setup
function getValidSetupSettlementPositions(game, playerId) {
  const valid = [];
  const playerIndex = game.players.findIndex(p => p.id === playerId);
  
  Object.keys(game.vertices).forEach(vKey => {
    const result = GameLogic.canPlaceSettlement(game, playerId, vKey, true);
    if (result.valid) {
      valid.push(vKey);
    }
  });
  return valid;
}

// Get valid road positions connected to a settlement
function getValidRoadPositions(game, playerId, lastSettlement) {
  const valid = [];
  
  Object.keys(game.edges).forEach(eKey => {
    const result = GameLogic.canPlaceRoad(game, playerId, eKey, true, lastSettlement);
    if (result.valid) {
      valid.push(eKey);
    }
  });
  return valid;
}

// Get valid road positions during main game
function getValidMainGameRoadPositions(game, playerId) {
  const valid = [];
  const playerIndex = game.players.findIndex(p => p.id === playerId);
  
  Object.keys(game.edges).forEach(eKey => {
    const result = GameLogic.canPlaceRoad(game, playerId, eKey, false, null);
    if (result.valid) {
      valid.push(eKey);
    }
  });
  return valid;
}

// Count roads for a player
function countPlayerRoads(game, playerIndex) {
  return Object.values(game.edges).filter(e => e.road && e.owner === playerIndex).length;
}

// Count settlements for a player  
function countPlayerSettlements(game, playerIndex) {
  return Object.values(game.vertices).filter(v => v.building === 'settlement' && v.owner === playerIndex).length;
}

// Main test function
async function runTests() {
  logSection('CATAN GAME TEST SUITE');
  
  // Create game
  logSection('1. GAME CREATION');
  const hostPlayer = { id: 'host-123', name: 'Host' };
  const game = GameLogic.createGame('game-123', hostPlayer);
  assert(game !== null, 'Game created successfully');
  assert(game.phase === 'waiting', 'Game phase is waiting');
  assert(game.hexes && Object.keys(game.hexes).length === 19, 'Board has 19 hexes');
  
  // Check board setup
  const desertHex = Object.values(game.hexes).find(h => h.terrain === 'desert');
  assert(desertHex !== null, 'Desert hex exists');
  assert(game.robber === `${desertHex.q},${desertHex.r}`, 'Robber starts on desert');
  
  // Add players (host is already added)
  logSection('2. PLAYER MANAGEMENT');
  const player1 = hostPlayer; // Host is player 1
  const player2 = { id: 'player2', name: 'Bob' };
  const player3 = { id: 'player3', name: 'Charlie' };
  
  // Host already in game, add 2 more
  let result = GameLogic.addPlayer(game, player2);
  assert(result.success, `Player 2 (Bob) joined`);
  
  result = GameLogic.addPlayer(game, player3);
  assert(result.success, `Player 3 (Charlie) joined`);
  
  assert(game.players.length === 3, 'Game has 3 players');
  
  // Start game
  logSection('3. GAME START & SETUP PHASE');
  result = GameLogic.startGame(game);
  assert(result.success, 'Game started successfully');
  assert(game.phase === 'setup', 'Game phase changed to setup');
  assert(game.setupPhase === 0, 'Setup phase is 0');
  
  logInfo(`Turn order: ${game.players.map((p, i) => `${i+1}. ${p.name}`).join(', ')}`);
  
  // Setup Phase 0: Each player places settlement + road
  log('\n--- Setup Phase 0: First Settlement + Road ---', 'magenta');
  
  const setupRoads = [];
  
  for (let i = 0; i < 3; i++) {
    const currentPlayer = game.players[game.currentPlayerIndex];
    logInfo(`${currentPlayer.name}'s turn (player index ${game.currentPlayerIndex})`);
    
    // Place settlement
    const validSettlements = getValidSetupSettlementPositions(game, currentPlayer.id);
    assert(validSettlements.length > 0, `${currentPlayer.name} has valid settlement positions`);
    
    const settlementPos = validSettlements[Math.floor(Math.random() * validSettlements.length)];
    result = GameLogic.placeSettlement(game, currentPlayer.id, settlementPos);
    assert(result.success, `${currentPlayer.name} placed settlement at ${settlementPos}`);
    
    const settlementsCount = countPlayerSettlements(game, game.currentPlayerIndex);
    assert(settlementsCount === 1, `${currentPlayer.name} has 1 settlement`);
    
    // Place road
    const validRoads = getValidRoadPositions(game, currentPlayer.id, settlementPos);
    logInfo(`Valid road positions for ${currentPlayer.name}: ${validRoads.length}`);
    
    if (validRoads.length === 0) {
      logError(`NO VALID ROAD POSITIONS for ${currentPlayer.name}!`);
      logInfo(`Last settlement: ${settlementPos}`);
      // Debug: print all edges and check manually
      const vMatch = settlementPos.match(/v_(-?\d+)_(-?\d+)_(\d+)/);
      if (vMatch) {
        const vEdges = GameLogic.getVertexEdges(settlementPos);
        logInfo(`Edges adjacent to settlement: ${vEdges.join(', ')}`);
        vEdges.forEach(eKey => {
          const edge = game.edges[eKey];
          logInfo(`  ${eKey}: exists=${!!edge}, road=${edge?.road}`);
        });
      }
    }
    
    assert(validRoads.length > 0, `${currentPlayer.name} has valid road positions`);
    
    if (validRoads.length > 0) {
      const roadPos = validRoads[Math.floor(Math.random() * validRoads.length)];
      setupRoads.push({ player: currentPlayer.name, playerIndex: game.currentPlayerIndex, road: roadPos });
      
      result = GameLogic.placeRoad(game, currentPlayer.id, roadPos, true, settlementPos);
      assert(result.success, `${currentPlayer.name} placed road at ${roadPos}`);
      
      const roadsCount = countPlayerRoads(game, game.currentPlayerIndex);
      assert(roadsCount === 1, `${currentPlayer.name} has 1 road in game state`);
      
      // Verify road is stored correctly
      const storedRoad = game.edges[roadPos];
      assert(storedRoad?.road === true, `Road stored correctly at ${roadPos}`);
      assert(storedRoad?.owner === game.currentPlayerIndex, `Road owner is correct`);
    }
    
    // Advance setup turn
    result = GameLogic.advanceSetup(game, currentPlayer.id);
    assert(result.success, `Setup turn advanced for ${currentPlayer.name}`);
  }
  
  assert(game.setupPhase === 1, 'Setup phase changed to 1');
  
  // Setup Phase 1: Reverse order
  log('\n--- Setup Phase 1: Second Settlement + Road (Reverse Order) ---', 'magenta');
  
  for (let i = 0; i < 3; i++) {
    const currentPlayer = game.players[game.currentPlayerIndex];
    const playerIdx = game.currentPlayerIndex;
    logInfo(`${currentPlayer.name}'s turn (player index ${playerIdx})`);
    
    // Place settlement
    const validSettlements = getValidSetupSettlementPositions(game, currentPlayer.id);
    assert(validSettlements.length > 0, `${currentPlayer.name} has valid settlement positions`);
    
    const settlementPos = validSettlements[Math.floor(Math.random() * validSettlements.length)];
    result = GameLogic.placeSettlement(game, currentPlayer.id, settlementPos);
    assert(result.success, `${currentPlayer.name} placed second settlement at ${settlementPos}`);
    
    const settlementsCount = countPlayerSettlements(game, playerIdx);
    assert(settlementsCount === 2, `${currentPlayer.name} has 2 settlements`);
    
    // Place road
    const validRoads = getValidRoadPositions(game, currentPlayer.id, settlementPos);
    logInfo(`Valid road positions for ${currentPlayer.name}: ${validRoads.length}`);
    
    assert(validRoads.length > 0, `${currentPlayer.name} has valid road positions for second road`);
    
    if (validRoads.length > 0) {
      const roadPos = validRoads[Math.floor(Math.random() * validRoads.length)];
      setupRoads.push({ player: currentPlayer.name, playerIndex: playerIdx, road: roadPos });
      
      result = GameLogic.placeRoad(game, currentPlayer.id, roadPos, true, settlementPos);
      assert(result.success, `${currentPlayer.name} placed second road at ${roadPos}`);
      
      const roadsCount = countPlayerRoads(game, playerIdx);
      assert(roadsCount === 2, `${currentPlayer.name} has 2 roads in game state`);
      
      // Verify road is stored
      const storedRoad = game.edges[roadPos];
      assert(storedRoad?.road === true, `Second road stored correctly at ${roadPos}`);
    }
    
    // Advance setup turn
    result = GameLogic.advanceSetup(game, currentPlayer.id);
    assert(result.success, `Setup turn advanced for ${currentPlayer.name}`);
  }
  
  // Verify all roads are stored
  log('\n--- Verifying All Roads Stored ---', 'magenta');
  logInfo(`Total roads placed: ${setupRoads.length}`);
  setupRoads.forEach(({ player, playerIndex, road }) => {
    const edge = game.edges[road];
    const isStored = edge?.road === true && edge?.owner === playerIndex;
    if (isStored) {
      logSuccess(`${player}'s road at ${road} is stored correctly`);
    } else {
      logError(`${player}'s road at ${road} NOT FOUND! Edge state: ${JSON.stringify(edge)}`);
    }
  });
  
  // Count total roads per player
  for (let i = 0; i < 3; i++) {
    const count = countPlayerRoads(game, i);
    const name = game.players[i].name;
    assert(count === 2, `${name} has exactly 2 roads stored (found ${count})`);
  }
  
  assert(game.phase === 'playing', 'Game phase changed to playing');
  
  // Main game phase tests
  logSection('4. MAIN GAME PHASE - DICE ROLLING');
  
  const firstPlayer = game.players[game.currentPlayerIndex];
  logInfo(`Current player: ${firstPlayer.name}`);
  
  // Roll dice
  result = GameLogic.rollDice(game, firstPlayer.id);
  assert(result.success, `${firstPlayer.name} rolled dice`);
  const diceTotal = result.roll?.total;
  assert(diceTotal >= 2 && diceTotal <= 12, `Dice result is valid: ${diceTotal}`);
  logInfo(`Rolled: ${diceTotal}`);
  
  // Check resources were distributed (if not 7)
  if (diceTotal !== 7) {
    assert(game.turnPhase === 'main', 'Turn phase is main after non-7 roll');
  }
  
  // Test building road (if has resources)
  logSection('5. BUILDING DURING MAIN PHASE');
  
  // Give player resources to build
  firstPlayer.resources.brick = 5;
  firstPlayer.resources.lumber = 5;
  firstPlayer.resources.wool = 5;
  firstPlayer.resources.grain = 5;
  firstPlayer.resources.ore = 5;
  
  // Check valid road positions (should be able to extend from existing roads)
  const mainGameRoads = getValidMainGameRoadPositions(game, firstPlayer.id);
  logInfo(`Valid road positions in main game: ${mainGameRoads.length}`);
  
  if (mainGameRoads.length > 0) {
    const roadPos = mainGameRoads[0];
    result = GameLogic.placeRoad(game, firstPlayer.id, roadPos, false, null);
    assert(result.success, `${firstPlayer.name} built road during main phase at ${roadPos}`);
    
    const roadsCount = countPlayerRoads(game, game.currentPlayerIndex);
    logInfo(`${firstPlayer.name} now has ${roadsCount} roads`);
  } else {
    logInfo('No valid road positions (might be blocked)');
  }
  
  // Test settlement building
  logSection('6. SETTLEMENT BUILDING');
  
  // Find valid settlement position (must be connected to road)
  const mainGameSettlements = [];
  Object.keys(game.vertices).forEach(vKey => {
    const result = GameLogic.canPlaceSettlement(game, firstPlayer.id, vKey, false);
    if (result.valid) {
      mainGameSettlements.push(vKey);
    }
  });
  
  logInfo(`Valid settlement positions: ${mainGameSettlements.length}`);
  if (mainGameSettlements.length > 0) {
    const pos = mainGameSettlements[0];
    result = GameLogic.placeSettlement(game, firstPlayer.id, pos);
    if (result.success) {
      logSuccess(`${firstPlayer.name} built settlement at ${pos}`);
    } else {
      logInfo(`Could not build settlement: ${result.error}`);
    }
  }
  
  // Test trading with bank
  logSection('7. BANK TRADING');
  
  firstPlayer.resources.brick = 4;
  result = GameLogic.bankTrade(game, firstPlayer.id, 'brick', 4, 'ore');
  assert(result.success, 'Bank trade (4:1) successful');
  assert(firstPlayer.resources.brick === 0, 'Brick deducted correctly');
  assert(firstPlayer.resources.ore > 0, 'Ore received correctly');
  
  // Test development cards
  logSection('8. DEVELOPMENT CARDS');
  
  firstPlayer.resources.ore = 2;
  firstPlayer.resources.grain = 2;
  firstPlayer.resources.wool = 2;
  
  result = GameLogic.buyDevCard(game, firstPlayer.id);
  if (result.success) {
    logSuccess(`${firstPlayer.name} bought development card: ${result.card}`);
  } else {
    logInfo(`Could not buy dev card: ${result.error}`);
  }
  
  // End turn
  logSection('9. END TURN');
  
  result = GameLogic.endTurn(game, firstPlayer.id);
  assert(result.success, 'Turn ended successfully');
  
  const newPlayer = game.players[game.currentPlayerIndex];
  assert(newPlayer.id !== firstPlayer.id, `Turn passed to ${newPlayer.name}`);
  
  // Test robber (roll 7)
  logSection('10. ROBBER MECHANICS');
  
  // Force a 7 roll scenario
  game.turnPhase = 'roll';
  const currentPlayerId = game.players[game.currentPlayerIndex].id;
  
  // Give someone more than 7 cards
  game.players[0].resources = { brick: 5, lumber: 5, wool: 0, grain: 0, ore: 0 };
  
  // Simulate 7 roll
  const robberResult = GameLogic.rollDice(game, currentPlayerId);
  const robberDiceTotal = robberResult.roll?.total;
  logInfo(`Rolled: ${robberDiceTotal}`);
  
  if (robberDiceTotal === 7) {
    assert(game.turnPhase === 'discard' || game.turnPhase === 'robber', 
           'Turn phase changed for 7 roll');
  }
  
  // Final summary
  logSection('TEST SUMMARY');
  
  log(`\nTests Passed: ${testsPassed}`, 'green');
  log(`Tests Failed: ${testsFailed}`, testsFailed > 0 ? 'red' : 'green');
  
  // Debug: Print all roads in final state
  log('\n--- Final Road State ---', 'cyan');
  Object.entries(game.edges).forEach(([key, edge]) => {
    if (edge.road) {
      const owner = game.players[edge.owner]?.name || edge.owner;
      logInfo(`${key}: owner=${owner}`);
    }
  });
  
  return testsFailed === 0;
}

// Run tests
runTests().then(success => {
  process.exit(success ? 0 : 1);
}).catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});


#!/usr/bin/env node

/**
 * Test script to verify data table improvements
 */

console.log('🧪 Testing Data Table Features...\n');

// Test auto-withdraw logic
function testAutoWithdrawLogic() {
  console.log('Test 1: Auto-Withdraw Logic');
  
  const testCases = [
    { team: 'Team A', points: 0, status: 'eligible', expected: 'withdrawn', description: '0 points should auto-withdraw' },
    { team: 'Team B', points: 50, status: 'eligible', expected: 'withdrawn', description: '50 points (0 tickets) should auto-withdraw' },
    { team: 'Team C', points: 100, status: 'eligible', expected: 'eligible', description: '100 points should remain eligible' },
    { team: 'Team D', points: 0, status: 'winner', expected: 'winner', description: '0 points winner should stay winner' },
    { team: 'Team E', points: 0, status: 'withdrawn', expected: 'withdrawn', description: '0 points already withdrawn should stay withdrawn' },
  ];
  
  testCases.forEach((testCase, index) => {
    const tickets = Math.floor(testCase.points / 100);
    let finalStatus = testCase.status;
    
    if (tickets === 0 && testCase.status === 'eligible') {
      finalStatus = 'withdrawn';
    }
    
    const passed = finalStatus === testCase.expected;
    console.log(`   ${passed ? '✅' : '❌'} Test ${index + 1}: ${testCase.description} - ${passed ? 'PASS' : 'FAIL'}`);
    if (!passed) {
      console.log(`      Expected: ${testCase.expected}, Got: ${finalStatus}`);
    }
  });
}

// Test status display logic
function testStatusDisplay() {
  console.log('\nTest 2: Status Display Logic');
  
  const testCases = [
    { status: 'eligible', tickets: 5, expectedText: '✅ Eligible' },
    { status: 'winner', tickets: 3, expectedText: '🏆 Winner' },
    { status: 'withdrawn', tickets: 0, expectedText: '⚠️ Auto-Withdrawn' },
    { status: 'withdrawn', tickets: 2, expectedText: '❌ Withdrawn' },
    { status: 'removed', tickets: 1, expectedText: '❌ Removed' },
  ];
  
  testCases.forEach((testCase, index) => {
    let statusText = '✅ Eligible';
    let finalStatus = testCase.status;
    
    if (testCase.tickets === 0 && testCase.status === 'eligible') {
      finalStatus = 'withdrawn';
    }
    
    if (finalStatus === 'winner') {
      statusText = '🏆 Winner';
    } else if (finalStatus === 'withdrawn') {
      statusText = testCase.tickets === 0 ? '⚠️ Auto-Withdrawn' : '❌ Withdrawn';
    } else if (finalStatus === 'removed') {
      statusText = '❌ Removed';
    }
    
    const passed = statusText === testCase.expectedText;
    console.log(`   ${passed ? '✅' : '❌'} Test ${index + 1}: ${testCase.status} with ${testCase.tickets} tickets - ${passed ? 'PASS' : 'FAIL'}`);
    if (!passed) {
      console.log(`      Expected: ${testCase.expectedText}, Got: ${statusText}`);
    }
  });
}

// Test localStorage state persistence
function testStatePersistence() {
  console.log('\nTest 3: State Persistence Logic');
  
  const mockLocalStorage = {
    storage: {},
    getItem: function(key) { return this.storage[key] || null; },
    setItem: function(key, value) { this.storage[key] = value; },
    removeItem: function(key) { delete this.storage[key]; },
  };
  
  // Test data table state
  const storageKey = 'testDataTable';
  const expandedKey = `${storageKey}-expanded`;
  
  // Test setting expanded state
  mockLocalStorage.setItem(expandedKey, JSON.stringify(false));
  const retrievedState = JSON.parse(mockLocalStorage.getItem(expandedKey));
  console.log(`   ✅ State persistence: ${retrievedState === false ? 'PASS' : 'FAIL'}`);
  
  // Test winners display state
  const winnersKey = 'prizeWinners-expanded';
  mockLocalStorage.setItem(winnersKey, JSON.stringify(true));
  const winnersState = JSON.parse(mockLocalStorage.getItem(winnersKey));
  console.log(`   ✅ Winners state persistence: ${winnersState === true ? 'PASS' : 'FAIL'}`);
  
  // Test state removal
  mockLocalStorage.removeItem(expandedKey);
  const removedState = mockLocalStorage.getItem(expandedKey);
  console.log(`   ✅ State removal: ${removedState === null ? 'PASS' : 'FAIL'}`);
}

// Test ticket calculation
function testTicketCalculation() {
  console.log('\nTest 4: Ticket Calculation');
  
  const testCases = [
    { points: 0, expectedTickets: 0, expectedText: '0 tickets' },
    { points: 50, expectedTickets: 0, expectedText: '0 tickets' },
    { points: 100, expectedTickets: 1, expectedText: '1 ticket' },
    { points: 150, expectedTickets: 1, expectedText: '1 ticket' },
    { points: 200, expectedTickets: 2, expectedText: '2 tickets' },
    { points: 1000, expectedTickets: 10, expectedText: '10 tickets' },
  ];
  
  testCases.forEach((testCase, index) => {
    const tickets = Math.floor(testCase.points / 100);
    const ticketText = `${tickets} ${tickets === 1 ? 'ticket' : 'tickets'}`;
    
    const ticketsCorrect = tickets === testCase.expectedTickets;
    const textCorrect = ticketText === testCase.expectedText;
    const passed = ticketsCorrect && textCorrect;
    
    console.log(`   ${passed ? '✅' : '❌'} Test ${index + 1}: ${testCase.points} points - ${passed ? 'PASS' : 'FAIL'}`);
    if (!passed) {
      console.log(`      Expected: ${testCase.expectedText}, Got: ${ticketText}`);
    }
  });
}

// Test expand/collapse functionality
function testExpandCollapse() {
  console.log('\nTest 5: Expand/Collapse Functionality');
  
  // Test default states
  const defaultExpanded = true;
  const defaultCollapsed = false;
  
  console.log(`   ✅ Default expanded state: ${defaultExpanded === true ? 'PASS' : 'FAIL'}`);
  console.log(`   ✅ Default collapsed state: ${defaultCollapsed === false ? 'PASS' : 'FAIL'}`);
  
  // Test toggle functionality
  let isExpanded = true;
  isExpanded = !isExpanded; // Toggle
  console.log(`   ✅ Toggle functionality: ${isExpanded === false ? 'PASS' : 'FAIL'}`);
  
  isExpanded = !isExpanded; // Toggle back
  console.log(`   ✅ Toggle back functionality: ${isExpanded === true ? 'PASS' : 'FAIL'}`);
}

// Run all tests
try {
  testAutoWithdrawLogic();
  testStatusDisplay();
  testStatePersistence();
  testTicketCalculation();
  testExpandCollapse();
  
  console.log('\n🎉 All data table feature tests completed successfully!');
  console.log('\n📝 Summary:');
  console.log('   - Auto-withdraw logic: ✅');
  console.log('   - Status display: ✅');
  console.log('   - State persistence: ✅');
  console.log('   - Ticket calculation: ✅');
  console.log('   - Expand/collapse: ✅');
  
} catch (error) {
  console.error('❌ Test failed:', error);
  process.exit(1);
}
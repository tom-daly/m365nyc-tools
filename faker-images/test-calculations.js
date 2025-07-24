import { faker } from '@faker-js/faker';

/**
 * Test and verify the point calculation logic
 */
function testPointCalculation(totalPoints) {
    let remainingPoints = totalPoints;
    let submissions = 0;
    const submissionHistory = [];
    
    console.log(`\n🧮 Testing point calculation for ${totalPoints} points:`);
    console.log('='.repeat(50));
    
    while (remainingPoints > 0) {
        const minDeduction = Math.min(100, remainingPoints);
        const maxDeduction = Math.min(400, remainingPoints);
        
        const deduction = faker.number.int({ min: minDeduction, max: maxDeduction });
        
        submissionHistory.push({
            submission: submissions + 1,
            pointsBefore: remainingPoints,
            deduction: deduction,
            pointsAfter: remainingPoints - deduction
        });
        
        remainingPoints -= deduction;
        submissions++;
        
        // Safety check
        if (submissions > 1000) {
            console.warn('⚠️ Safety limit reached');
            break;
        }
    }
    
    // Display the calculation breakdown
    submissionHistory.forEach(entry => {
        console.log(`Submission ${entry.submission}: ${entry.pointsBefore} - ${entry.deduction} = ${entry.pointsAfter}`);
    });
    
    console.log(`\n📊 Total Submissions: ${submissions}`);
    console.log(`✅ All points used: ${totalPoints - remainingPoints === totalPoints}`);
    
    return { submissions, submissionHistory };
}

// Test various point values
console.log('🧪 Point Calculation Logic Test');
console.log('===============================');

const testCases = [700, 1500, 3000, 5000, 10000];

testCases.forEach(points => {
    testPointCalculation(points);
});

console.log('\n✅ All tests completed!');

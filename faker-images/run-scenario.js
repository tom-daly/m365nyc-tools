import { generateTestData, CONFIG } from './generate-test-data.js';

// Customize the configuration for different test scenarios
const TEST_SCENARIOS = {
    small: {
        numberOfUsers: 10,
        description: 'Small test dataset'
    },
    medium: {
        numberOfUsers: 50,
        description: 'Medium test dataset'
    },
    large: {
        numberOfUsers: 100,
        description: 'Large test dataset'
    },
    xlarge: {
        numberOfUsers: 200,
        description: 'Extra large test dataset (200 users)'
    },
    custom: {
        numberOfUsers: 25,
        pointsRange: { min: 1000, max: 5000 },
        submissionPointsRange: { min: 200, max: 500 },
        description: 'Custom scenario with higher points'
    }
};

/**
 * Run test data generation with a specific scenario
 */
async function runScenario(scenarioName = 'medium') {
    const scenario = TEST_SCENARIOS[scenarioName];
    
    if (!scenario) {
        console.error(`❌ Unknown scenario: ${scenarioName}`);
        console.log('Available scenarios:', Object.keys(TEST_SCENARIOS).join(', '));
        return;
    }
    
    console.log(`🎬 Running scenario: ${scenarioName}`);
    console.log(`📝 Description: ${scenario.description}`);
    
    // Apply scenario configuration
    Object.assign(CONFIG, scenario);
    
    // Generate the test data
    return await generateTestData();
}

// Handle command line arguments
const scenario = process.argv[2] || 'medium';
runScenario(scenario).catch(error => {
    console.error('❌ Error running scenario:', error);
    process.exit(1);
});

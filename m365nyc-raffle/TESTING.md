# Raffle System Testing & Simulation Guide

This document provides comprehensive information about testing and simulating the raffle system to ensure fairness, performance, and reliability.

## 🧪 Testing Overview

The raffle system includes multiple levels of testing to validate different aspects:

1. **Unit Tests** - Core functionality testing
2. **Simulation Tests** - Multi-run statistical analysis  
3. **Advanced Tests** - Edge cases and stress testing
4. **Performance Tests** - Scalability and timing validation

## 🚀 Quick Start

### Basic Validation
```bash
npm run validate
```
Runs a quick validation to ensure all systems are working correctly.

### Run All Tests
```bash
npm test
```
Executes the complete Jest test suite.

### Quick Simulation
```bash
npm run simulate:quick
```
Runs a fast simulation with 20-50 teams across different distributions.

## 📊 Simulation Commands

| Command | Description | Teams | Runs | Time |
|---------|-------------|-------|------|------|
| `npm run simulate:quick` | Quick validation | 20, 50 | 100 | ~10s |
| `npm run simulate:standard` | Standard analysis | 50, 100, 200 | 500 | ~30s |
| `npm run simulate:comprehensive` | Full analysis | 100, 200, 500, 1000 | 1000 | ~5min |
| `npm run simulate:performance` | Performance testing | 1000, 2000 | 100 | ~2min |

## 🎯 Test Categories

### 1. Unit Tests (`npm test`)
- Core raffle logic validation
- Winner selection algorithms  
- Round progression logic
- Configuration management
- Data handling and validation

### 2. Simulation Tests (`npm run test:simulation`)
- Multi-run fairness analysis
- Statistical distribution validation
- Performance benchmarking
- Weighted selection verification

### 3. Advanced Tests (`npm run test:advanced`)
- Edge case handling
- Stress testing with large datasets
- Error condition validation
- Real-world scenario testing

## 📈 Simulation Analysis

Each simulation provides detailed metrics:

### Fairness Metrics
- **Fairness Score**: Lower is better (0.0 = perfect fairness)
- **Win Rate vs Expected Rate**: Actual wins compared to ticket-based probability
- **Fairness Ratio**: Individual team fairness (closer to 1.0 is better)

### Performance Metrics
- **Execution Time**: Total time for all simulations
- **Throughput**: Simulations per second
- **Memory Usage**: Peak memory consumption
- **Scalability**: Performance vs team count

### Statistical Analysis
- **Win Distribution**: How wins are spread across teams
- **Round Completion**: Average rounds completed per simulation
- **Edge Cases**: Frequency of unusual outcomes

## 🔍 Understanding Results

### Good Fairness Indicators
- Fairness score < 0.1
- Most teams have fairness ratio between 0.5-2.0
- Win rates correlate with ticket counts
- Consistent results across multiple runs

### Performance Benchmarks
- < 10ms per simulation (1000 teams)
- Linear scaling with team count
- < 1GB memory usage for large simulations
- Stable performance across multiple runs

### Warning Signs
- Fairness score > 0.5
- Many teams with fairness ratio < 0.1 or > 10
- Inconsistent results between runs
- Performance degradation with scale

## 🛠️ Troubleshooting

### Common Issues

**Tests failing to run:**
```bash
npm install --legacy-peer-deps
npm install --save-dev jest jest-environment-jsdom ts-node
```

**Performance issues:**
- Reduce simulation runs for testing
- Use QUICK_TEST scenario first
- Check system resources

**Inconsistent results:**
- Increase number of simulation runs
- Verify random seed behavior
- Check for data corruption

### Debug Mode
Add debug logging by setting environment variable:
```bash
DEBUG=true npm run simulate:standard
```

## 📋 Test Data Scenarios

### Default Team Distributions

1. **Normal Distribution** (Bell Curve)
   - Mean: 1000 points
   - Standard deviation: 400 points
   - Most realistic for events

2. **Skewed Distribution**
   - 70% low points (0-500)
   - 20% medium points (500-1000)  
   - 10% high points (1000+)
   - Simulates real-world participation

3. **Uniform Distribution**
   - Even spread across point ranges
   - Good for testing edge cases

### Custom Test Data
Create custom scenarios by modifying:
- `scripts/comprehensiveSimulation.ts`
- `__tests__/testUtils.ts`
- Team count, point distributions, round configurations

## 🎯 Interpreting Fairness

### Fairness Score Interpretation
- **0.00-0.05**: Excellent fairness
- **0.05-0.15**: Good fairness  
- **0.15-0.30**: Acceptable fairness
- **0.30+**: Poor fairness, needs investigation

### Expected Behavior
With proper weighting:
- Teams with more tickets should win more often
- But not exclusively (randomness factor)
- Lower-ticket teams should still have chances
- Results should be consistent across runs

## 🔄 Continuous Testing

### Pre-Event Validation
Before running a live raffle:
1. `npm run validate` - Quick system check
2. `npm run simulate:standard` - Fairness validation
3. Review fairness scores and distributions
4. Test with actual participant data if available

### Post-Event Analysis
After a live raffle:
1. Export actual results
2. Compare against simulation predictions
3. Validate fairness metrics
4. Document any anomalies

## 📝 Creating Custom Tests

### Adding New Test Cases
1. Create test file in `__tests__/` directory
2. Follow naming convention: `*.test.ts`
3. Use existing test utilities from `testUtils.ts`
4. Include both positive and negative test cases

### Example Custom Test
```typescript
import { selectWeightedWinner } from '../scripts/comprehensiveSimulation';

test('custom scenario test', () => {
  const teams = [
    { Team: 'Test Team', Points: 1000, /* ... */ },
  ];
  
  const winner = selectWeightedWinner(teams);
  expect(winner).toBeDefined();
});
```

## 🚨 Known Limitations

1. **Randomness**: Results will vary between runs (expected)
2. **Performance**: Large simulations (10k+ teams) may be slow
3. **Memory**: Very large datasets may hit memory limits
4. **Statistical**: Small sample sizes may show unfair results

## 🎉 Best Practices

1. **Always validate** before live events
2. **Run multiple scenarios** to test different distributions
3. **Monitor performance** as data scales
4. **Document anomalies** for future reference
5. **Test edge cases** like zero points, single teams
6. **Verify randomness** with statistical tests

## 📞 Support

For issues or questions:
1. Check this documentation
2. Review existing test cases
3. Run validation scripts
4. Check console output for errors
5. Verify test data integrity

---

*This testing system ensures the raffle operates fairly and performs well under various conditions. Regular testing helps maintain confidence in the system's integrity.*

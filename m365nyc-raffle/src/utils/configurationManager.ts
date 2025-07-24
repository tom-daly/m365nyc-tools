import { TeamData, RaffleRound } from '@/types/raffle';
import { RaffleModelType } from '@/types/raffleModels';

export interface RoundConfigurationSettings {
  numberOfRounds: number;
  showOdds?: boolean;
  raffleModel?: RaffleModelType;
  winnersPerRound?: number;
  animationType?: 'wheel' | 'squidgame';
}

export interface RaffleConfiguration {
  id: string;
  name: string;
  teams: TeamData[];
  roundSettings: RoundConfigurationSettings;
  rounds: RaffleRound[];
  createdAt: Date;
  lastModified: Date;
}

const STORAGE_KEY = 'raffle-configurations';

export class ConfigurationManager {
  static saveConfiguration(config: RaffleConfiguration): void {
    console.log('🔧 ConfigurationManager.saveConfiguration called with:', {
      id: config.id,
      name: config.name,
      teamsLength: config.teams.length,
      roundsLength: config.rounds.length,
      roundSettings: config.roundSettings
    });
    
    try {
      const configs = this.getAllConfigurations();
      console.log('🔧 Found existing configurations:', configs.length);
      
      const existingIndex = configs.findIndex(c => c.id === config.id);
      
      if (existingIndex >= 0) {
        console.log(`🔧 Updating existing configuration at index ${existingIndex}`);
        configs[existingIndex] = { ...config, lastModified: new Date() };
      } else {
        console.log('🔧 Adding new configuration');
        configs.push(config);
      }
      
      const configsToSave = JSON.stringify(configs);
      console.log('🔧 About to save configs to localStorage, size:', configsToSave.length);
      
      localStorage.setItem(STORAGE_KEY, configsToSave);
      
      // Verify the save worked
      const verification = localStorage.getItem(STORAGE_KEY);
      if (verification) {
        const parsedVerification = JSON.parse(verification);
        console.log('✅ Configuration saved successfully. Total configs in storage:', parsedVerification.length);
        console.log('✅ Saved config ID:', config.id);
      } else {
        console.error('❌ Save verification failed - localStorage.getItem returned null');
      }
    } catch (error) {
      console.error('❌ Failed to save configuration:', error);
      throw error;
    }
  }

  static getAllConfigurations(): RaffleConfiguration[] {
    console.log('🔧 ConfigurationManager.getAllConfigurations called');
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      console.log('🔧 Raw localStorage data:', stored ? `${stored.length} characters` : 'null');
      
      if (!stored) {
        console.log('🔧 No configurations found in localStorage');
        return [];
      }
      
      const configs = JSON.parse(stored) as RaffleConfiguration[];
      console.log('🔧 Parsed configurations:', configs.length);
      
      const processedConfigs = configs.map((config, index) => {
        console.log(`🔧 Processing config ${index + 1}:`, {
          id: config.id,
          name: config.name,
          teamsLength: config.teams?.length || 0,
          hasRoundSettings: !!config.roundSettings,
          roundsLength: config.rounds?.length || 0
        });
        
        // Backward compatibility: add default round settings if missing
        const updatedConfig = {
          ...config,
          createdAt: new Date(config.createdAt),
          lastModified: new Date(config.lastModified),
          roundSettings: config.roundSettings || {
            numberOfRounds: 5,
            raffleModel: RaffleModelType.WEIGHTED_CONTINUOUS,
            winnersPerRound: 1,
            showOdds: false,
            animationType: 'squidgame'
          }
        };
        
        // Generate rounds if missing
        if (!config.rounds || config.rounds.length === 0) {
          console.log(`🔧 Generating rounds for config ${config.id}`);
          updatedConfig.rounds = this.generateOptimalRounds(config.teams, updatedConfig.roundSettings);
        } else {
          updatedConfig.rounds = config.rounds;
        }
        
        return updatedConfig;
      });
      
      console.log('✅ Successfully processed all configurations');
      return processedConfigs;
    } catch (error) {
      console.error('❌ Error loading configurations:', error);
      return [];
    }
  }

  static getConfiguration(id: string): RaffleConfiguration | null {
    console.log('🔧 ConfigurationManager.getConfiguration called with ID:', id);
    
    const configs = this.getAllConfigurations();
    const found = configs.find(c => c.id === id);
    
    if (found) {
      console.log('✅ Configuration found:', {
        id: found.id,
        name: found.name,
        teamsLength: found.teams.length,
        roundsLength: found.rounds.length
      });
    } else {
      console.log('❌ Configuration not found. Available IDs:', configs.map(c => c.id));
    }
    
    return found || null;
  }

  static deleteConfiguration(id: string): void {
    const configs = this.getAllConfigurations();
    const filtered = configs.filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  }

  static generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  static createConfiguration(name: string, teams: TeamData[], roundSettings?: RoundConfigurationSettings): RaffleConfiguration {
    const settings = roundSettings || {
      numberOfRounds: 5,
      raffleModel: RaffleModelType.WEIGHTED_CONTINUOUS,
      winnersPerRound: 1,
      showOdds: false,
      animationType: 'squidgame'
    };
    
    const rounds = this.generateOptimalRounds(teams, settings);
    
    return {
      id: this.generateId(),
      name,
      teams,
      roundSettings: settings,
      rounds,
      createdAt: new Date(),
      lastModified: new Date()
    };
  }

  static generateOptimalRounds(teams: TeamData[], settings: RoundConfigurationSettings): RaffleRound[] {
    if (teams.length === 0) {
      return this.getDefaultRounds(settings.numberOfRounds, settings.raffleModel);
    }

    const raffleModel = settings.raffleModel || RaffleModelType.UNIFORM_ELIMINATION;
    
    if (raffleModel === RaffleModelType.WEIGHTED_CONTINUOUS) {
      // For weighted continuous: all players stay active, no elimination
      return this.createWeightedContinuousRounds(settings.numberOfRounds);
    } else {
      // For uniform elimination: players are eliminated progressively
      const points = teams.map(team => team.Points).sort((a, b) => a - b);
      return this.createSimpleDivisionRounds(points, settings.numberOfRounds);
    }
  }

  private static getDefaultRounds(numberOfRounds: number, raffleModel?: RaffleModelType): RaffleRound[] {
    const rounds: RaffleRound[] = [];
    const baseThreshold = 1000 / numberOfRounds;
    
    if (raffleModel === RaffleModelType.WEIGHTED_CONTINUOUS) {
      return this.createWeightedContinuousRounds(numberOfRounds);
    }
    
    for (let i = 0; i < numberOfRounds; i++) {
      rounds.push({
        id: i + 1,
        name: i === numberOfRounds - 1 ? "Final Round" : `Round ${i + 1}`,
        pointThreshold: Math.round(i * baseThreshold),
        description: i === 0 ? "All players eligible" : `Players with ${Math.round(i * baseThreshold)}+ points`
      });
    }
    
    return rounds;
  }

  private static createWeightedContinuousRounds(numberOfRounds: number): RaffleRound[] {
    const rounds: RaffleRound[] = [];
    
    for (let i = 0; i < numberOfRounds; i++) {
      rounds.push({
        id: i + 1,
        name: i === numberOfRounds - 1 ? "Final Round" : `Round ${i + 1}`,
        pointThreshold: 0, // All players always eligible
        description: "All players remain eligible (weighted by tickets)"
      });
    }
    
    return rounds;
  }

  private static createSimpleDivisionRounds(sortedPoints: number[], numberOfRounds: number): RaffleRound[] {
    const rounds: RaffleRound[] = [];
    const totalPlayers = sortedPoints.length;
    const playersPerRound = Math.ceil(totalPlayers / numberOfRounds);
    
    for (let i = 0; i < numberOfRounds; i++) {
      // Calculate the index for this round's threshold
      const playerIndex = i * playersPerRound;
      const threshold = playerIndex < sortedPoints.length ? sortedPoints[playerIndex] : sortedPoints[sortedPoints.length - 1];
      
      rounds.push({
        id: i + 1,
        name: i === numberOfRounds - 1 ? "Final Round" : `Round ${i + 1}`,
        pointThreshold: i === 0 ? 0 : Math.max(0, threshold),
        description: i === 0 ? "All players eligible" : `Players with ${threshold}+ points (${this.getExpectedPlayerCount(sortedPoints, threshold)} eligible)`
      });
    }
    
    return rounds;
  }

  private static getExpectedPlayerCount(sortedPoints: number[], threshold: number): number {
    return sortedPoints.filter(points => points >= threshold).length;
  }
}

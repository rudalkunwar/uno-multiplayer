import { GameState } from '../types/game';

export class GameStateManager {
  private readonly state: GameState;

  constructor(initialState: GameState) {
    this.state = this.validateState(initialState);
  }

  /**
   * Get current game state
   * @returns Readonly<GameState>
   */
  public getState(): Readonly<GameState> {
    return Object.freeze({ ...this.state });
  }

  /**
   * Validate state structure and rules
   * @param state - State to validate
   * @returns GameState
   * @throws Error if state is invalid
   */
  private validateState(state: GameState): GameState {
    // Validate required fields
    if (!state.id || !state.roomCode) {
      throw new Error('Missing required state fields');
    }

    // Validate players
    if (!Array.isArray(state.players)) {
      throw new Error('Players must be an array');
    }

    // Validate only one current turn
    const currentTurnPlayers = state.players.filter(p => p.isCurrentTurn);
    if (state.gameStatus === 'playing' && currentTurnPlayers.length !== 1) {
      throw new Error('Exactly one player must have current turn');
    }

    // Validate at least one host
    if (state.players.length > 0 && !state.players.some(p => p.isHost)) {
      throw new Error('Game must have a host');
    }

    return state;
  }
}
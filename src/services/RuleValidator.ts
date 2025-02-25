import { GameState, Card, CardColor, GameSettings } from '../types/game';

export class GameRuleValidator {
  /**
   * Validate a card can be played
   * @param card - Card to play
   * @param topCard - Current top card
   * @param currentColor - Current color
   * @param settings - Game settings
   * @returns boolean
   */
  public canPlayCard(
    card: Card,
    topCard: Card,
    currentColor: CardColor,
    settings: GameSettings
  ): boolean {
    // Wild cards can always be played unless no-bluffing rule applies
    if (card.type === 'wild' || card.type === 'wild4') {
      return true;
    }

    // Match color
    if (card.color === currentColor) {
      return true;
    }

    // Match number or type
    if (card.type === 'number' && topCard.type === 'number') {
      return card.value === topCard.value;
    }

    return card.type === topCard.type;
  }

  /**
   * Validate game can start
   * @param state - Current game state
   * @returns boolean
   */
  public canStartGame(state: GameState): boolean {
    // Check minimum players
    if (state.players.length < state.settings.minPlayers) {
      return false;
    }

    // Check all players are ready
    const readyPlayers = state.players.filter(p => p.isReady);
    return readyPlayers.length >= state.settings.minPlayers;
  }
}
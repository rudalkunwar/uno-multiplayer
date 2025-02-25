import { GameSettings } from '@/types/game';

/**
 * @description Socket utility functions
 * @created 2025-02-25 07:13:11
 * @author rudalkunwar
 */

export class SocketUtils {
  /**
   * Validates game settings
   * @param settings - Game settings to validate
   * @returns Error message or null if valid
   */
  static validateGameSettings(settings: GameSettings): string | null {
    if (!settings.roomName?.trim()) {
      return 'Room name is required';
    }

    if (!settings.maxPlayers || settings.maxPlayers < 2 || settings.maxPlayers > 10) {
      return 'Players must be between 2 and 10';
    }

    if (!settings.timePerTurn || settings.timePerTurn < 15 || settings.timePerTurn > 60) {
      return 'Turn time must be between 15 and 60 seconds';
    }

    return null;
  }

  /**
   * Generates a unique callback ID
   */
  static generateCallbackId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Formats error messages consistently
   */
  static formatError(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    return 'An unknown error occurred';
  }
}
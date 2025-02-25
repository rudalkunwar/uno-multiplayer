import { GameEvent } from '../types/game';

export class GameEventEmitter {
  private readonly events: GameEvent[] = [];
  private readonly listeners: Map<string, ((event: GameEvent) => void)[]> = new Map();

  /**
   * Emit a game event
   * @param event - Event to emit
   */
  public emit(event: GameEvent): void {
    this.events.push(event);
    
    // Notify listeners
    const eventListeners = this.listeners.get(event.type) || [];
    eventListeners.forEach(listener => listener(event));
  }

  /**
   * Add event listener
   * @param type - Event type to listen for
   * @param listener - Callback function
   */
  public on(type: string, listener: (event: GameEvent) => void): void {
    const eventListeners = this.listeners.get(type) || [];
    this.listeners.set(type, [...eventListeners, listener]);
  }

  /**
   * Get recent events
   * @param limit - Maximum number of events to return
   * @returns GameEvent[]
   */
  public getRecentEvents(limit: number = 20): GameEvent[] {
    return [...this.events].slice(-limit);
  }
}
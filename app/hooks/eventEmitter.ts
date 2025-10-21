/**
 * EventEmitter
 *
 * A generic event emitter class that provides type-safe event handling capabilities.
 * It allows registering, unregistering, and emitting events with strongly typed payloads.
 */
export class EventEmitter<T extends string, P extends Record<T, unknown>> {
  /**
   * Map of event names to sets of callback functions.
   */
  private listeners: { [K in T]?: Set<(payload: P[K]) => void> } = {}

  /**
   * Register an event listener for a specific event type.
   *
   * @param event The event name to listen for.
   * @param cb The callback function to execute when the event is emitted.
   */
  on<K extends T>(event: K, cb: (payload: P[K]) => void) {
    if (!this.listeners[event]) {
      this.listeners[event] = new Set()
    }
    this.listeners[event]!.add(cb)
  }

  /**
   * Remove an event listener for a specific event type.
   *
   * @param event The event name to stop listening for.
   * @param cb The callback function to remove from the listeners.
   */
  off<K extends T>(event: K, cb: (payload: P[K]) => void) {
    this.listeners[event]?.delete(cb)
  }

  /**
   * Emit an event with the specified payload to all registered listeners.
   *
   * @param event The event name to emit.
   * @param payload The data to pass to all registered listeners.
   */
  emit<K extends T>(event: K, payload: P[K]) {
    this.listeners[event]?.forEach(cb => cb(payload))
  }
}

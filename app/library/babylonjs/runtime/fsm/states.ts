/**
 * Enumeration of all possible states in the finite state machine.
 *
 * These states represent the various phases of operation in the 3DAC system,
 * from initialization through character spawning, algorithm communication,
 * animation streaming, and system shutdown.
 */
export enum States {
  INIT = -1,
  WAITING_FOR_FRONTEND_READY = 0,
  WAITING_FOR_ALGORITHM_READY_ON_START = 1,
  ALGORITHM_NOT_READY_ON_START = 2,
  CHECK_AND_UPDATE_ASSETS = 3,
  WAITING_FOR_ACTOR_ENTER_FINISHED = 4,
  IDLE = 5,
  WAITING_FOR_ALGORITHM_READY = 6,
  ALGORITHM_NOT_READY = 7,
  WAITING_FOR_USER_STOP_RECORDING = 8,
  ALGORITHM_GENERATION_FAILED = 9,
  WAITING_FOR_ACTOR_APOLOGIZE_FINISHED = 10,
  WAITING_FOR_ACTOR_RESPOND_GENERATION_FINISHED = 11,
  WAITING_FOR_ACTOR_DIRECT_GENERATION_FINISHED = 12,
  ACTOR_ANIMATION_STREAMING = 13,
  WAITING_FOR_ACTOR_ANIMATION_FINISHED = 14,
  WAITING_FOR_ACTOR_LEAVING_FINISHED = 15,
  EXIT = 16,
  WAITING_FOR_USER_START_GAME = 17,
  WAITING_FOR_STREAMED_ANIMATION_INTERRUPTED = 18,
  WAITING_FOR_LOCAL_ANIMATION_INTERRUPTED = 19,
  SPAWN_CHARACTER = 20,
  SPAWN_ENVIRONMENT = 21,
}

/**
 * Convert a state enum value to its English name.
 *
 * Args:
 *   state: The state enum value to convert.
 *
 * Returns:
 *   The English name of the state.
 */
export function stateToEnglishName(state: States): string {
  return States[state]
}

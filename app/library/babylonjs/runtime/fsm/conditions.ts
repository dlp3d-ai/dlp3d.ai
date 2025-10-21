import { Logger } from '@/library/babylonjs/utils'

/**
 * Enumeration of all possible conditions that can trigger state transitions in the finite state machine.
 *
 * These conditions represent various events and states that can occur during the system operation,
 * including frontend events, algorithm states, user interactions, and animation events.
 */
export enum Conditions {
  FRONTEND_READY = 0,
  FRONTEND_NOT_READY = 1,
  FRONTEND_EXIT = 2,
  ALGORITHM_READY = 3,
  ALGORITHM_NOT_READY = 4,
  FRONTEND_UPDATE_CONFIG = 5,
  ASSETS_READY = 6,
  ASSETS_NOT_READY = 7,
  USER_START_RECORDING = 8,
  USER_UPLOAD_AUDIO = 9,
  USER_STOP_RECORDING = 10,
  ACTOR_UPLOAD_TEXT = 11,
  ALGORITHM_GENERATION_LEAVING = 12,
  ALGORITHM_GENERATION_STREAM_AVAILABLE = 13,
  ALGORITHM_GENERATION_STREAM_UNAVAILABLE = 14,
  ALGORITHM_GENERATION_STREAM_END = 15,
  ALGORITHM_GENERATION_STREAM_TIMEOUT = 16,
  ANIMATION_FINISHED = 17,
  USER_START_GAME = 18,
  USER_INTERRUPT_ANIMATION = 19,
  JOINT_ANIMATION_FINISHED = 20,
  MORPH_ANIMATION_FINISHED = 21,
  JOINT_STREAM_BROKEN = 22,
  MORPH_STREAM_BROKEN = 23,
}

/**
 * Interface for data that can be attached to a conditioned message.
 */
interface ConditionedMessageData {
  [key: string]: any
}

/**
 * A message containing a condition and optional data for state machine transitions.
 *
 * This class represents a message that can trigger state transitions in the finite state machine.
 * It contains a condition enum value and optional data payload.
 */
export class ConditionedMessage {
  /**
   * The condition that triggers the state transition.
   */
  condition: Conditions
  /**
   * Optional data payload attached to the message.
   */
  data: ConditionedMessageData | null

  /**
   * Create a new conditioned message.
   *
   * @param condition The condition that triggers the state transition.
   * @param data Optional data payload, defaults to null.
   */
  constructor(condition: Conditions, data: ConditionedMessageData | null = null) {
    this.condition = condition
    this.data = data
  }

  /**
   * Convert the conditioned message to a JSON string representation.
   *
   * @returns A JSON string containing the condition, Chinese name, English name, and optional data.
   */
  convertToString(): string {
    const result: any = {
      condition: this.condition,
      condition_name: Conditions[this.condition],
    }

    try {
      if (this.data !== null) {
        result.data = this.data
      }
      return JSON.stringify(result, null, 4)
    } catch (e) {
      Logger.warn(
        'Data cannot be serialized to a JSON string, therefore the data field will be omitted.',
      )
      return JSON.stringify(result, null, 4)
    }
  }
}

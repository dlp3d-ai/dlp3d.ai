import { kyOrchestrator, kyMotionFile } from '@/library/babylonjs/runtime/request/ky'

/**
 * Response interface for relationship data.
 */
export interface RelationshipResponse {
  /** The relationship type between user and character. */
  relationship: string
  /** The relationship score value. */
  score: number
}

/**
 * Response interface for emotion data.
 */
export interface EmotionResponse {
  /** Array of emotion strings. */
  emotions: string[]
}

/**
 * Response interface for chat list data.
 */
export interface ChatListResponse {
  /** Array of character IDs. */
  character_id_list: string[]
  /** Array of character names. */
  character_name_list: string[]
}

/**
 * Get the relationship data for a specific character.
 *
 * @param characterId The ID of the character to get relationship data for.
 * @returns A Promise that resolves to RelationshipResponse object containing relationship type and score.
 */
export async function getRelationship(characterId: string) {
  try {
    const response = await kyOrchestrator.get(`get_relationship/${characterId}`)

    if (!response.ok) {
      return {
        relationship: 'Stranger',
        score: 0,
      }
    }

    const data = await response.json<RelationshipResponse>()
    return data
  } catch {
    return {
      relationship: 'Stranger',
      score: 0,
    }
  }
}

/**
 * Get the emotion data for a specific user and character combination.
 *
 * @param userId The ID of the user.
 * @param characterId The ID of the character.
 * @returns A Promise that resolves to EmotionResponse object containing array of emotions.
 */
export async function getEmotion(userId: string, characterId: string) {
  try {
    const response = await kyOrchestrator.get(`get_emotion/${userId}/${characterId}`)

    if (!response.ok) {
      return {
        emotions: [],
      }
    }

    return response.json<EmotionResponse>()
  } catch {
    return {
      emotions: [],
    }
  }
}

/**
 * Get the chat list for a specific user.
 *
 * @param userId The ID of the user to get chat list for.
 * @returns A Promise that resolves to ChatListResponse object containing character IDs and names.
 */
export async function getChatList(userId: string) {
  const response = await kyMotionFile.get(`list_characters/${userId}`)
  return response.json<ChatListResponse>()
}

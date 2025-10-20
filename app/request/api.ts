import { kyDlpApi } from '@/request/ky'
import { CharacterConfig } from '@/types/character'

// Type definitions for API requests and responses
export interface CharacterResponse {
  character_id_list: string[]
  character_name_list: string[]
}

export interface User {
  user_id: string
  name?: string
  email?: string
  created_at?: string
}

export interface CreateUserRequest {
  name?: string
  email?: string
}

export interface DuplicateCharacterRequest {
  user_id: string
  character_id: string
  new_name?: string
}

export interface UpdateCharacterSceneRequest {
  user_id: string
  character_id: string
  scene_name: string
}

export interface UpdateCharacterPromptRequest {
  user_id: string
  character_id: string
  prompt: string
}

export interface UpdateCharacterAsrRequest {
  user_id: string
  character_id: string
  asr_adapter: string
}

export interface UpdateCharacterTtsRequest {
  user_id: string
  character_id: string
  tts_adapter: string
  voice?: string
  voice_speed?: number
}

export interface UpdateCharacterClassificationRequest {
  user_id: string
  character_id: string
  classification_adapter: string
  classification_model_override?: string
}

export interface UpdateCharacterConversationRequest {
  user_id: string
  character_id: string
  conversation_adapter: string
  conversation_model_override?: string
}

export interface UpdateCharacterReactionRequest {
  user_id: string
  character_id: string
  reaction_adapter: string
  reaction_model_override?: string
}

export interface UpdateCharacterMemoryRequest {
  user_id: string
  character_id: string
  memory_adapter: string
  memory_model_override?: string
}

export interface UpdateUserConfigRequest {
  user_id: string
  [key: string]: string
}

export interface DeleteUserRequest {
  user_id: string
}

export interface DeleteCharacterRequest {
  user_id: string
  character_id: string
}

export interface LLMProvider {
  options: string[]
}

export interface Character {
  character_id: string
  character_name: string
}
export interface VerifyUserRequest {
  username: string
  password: string
}
// GET Endpoints
export interface AuthenticateUserRequest {
  username: string
  password: string
}
/**
 * List Characters
 */
export async function getCharactersList(userId: string) {
  const response = await kyDlpApi.get(`list_characters/${userId}`)
  const data = await response.json<CharacterResponse>()
  const result = data.character_id_list.map((id, index) => ({
    character_id: id,
    character_name: data.character_name_list[index] || '',
  }))
  return result as Character[]
}

/**
 * Get Character Config
 */
export async function getCharacterConfig(userId: string, characterId: string) {
  const response = await kyDlpApi.get(
    `get_character_config/${userId}/${characterId}`,
  )
  return response.json<CharacterConfig>()
}

/**
 * Get Available LLM
 */
export async function getAvailableLlm(userId: string) {
  const response = await kyDlpApi.get(`get_available_llm/${userId}`)
  return response.json<LLMProvider>()
}

/**
 * List Users
 */
export async function listUsers() {
  const response = await kyDlpApi.get('list_users')
  return response.json<User[]>()
}

// POST Endpoints

/**
 * Create User
 */
export async function createUser(userId: string) {
  const response = await kyDlpApi.post('create_user', { json: { user_id: userId } })
  return response.json<{ user_id: string }>()
}
/**
 * Register User
 * @param data
 * @returns
 */
export async function verifyUser(data: VerifyUserRequest) {
  const response = await kyDlpApi.post('register_user', { json: data })
  return response.json<{ user_id: string }>()
}

/**
 * Authenticate User
 * @param data
 * @returns
 */
export async function authenticateUser(data: AuthenticateUserRequest) {
  const response = await kyDlpApi.post('authenticate_user', { json: data })
  return response.json<{ user_id: string }>()
}
/**
 * Duplicate Character
 */
export async function duplicateCharacter(data: DuplicateCharacterRequest) {
  const response = await kyDlpApi.post('duplicate_character', { json: data })
  return response.json<{ character_id: string }>()
}

/**
 * Update Character Scene
 */
export async function updateCharacterScene(data: UpdateCharacterSceneRequest) {
  const response = await kyDlpApi.post('update_character_scene', { json: data })
  return response.json<{ success: boolean }>()
}

/**
 * Update Character Prompt
 */
export async function updateCharacterPrompt(data: UpdateCharacterPromptRequest) {
  const response = await kyDlpApi.post('update_character_prompt', { json: data })
  return response.json<{ success: boolean }>()
}

/**
 * Update Character ASR
 */
export async function updateCharacterAsr(data: UpdateCharacterAsrRequest) {
  const response = await kyDlpApi.post('update_character_asr', { json: data })
  return response.json<{ success: boolean }>()
}

/**
 * Update Character TTS
 */
export async function updateCharacterTts(data: UpdateCharacterTtsRequest) {
  const response = await kyDlpApi.post('update_character_tts', { json: data })
  return response.json<{ success: boolean }>()
}

/**
 * Update User Config
 */
export async function fetchUpdateUserConfig(data: UpdateUserConfigRequest) {
  const response = await kyDlpApi.post('update_user_config', { json: data })
  return response.json<{ success: boolean }>()
}

/**
 * Delete User
 */
export async function deleteUser(data: DeleteUserRequest) {
  const response = await kyDlpApi.post('delete_user', { json: data })
  return response.json<{ success: boolean }>()
}

/**
 * Delete Character
 */
export async function fetchDeleteCharacter(data: DeleteCharacterRequest) {
  const response = await kyDlpApi.post('delete_character', { json: data })
  return response.json<{ success: boolean }>()
}

export async function fetchUpdateName(
  userId: string,
  characterId: string,
  name: string,
) {
  const response = await kyDlpApi.post(`update_character_name`, {
    json: { user_id: userId, character_id: characterId, character_name: name },
  })
  return response.json<{ success: boolean }>()
}

/**
 * Update Character Classification
 */
export async function updateCharacterClassification(
  data: UpdateCharacterClassificationRequest,
) {
  const response = await kyDlpApi.post('update_character_classification', {
    json: data,
  })
  return response.json<{ success: boolean }>()
}

/**
 * Update Character Conversation
 */
export async function updateCharacterConversation(
  data: UpdateCharacterConversationRequest,
) {
  const response = await kyDlpApi.post('update_character_conversation', {
    json: data,
  })
  return response.json<{ success: boolean }>()
}

/**
 * Update Character Reaction
 */
export async function updateCharacterReaction(data: UpdateCharacterReactionRequest) {
  const response = await kyDlpApi.post('update_character_reaction', { json: data })
  return response.json<{ success: boolean }>()
}

/**
 * Update Character Memory
 */
export async function updateCharacterMemory(data: UpdateCharacterMemoryRequest) {
  const response = await kyDlpApi.post('update_character_memory', { json: data })
  return response.json<{ success: boolean }>()
}

export async function fetchGetAvailableTTS(userId: string) {
  const response = await kyDlpApi.get(`get_available_tts/${userId}`)
  return response.json<{ options: string[] }>()
}

export async function fetchGetAvailableASR(userId: string) {
  const response = await kyDlpApi.get(`get_available_asr/${userId}`)
  return response.json<{ options: string[] }>()
}
export async function fetchUpdateAvatar(
  userId: string,
  characterId: string,
  avatar: string,
) {
  const response = await kyDlpApi.post(`update_character_avatar`, {
    json: { user_id: userId, character_id: characterId, avatar: avatar },
  })
  return response.json<{ success: boolean }>()
}

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
  language?: string
}
// GET Endpoints
export interface AuthenticateUserRequest {
  username: string
  password: string
  language?: string
}
/*
  Retrieve the list of characters for a given user.

  @param userId string - The user identifier whose characters will be listed.

  @returns Promise<Character[]> The list of characters with id and name.
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

/*
  Fetch the configuration for a specific character.

  @param userId string - The user identifier.
  @param characterId string - The character identifier.

  @returns Promise<CharacterConfig> The character configuration object.
*/
export async function getCharacterConfig(userId: string, characterId: string) {
  const response = await kyDlpApi.get(
    `get_character_config/${userId}/${characterId}`,
  )
  return response.json<CharacterConfig>()
}

/*
  Get available LLM options for a user.

  @param userId string - The user identifier.

  @returns Promise<LLMProvider> The available LLM provider options.
*/
export async function getAvailableLlm(userId: string) {
  const response = await kyDlpApi.get(`get_available_llm/${userId}`)
  return response.json<LLMProvider>()
}

/*
  List all users.

  @returns Promise<User[]> The collection of users.
*/
export async function listUsers() {
  const response = await kyDlpApi.get('list_users')
  return response.json<User[]>()
}

// POST Endpoints

/*
  Create a user with the specified user id.

  @param userId string - The identifier for the user to create.

  @returns Promise<{ user_id: string }> The created user id.
*/
export async function createUser(userId: string) {
  const response = await kyDlpApi.post('create_user', { json: { user_id: userId } })
  return response.json<{ user_id: string }>()
}
/*
  Register a new user.

  @param data VerifyUserRequest - The registration payload containing username and password.

  @returns Promise<{ user_id: string; confirmation_required: boolean; auth_code: number; auth_msg: string }>
    Registration result including user id and confirmation status.
*/
export async function verifyUser(data: VerifyUserRequest) {
  const response = await kyDlpApi.post('register_user', { json: data })
  return response.json<{
    user_id: string
    confirmation_required: boolean
    auth_code: number
    auth_msg: string
  }>()
}

/*
  Authenticate an existing user.

  @param data AuthenticateUserRequest - The login credentials payload.

  @returns Promise<{ user_id: string; auth_code: number; auth_msg: string }>
    Authentication result including user id and status.
*/
export async function authenticateUser(data: AuthenticateUserRequest) {
  const response = await kyDlpApi.post('authenticate_user', { json: data })
  return response.json<{ user_id: string; auth_code: number; auth_msg: string }>()
}
/*
  Duplicate a character for a user.

  @param data DuplicateCharacterRequest - The payload with user id, original character id, and optional new name.

  @returns Promise<{ character_id: string }> The new character id.
*/
export async function duplicateCharacter(data: DuplicateCharacterRequest) {
  const response = await kyDlpApi.post('duplicate_character', { json: data })
  return response.json<{ character_id: string }>()
}

/*
  Update the active scene for a character.

  @param data UpdateCharacterSceneRequest - The request body with user id, character id, and scene name.

  @returns Promise<{ success: boolean }> Operation status.
*/
export async function updateCharacterScene(data: UpdateCharacterSceneRequest) {
  const response = await kyDlpApi.post('update_character_scene', { json: data })
  return response.json<{ success: boolean }>()
}

/*
  Update the prompt for a character.

  @param data UpdateCharacterPromptRequest - The request body with user id, character id, and prompt.

  @returns Promise<{ success: boolean }> Operation status.
*/
export async function updateCharacterPrompt(data: UpdateCharacterPromptRequest) {
  const response = await kyDlpApi.post('update_character_prompt', { json: data })
  return response.json<{ success: boolean }>()
}

/*
  Update the ASR adapter for a character.

  @param data UpdateCharacterAsrRequest - The request body with user id, character id, and ASR adapter.

  @returns Promise<{ success: boolean }> Operation status.
*/
export async function updateCharacterAsr(data: UpdateCharacterAsrRequest) {
  const response = await kyDlpApi.post('update_character_asr', { json: data })
  return response.json<{ success: boolean }>()
}

/*
  Update the TTS adapter and voice settings for a character.

  @param data UpdateCharacterTtsRequest - Request with user id, character id, tts adapter, and optional voice settings.

  @returns Promise<{ success: boolean }> Operation status.
*/
export async function updateCharacterTts(data: UpdateCharacterTtsRequest) {
  const response = await kyDlpApi.post('update_character_tts', { json: data })
  return response.json<{ success: boolean }>()
}

/*
  Update an arbitrary user configuration key-value set.

  @param data UpdateUserConfigRequest - The user id and config key-value map.

  @returns Promise<{ success: boolean }> Operation status.
*/
export async function fetchUpdateUserConfig(data: UpdateUserConfigRequest) {
  const response = await kyDlpApi.post('update_user_config', { json: data })
  return response.json<{ success: boolean }>()
}

/*
  Delete a character for a user.

  @param data DeleteCharacterRequest - The request body with user id and character id.

  @returns Promise<{ success: boolean }> Operation status.
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
  /*
    Update the display name of a character.

    @param userId string - The user identifier.
    @param characterId string - The character identifier.
    @param name string - The new character name.

    @returns Promise<{ success: boolean }> Operation status.
  */
  const response = await kyDlpApi.post(`update_character_name`, {
    json: { user_id: userId, character_id: characterId, character_name: name },
  })
  return response.json<{ success: boolean }>()
}

/*
  Update the classification adapter and optional model override for a character.

  @param data UpdateCharacterClassificationRequest - The request body.

  @returns Promise<{ success: boolean }> Operation status.
*/
export async function updateCharacterClassification(
  data: UpdateCharacterClassificationRequest,
) {
  const response = await kyDlpApi.post('update_character_classification', {
    json: data,
  })
  return response.json<{ success: boolean }>()
}

/*
  Update the conversation adapter and optional model override for a character.

  @param data UpdateCharacterConversationRequest - The request body.

  @returns Promise<{ success: boolean }> Operation status.
*/
export async function updateCharacterConversation(
  data: UpdateCharacterConversationRequest,
) {
  const response = await kyDlpApi.post('update_character_conversation', {
    json: data,
  })
  return response.json<{ success: boolean }>()
}

/*
  Update the reaction adapter and optional model override for a character.

  @param data UpdateCharacterReactionRequest - The request body.

  @returns Promise<{ success: boolean }> Operation status.
*/
export async function updateCharacterReaction(data: UpdateCharacterReactionRequest) {
  const response = await kyDlpApi.post('update_character_reaction', { json: data })
  return response.json<{ success: boolean }>()
}

/*
  Update the memory adapter and optional model override for a character.

  @param data UpdateCharacterMemoryRequest - The request body.

  @returns Promise<{ success: boolean }> Operation status.
*/
export async function updateCharacterMemory(data: UpdateCharacterMemoryRequest) {
  const response = await kyDlpApi.post('update_character_memory', { json: data })
  return response.json<{ success: boolean }>()
}

export async function fetchGetAvailableTTS(userId: string) {
  /*
    Get available TTS options for a user.

    @param userId string - The user identifier.

    @returns Promise<{ options: string[] }> Available TTS options.
  */
  const response = await kyDlpApi.get(`get_available_tts/${userId}`)
  return response.json<{ options: string[] }>()
}

export async function fetchGetAvailableASR(userId: string) {
  /*
    Get available ASR options for a user.

    @param userId string - The user identifier.

    @returns Promise<{ options: string[] }> Available ASR options.
  */
  const response = await kyDlpApi.get(`get_available_asr/${userId}`)
  return response.json<{ options: string[] }>()
}
export async function fetchUpdateAvatar(
  userId: string,
  characterId: string,
  avatar: string,
) {
  /*
    Update the avatar for a character.

    @param userId string - The user identifier.
    @param characterId string - The character identifier.
    @param avatar string - The avatar image URL or identifier.

    @returns Promise<{ success: boolean }> Operation status.
  */
  const response = await kyDlpApi.post(`update_character_avatar`, {
    json: { user_id: userId, character_id: characterId, avatar: avatar },
  })
  return response.json<{ success: boolean }>()
}
/*
  Confirm the registration using a verification code.

  @param email string - The user email.
  @param code string - The received verification code.

  @returns Promise<{ auth_code: number; auth_msg: string }>
    Confirmation result code and message.
*/
export async function fetchResendVerificationCode(email: string, code: string) {
  const response = await kyDlpApi.post(`confirm_registration`, {
    json: { email: email, confirmation_code: code },
  })
  return response.json<{ auth_code: number; auth_msg: string }>()
}

/*
  Update the user's password.

  @param email string - The user email (username).
  @param oldPassword string - The current password.
  @param newPassword string - The new password.

  @returns Promise<{ success: boolean }> Operation status.
*/
export async function fetchUpdatePassword(
  email: string,
  oldPassword: string,
  newPassword: string,
  language?: string,
) {
  const response = await kyDlpApi.post(`update_user_password`, {
    json: {
      username: email,
      password: oldPassword,
      new_password: newPassword,
      language: language,
    },
  })
  return response.json<{ auth_code: number; auth_msg: string }>()
}
/*
  Delete a user by verifying password and email.

  @param userId string - The user identifier.
  @param password string - The user's password.
  @param email string - The user email (username).

  @returns Promise<{ auth_code: number; auth_msg: string }>
    Deletion result code and message.
*/
export async function fetchDeleteUser(
  userId: string,
  password: string,
  email: string,
  language?: string,
) {
  const response = await kyDlpApi.post(`delete_user`, {
    json: {
      user_id: userId,
      password: password,
      username: email,
      language: language,
    },
  })
  return response.json<{ auth_code: number; auth_msg: string }>()
}
/*
  Resend the confirmation code to the user's email.

  @param email string - The user email address.

  @returns Promise<{ auth_code: number; auth_msg: string }>
    Result of the resend operation.
*/
export async function fetchResendConfirmationCode(email: string) {
  const response = await kyDlpApi.post(`resend_confirmation_code`, {
    json: { email: email },
  })
  return response.json<{ auth_code: number; auth_msg: string }>()
}

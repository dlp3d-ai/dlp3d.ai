import { kyDlpConfig } from './ky'

export async function fetchGetConversation() {
  const response = await kyDlpConfig.get(`conversation_adapter_choices`)
  return response.json<{ choices: string[] }>()
}

export async function fetchGetReaction() {
  const response = await kyDlpConfig.get(`reaction_adapter_choices`)
  return response.json<{ choices: string[] }>()
}
/**
 * Get Reaction

 * @returns
 */
export async function fetchGetClassification() {
  const response = await kyDlpConfig.get(`classification_adapter_choices`)
  return response.json<{ choices: string[] }>()
}
/**
 * Get Memory

 * @returns
 */
export async function fetchGetMemory() {
  const response = await kyDlpConfig.get(`memory_adapter_choices`)
  return response.json<{ choices: string[] }>()
}

export async function fetchGetTTS() {
  const response = await kyDlpConfig.get(`tts_adapter_choices`)
  return response.json<{ choices: string[] }>()
}

export async function fetchGetASR() {
  const response = await kyDlpConfig.get(`asr_adapter_choices`)
  return response.json<{ choices: string[] }>()
}

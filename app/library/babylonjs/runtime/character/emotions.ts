export interface Emotion {
  emotions: EmotionType[]
}

export enum EmotionType {
  Anger = 'Anger',
  Disgust = 'Disgust',
  Fear = 'Fear',
  Happiness = 'Happiness',
  Sadness = 'Sadness',
  Shyness = 'Shyness',
  Surprise = 'Surprise',
  Neutral = 'Neutral',
}

export function toEmotionAdjective(emotion: EmotionType): string {
  switch (emotion) {
    case EmotionType.Anger:
      return 'angry'
    case EmotionType.Disgust:
      return 'disgusted'
    case EmotionType.Fear:
      return 'fearful'
    case EmotionType.Happiness:
      return 'happy'
    case EmotionType.Sadness:
      return 'sad'
    case EmotionType.Shyness:
      return 'shy'
    case EmotionType.Surprise:
      return 'surprised'
    case EmotionType.Neutral:
      return 'neutral'
    default:
      return 'neutral'
  }
}

export const EmotionStrings = Object.values(EmotionType) as string[]

export function toEmotionType(value: string): EmotionType {
  const v = value as EmotionType
  return (EmotionStrings as string[]).includes(v) ? v : EmotionType.Neutral
}

export function toEmotionTypeArray(values: string[]): EmotionType[] {
  return values.map(v => toEmotionType(v))
}

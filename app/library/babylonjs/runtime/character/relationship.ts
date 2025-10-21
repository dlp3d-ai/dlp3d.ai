export interface Relationship {
  stage: string
  score: number
}

export enum RelationshipStage {
  Stranger = 'Stranger',
  Acquaintance = 'Acquaintance',
  Friend = 'Friend',
  Situationship = 'Situationship',
  Lover = 'Lover',
}

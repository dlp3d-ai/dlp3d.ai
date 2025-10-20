export interface AuthConfig {
  users: Array<{
    id: string
    username: string
    password: string
    email?: string
    role?: string
  }>
}

export interface DatabaseConfig {
  host: string
  port: number
  database: string
  username?: string
  password?: string
}

export interface AppConfig {
  auth: AuthConfig
  database: DatabaseConfig
  environment?: 'dev' | 'test' | 'prod'
  version?: string
}

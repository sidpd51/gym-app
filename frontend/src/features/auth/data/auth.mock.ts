// DEV ONLY — plain-text passwords for frontend development only.
// These are not secure, not hashed, and must never be used in production.
export const mockCredentials = [
  { email: 'arjun.mehta@fitzone.example', devPassword: 'owner123', userId: 'u001' },
  { email: 'sneha.desai@fitzone.example', devPassword: 'admin123', userId: 'u002' },
  { email: 'ravi.nair@fitzone.example', devPassword: 'recept123', userId: 'u003' },
  { email: 'amit.sharma@fitzone.example', devPassword: 'trainer123', userId: 'u004' },
] as const

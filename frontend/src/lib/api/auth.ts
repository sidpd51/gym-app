// Auth transport abstraction.
// This interface defines what the frontend needs from the auth system.
// The implementation will be provided when backend integration begins.
// Currently the application uses in-memory mock authentication (AuthContext.tsx).

export interface AuthTransport {
  /** Exchange credentials for a session */
  login(email: string, password: string): Promise<void>
  /** Terminate the session */
  logout(): Promise<void>
  /** Return the current authenticated user ID, or null if not authenticated */
  getCurrentUserId(): Promise<string | null>
  /** Refresh the session if supported by the backend */
  refreshSession(): Promise<void>
}

// NOTE: Not implemented. Wire in during backend integration phase.
// The existing AuthContext provides mock behavior without HTTP.

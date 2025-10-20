/**
 * UnauthenticatedScreen
 *
 * A presentational component shown when the user is not authenticated.
 * It informs the user that sign-in is required and highlights key features
 * available after authentication.
 *
 * @returns React.ReactElement The unauthenticated notice screen markup.
 */
export default function UnauthenticatedScreen() {
  return (
    <div className="auth-required-screen">
      <div className="auth-content">
        <h2>Authentication Required</h2>
        <p>Please sign in to access the chat features</p>
        <div className="auth-features">
          <div className="feature-item">
            <span className="feature-icon">💬</span>
            <span>Interactive Chat</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">🎮</span>
            <span>3D Character Interaction</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">🎨</span>
            <span>Character Customization</span>
          </div>
        </div>
      </div>
    </div>
  )
}

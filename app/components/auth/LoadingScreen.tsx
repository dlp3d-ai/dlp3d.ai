/**
 * LoadingScreen
 *
 * A presentational component that displays a loading UI while
 * the application is checking the user's authentication status.
 *
 * @returns React.ReactElement The loading screen markup.
 */
export default function LoadingScreen() {
  return (
    <div className="auth-loading-screen">
      <div className="loading-content">
        <div className="loading-spinner"></div>
        <h2>Loading...</h2>
        <p>Checking authentication status</p>
      </div>
    </div>
  )
}

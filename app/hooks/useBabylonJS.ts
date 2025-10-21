import { useContext } from 'react'
import { BabylonJSContext } from '../contexts/BabylonJSContext'

/**
 * useBabylonJS
 *
 * A React hook that retrieves the current BabylonJS context from the nearest
 * `BabylonJSProvider`. Ensures that the hook is used within a valid provider
 * boundary.
 *
 * @returns The BabylonJS context value provided by `BabylonJSProvider`.
 * @throws {Error} If called outside of a `BabylonJSProvider` boundary.
 */
const useBabylonJS = () => {
  const context = useContext(BabylonJSContext)
  if (!context)
    throw new Error('BabylonJSContext must be placed within BabylonJSProvider')
  return context
}

export default useBabylonJS

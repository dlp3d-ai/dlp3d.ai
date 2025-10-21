import { GlobalState } from '@/library/babylonjs/core'
import type React from 'react'

export declare type BabylonJSContextType = {
  canvas: React.MutableRefObject<null>
  globalState: GlobalState | undefined
}

'use client'

import React, { useEffect, useRef, useState } from 'react'
import {
  Scene,
  Engine,
  HavokPlugin,
  Vector3,
  UtilityLayerRenderer,
} from '@babylonjs/core'
import HavokPhysics from '@babylonjs/havok'
import onRender from '@/library/babylonjs/onRender'
import onSceneReady from '@/library/babylonjs/onSceneReady'
import { BabylonJSContextType } from '@/types/babylonjs'
import { GlobalState } from '@/library/babylonjs/core'
import useWebSocket from '@/hooks/useWebSocket'
import { useAudioStream } from '@/hooks/useAudioStream'
import { AudioRecordState } from '@/data_structures/audioStreamState'
import { WebSocketConnectionState } from '@/data_structures/webSocketState'
import * as orchestrator_v4 from '@/library/babylonjs/runtime/io/orchestrator_v4_pb'
import { uint8Array2ArrayBuffer } from '@/library/babylonjs/utils/array'

/**
 * React context carrying BabylonJS canvas ref and global state.
 *
 * Exposes `canvas` (HTMLCanvasElement ref) and `globalState` for consumers
 * to interact with the Babylon scene and shared runtime data.
 */
const BabylonJSContext = React.createContext<BabylonJSContextType | null>(null)

/**
 * BabylonJSProvider
 *
 * Initializes and manages a BabylonJS engine/scene lifecycle and related runtime states,
 * providing them via React context to descendant components.
 *
 * @param children React.ReactNode React children to render inside the provider
 * @param characterId string | null Optional character ID used to configure scene content
 *
 * @returns JSX.Element Provider element exposing BabylonJS context values
 */
function BabylonJSProvider({
  children,
  characterId,
}: {
  children: React.ReactNode
  characterId?: string | null
}) {
  const canvas = useRef(null)
  const [globalState, setGlobalState] = useState<GlobalState>()
  const webSocketState = useWebSocket()
  const [isSceneInitialized, setIsSceneInitialized] = useState(false)

  // Add PCM queue to store audio data when websocket is not ready
  const pcmQueue = useRef<ArrayBuffer[]>([])
  const isFlushingQueue = useRef(false)
  const currentFlushPromise = useRef<Promise<void> | null>(null)
  const isUserStreamingRef = useRef<boolean>(false)
  const useHavokPhysics = true

  // Initialize Babylon scene
  useEffect(() => {
    const { current: sceneCanvas } = canvas
    if (!sceneCanvas || isSceneInitialized) return undefined

    const babylonEngine = new Engine(sceneCanvas, true, {
      preserveDrawingBuffer: true,
      stencil: true,
      disableWebGL2Support: false,
      antialias: true,
      powerPreference: 'high-performance',
      adaptToDeviceRatio: true,
    })

    const babylonScene = new Scene(babylonEngine)
    const babylonGlobalState = new GlobalState()
    babylonGlobalState.scene = babylonScene
    // Set WebSocket state before setting global state
    babylonGlobalState.webSocketState = webSocketState
    setGlobalState(babylonGlobalState)
    if (useHavokPhysics) {
      HavokPhysics().then(havokInterface => {
        // Havok is now available
        const havokPlugin = new HavokPlugin(true, havokInterface)
        babylonScene.enablePhysics(new Vector3(0, -9.8 * 1, 0), havokPlugin)
      })
      babylonGlobalState.utilityLayer = new UtilityLayerRenderer(babylonScene)
    }

    // Scene ready logic executes only once
    babylonScene.onReadyObservable.addOnce(() => {
      setIsSceneInitialized(true)
      // onSceneReady(babylonGlobalState, characterId || undefined).catch(error => {
      //   console.error('Failed to initialize scene:', error)
      // })
      onSceneReady(babylonGlobalState).catch(error => {
        console.error('Failed to initialize scene:', error)
      })
    })

    babylonEngine.runRenderLoop(() => {
      onRender(babylonScene)
      babylonScene.render()
    })

    const resize = () => babylonScene.getEngine().resize()
    if (window) window.addEventListener('resize', resize)

    return () => {
      babylonScene.getEngine().dispose()
      if (window) window.removeEventListener('resize', resize)
      setIsSceneInitialized(false)
    }
  }, [])

  // Update WebSocket state in globalState when it changes
  useEffect(() => {
    if (!globalState) return

    const onConnectionChange = (connectionState: WebSocketConnectionState) => {
      globalState.updateWebSocketConnectionState(connectionState)
    }

    const onDataBlock = (dataBlock: ArrayBuffer) => {
      globalState.updateStreamDataBlock(dataBlock)
    }

    webSocketState.onConnectionStateChanged(onConnectionChange)
    webSocketState.onDataBlock(onDataBlock)

    return () => {
      webSocketState.offConnectionStateChanged(onConnectionChange)
      webSocketState.offDataBlock(onDataBlock)
    }
  }, [globalState, webSocketState])

  /**
   * Send or enqueue PCM data depending on WebSocket readiness.
   * If the socket is open and there is no backlog, the buffer is sent immediately;
   * otherwise it is queued for later flushing.
   *
   * @param buffer ArrayBuffer PCM payload to send to the server
   */
  const sendOrQueuePCM = (buffer: ArrayBuffer) => {
    // Check actual websocket readyState in addition to connectionState
    const actualWsState = webSocketState.wsRef.current?.readyState
    const isActuallyConnected = actualWsState === WebSocket.OPEN

    if (
      isActuallyConnected &&
      pcmQueue.current.length === 0 &&
      !isFlushingQueue.current
    ) {
      // Websocket is ready and no queue backlog, send immediately
      webSocketState.sendMessage(buffer)
    } else {
      // Queue the data for later sending
      pcmQueue.current.push(buffer)
      // Try to flush if websocket is ready
      if (isActuallyConnected) {
        flushPCMQueue()
      }
    }
  }

  /**
   * Flush the queued PCM buffers when the WebSocket is ready.
   * Ensures single-flight flushing using an internal promise and flag.
   *
   * @returns Promise<void> Resolves when all queued buffers are sent
   * @throws {Error} Re-throws if sending any buffer fails during flushing
   */
  const flushPCMQueue = async (): Promise<void> => {
    if (isFlushingQueue.current) {
      // If already flushing, return the current promise
      return currentFlushPromise.current ?? Promise.resolve()
    }
    if (pcmQueue.current.length === 0) {
      return Promise.resolve()
    }

    isFlushingQueue.current = true
    currentFlushPromise.current = (async () => {
      try {
        while (pcmQueue.current.length > 0) {
          const buffer = pcmQueue.current.shift()
          if (buffer) {
            webSocketState.sendMessage(buffer)
          }
        }
      } catch (error) {
        console.error('Error flushing PCM queue:', error)
        throw error
      } finally {
        isFlushingQueue.current = false
        currentFlushPromise.current = null
      }
    })()
    return currentFlushPromise.current
  }

  const audioStreamState = useAudioStream(pcm => {
    if (isUserStreamingRef.current === false) {
      return
    }
    const pb_request = new orchestrator_v4.orchestrator_v4.OrchestratorV4Request()
    pb_request.className = 'AudioChunkBody'
    pb_request.data = new Uint8Array(pcm.buffer)
    const data_bytes =
      orchestrator_v4.orchestrator_v4.OrchestratorV4Request.encode(
        pb_request,
      ).finish()
    const buffer = uint8Array2ArrayBuffer(data_bytes)

    sendOrQueuePCM(buffer)
  })

  // Flush queue when websocket connects
  useEffect(() => {
    const actualWsState = webSocketState.wsRef.current?.readyState
    const isActuallyConnected = actualWsState === WebSocket.OPEN

    if (isActuallyConnected) {
      flushPCMQueue()
    }
  }, [webSocketState.connectionState])

  useEffect(() => {
    if (!globalState) {
      return
    }

    globalState.flushPCMQueue = flushPCMQueue
    globalState.getPCMQueueLength = () => pcmQueue.current.length
    isUserStreamingRef.current = globalState.isUserStreaming
  }, [globalState])

  useEffect(() => {
    if (!globalState) {
      return
    }

    // Listen to the observable for recording state changes
    const onUserStreamingStateChanged = (isStreaming: boolean) => {
      isUserStreamingRef.current = isStreaming
    }

    globalState.onUserStreamingStateChangedObservable.add(
      onUserStreamingStateChanged,
    )

    isUserStreamingRef.current = globalState.isUserStreaming

    return () => {
      globalState.onUserStreamingStateChangedObservable.removeCallback(
        onUserStreamingStateChanged,
      )
    }
  }, [globalState])

  useEffect(() => {
    if (!globalState) return

    globalState.audioStreamState = audioStreamState

    const onRecord = (state: AudioRecordState) => {
      globalState.updateAudioStreamState(state)
    }

    audioStreamState.onRecordStateChange(onRecord)

    return () => {
      audioStreamState.offRecordStateChange(onRecord)
    }
  }, [globalState, audioStreamState])

  return (
    <BabylonJSContext.Provider value={{ canvas, globalState }}>
      {children}
    </BabylonJSContext.Provider>
  )
}

export { BabylonJSProvider, BabylonJSContext }

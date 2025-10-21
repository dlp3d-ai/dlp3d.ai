import * as BABYLON_GUI from '@babylonjs/gui'
import { GlobalState } from '@/library/babylonjs/core'
import {
  Conditions,
  ConditionedMessage,
} from '@/library/babylonjs/runtime/fsm/conditions'
import { Logger } from '@/library/babylonjs/utils'

/**
 * Convert viewport width percentage to pixels.
 *
 * @param value The percentage value (0-100).
 * @returns The equivalent pixel value based on window width.
 */
function vw(value: number) {
  return (value / 100) * window.innerWidth
}

/**
 * Convert viewport height percentage to pixels.
 *
 * @param value The percentage value (0-100).
 * @returns The equivalent pixel value based on window height.
 */
function vh(value: number) {
  return (value / 100) * window.innerHeight
}

/**
 * GUI
 *
 * A class for managing Babylon.js GUI elements including audio controls,
 * loading spinners, and viewport utilities.
 */
export class GUI {
  /**
   * Main advanced dynamic texture for GUI elements.
   */
  advancedTexture: BABYLON_GUI.AdvancedDynamicTexture
  /**
   * Render view texture for specific UI elements.
   */
  renderViewTexture: BABYLON_GUI.AdvancedDynamicTexture
  /**
   * Global state reference for accessing scene and runtime.
   */
  private _globalState: GlobalState
  /**
   * 3D GUI manager for 3D UI elements.
   */
  gui3DManager: BABYLON_GUI.GUI3DManager
  /**
   * HTML element for the loading spinner overlay.
   */
  private loadingSpinnerElement: HTMLElement | null = null

  /**
   * Create a new GUI instance.
   *
   * @param globalState The global state containing scene and runtime references.
   */
  constructor(globalState: GlobalState) {
    this.advancedTexture = BABYLON_GUI.AdvancedDynamicTexture.CreateFullscreenUI(
      'GUI',
      true,
      globalState.scene,
    )
    this._globalState = globalState
    this.gui3DManager = new BABYLON_GUI.GUI3DManager(this._globalState.scene)

    this.renderViewTexture = BABYLON_GUI.AdvancedDynamicTexture.CreateFullscreenUI(
      'renderViewGUI',
      true,
      globalState.scene,
    )

    this.setupAudioControls()
    this.setupStreamRecoveringControls()
  }

  /**
   * Setup stream recovering controls including loading spinner overlay.
   * Creates an HTML loading spinner that can be shown during stream recovery.
   */
  setupStreamRecoveringControls() {
    // Create HTML loading spinner overlay
    this.loadingSpinnerElement = document.createElement('div')
    this.loadingSpinnerElement.id = 'loading-spinner-overlay'
    this.loadingSpinnerElement.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 9999;
      pointer-events: none;
    `

    // Create the spinner container
    const spinnerContainer = document.createElement('div')
    spinnerContainer.style.cssText = `
      width: 96px;
      height: 96px;
      display: flex;
      justify-content: center;
      align-items: center;
    `

    // Load and insert the SVG content
    fetch('/img/bars-rotate-fade.svg')
      .then(response => {
        return response.text()
      })
      .then(svgContent => {
        spinnerContainer.innerHTML = svgContent
      })
      .catch(error => {
        Logger.warn(`Failed to load loading spinner SVG: ${error}`)
        // Fallback: create a simple CSS spinner
        spinnerContainer.innerHTML = `
          <div style="
            width: 48px;
            height: 48px;
            border: 8px solid #f3f3f3;
            border-top: 8px solid #000;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          "></div>
          <style>
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          </style>
        `
      })

    this.loadingSpinnerElement.appendChild(spinnerContainer)
    document.body.appendChild(this.loadingSpinnerElement)

    // Initially hide the spinner using JavaScript
    this.loadingSpinnerElement.style.display = 'none'
  }

  /**
   * Show the loading spinner overlay.
   */
  showStreamRecovering() {
    if (this.loadingSpinnerElement) {
      this.loadingSpinnerElement.style.display = 'flex'
    }
  }

  /**
   * Hide the loading spinner overlay.
   */
  hideStreamRecovering() {
    if (this.loadingSpinnerElement) {
      this.loadingSpinnerElement.style.display = 'none'
    }
  }

  /**
   * Setup audio recording controls including a record button with responsive design.
   * Creates a button that handles audio recording with hold-to-record functionality.
   */
  setupAudioControls() {
    const recordAudioButton = BABYLON_GUI.Button.CreateImageButton(
      'recordAudioButton',
      '',
      'textures/user_not_speaking.png',
    )
    recordAudioButton.verticalAlignment =
      BABYLON_GUI.Control.VERTICAL_ALIGNMENT_BOTTOM
    recordAudioButton.horizontalAlignment =
      BABYLON_GUI.Control.HORIZONTAL_ALIGNMENT_CENTER
    recordAudioButton.top = vh(-10) + 'px'

    // Intelligently detect device type and adjust button size
    const updateButtonSize = () => {
      // Dynamically adjust button size based on screen size
      let buttonSize: number
      if (window.innerWidth <= 480) {
        // Small screen phones: use larger button
        buttonSize = Math.max(vh(35), 90) // At least 90px
      } else if (window.innerWidth <= 768) {
        // Tablets or large phones: use medium button
        buttonSize = Math.max(vh(30), 80) // At least 80px
      } else {
        // Desktop: use original size
        buttonSize = vh(20)
      }

      recordAudioButton.width = buttonSize + 'px'
      recordAudioButton.height = buttonSize + 'px'
      recordAudioButton.image!.width = buttonSize + 'px'
      recordAudioButton.image!.height = buttonSize + 'px'
    }

    // Initial setup
    updateButtonSize()

    // Listen for window size changes
    window.addEventListener('resize', updateButtonSize)

    recordAudioButton.cornerRadius = 0.5
    recordAudioButton.background = 'transparent'
    recordAudioButton.thickness = 0
    recordAudioButton.disabledColor = 'transparent'
    recordAudioButton.alpha = 1
    recordAudioButton.isEnabled = false
    // JavaScript-based prevention for Safari on iPad
    if (typeof window !== 'undefined') {
      // Prevent text selection on the button
      recordAudioButton.onPointerDownObservable.add(() => {
        // Add CSS class to body to prevent text selection globally during button press
        document.body.style.setProperty('-webkit-user-select', 'none')
        document.body.style.setProperty('user-select', 'none')
        document.body.style.setProperty('-webkit-touch-callout', 'none')
      })

      recordAudioButton.onPointerUpObservable.add(() => {
        // Restore text selection after button release
        document.body.style.removeProperty('-webkit-user-select')
        document.body.style.removeProperty('user-select')
        document.body.style.removeProperty('-webkit-touch-callout')
      })
    }

    this.renderViewTexture.addControl(recordAudioButton)

    // Variables to track pointer timing
    let pointerDownTime: number = 0
    let recordingStarted: boolean = false
    let holdTimer: NodeJS.Timeout | null = null
    let isPointerDown: boolean = false

    recordAudioButton.onPointerDownObservable.add(async () => {
      pointerDownTime = Date.now()
      recordingStarted = false
      isPointerDown = true

      // Use polling to check if button is still held
      if (this._globalState.isUserStreaming === false) {
        const checkHoldStatus = () => {
          const elapsedTime = Date.now() - pointerDownTime

          // If pointer is no longer down, stop checking
          if (!isPointerDown) {
            return
          }

          // If enough time has passed and pointer is still down, start recording
          if (elapsedTime >= 200) {
            recordingStarted = true
            if (this._globalState.runtime?.streamedAnimationPlaying()) {
              this._globalState.stateMachine?.putConditionedMessage(
                new ConditionedMessage(Conditions.USER_INTERRUPT_ANIMATION, null),
              )
            } else {
              this._globalState.stateMachine?.putConditionedMessage(
                new ConditionedMessage(Conditions.USER_START_RECORDING, null),
              )
            }
            recordAudioButton.image!.source = 'textures/user_speaking.png'
            return
          }

          // Continue checking every 50ms
          holdTimer = setTimeout(checkHoldStatus, 50)
        }

        // Start checking after 50ms
        holdTimer = setTimeout(checkHoldStatus, 50)
      }
    })

    recordAudioButton.onPointerUpObservable.add(async () => {
      isPointerDown = false

      if (holdTimer) {
        clearTimeout(holdTimer)
        holdTimer = null
      }

      // Stop recording if we started recording
      if (recordingStarted) {
        this._globalState.stateMachine?.putConditionedMessage(
          new ConditionedMessage(Conditions.USER_STOP_RECORDING, null),
        )
        recordAudioButton.image!.source = 'textures/user_not_speaking.png'
        recordingStarted = false
      }
    })
  }

  /**
   * Resize the GUI textures to match the new dimensions.
   *
   * @param width The new width in pixels.
   * @param height The new height in pixels.
   */
  resize(width: number, height: number) {
    this.advancedTexture.scaleTo(width, height)
    this.renderViewTexture.scaleTo(width, height)
  }
}

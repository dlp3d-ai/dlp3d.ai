'use client'

// Global progress tracking variable
let currentLoadingProgress = 0
let currentLoadingText = ''

/**
 * Safe progress dispatch function that only updates if progress increases
 * or provides better status text
 */
export function safeDispatchProgress(
  progress: number,
  text: string,
  source: string = 'unknown',
): void {
  if (typeof window === 'undefined') return

  // Only update if progress increases or text changes with same progress
  const shouldUpdate =
    progress > currentLoadingProgress ||
    (progress === currentLoadingProgress && text !== currentLoadingText)

  if (shouldUpdate) {
    currentLoadingProgress = progress
    currentLoadingText = text

    console.log(`Progress Update [${source}]: ${progress}% - ${text}`)

    window.dispatchEvent(
      new CustomEvent('loading-progress', {
        detail: { progress, text },
      }),
    )
  } else {
    console.log(
      `Progress Ignored [${source}]: ${progress}% - ${text} (current: ${currentLoadingProgress}%)`,
    )
  }
}

/**
 * Loading Progress Manager - Singleton class for coordinated progress updates
 */
export class LoadingProgressManager {
  private static instance: LoadingProgressManager | null = null
  private currentProgress: number = 0
  private currentText: string = ''
  private sources: Map<string, number> = new Map()

  private constructor() {}

  static getInstance(): LoadingProgressManager {
    if (!LoadingProgressManager.instance) {
      LoadingProgressManager.instance = new LoadingProgressManager()
    }
    return LoadingProgressManager.instance
  }

  updateProgress(
    progress: number,
    text: string,
    source: string = 'unknown',
  ): boolean {
    if (typeof window === 'undefined') return false

    const shouldUpdate = this.shouldUpdateProgress(progress, source)

    if (shouldUpdate) {
      this.currentProgress = progress
      this.currentText = text
      this.sources.set(source, progress)

      this.dispatchProgressEvent(progress, text)
      return true
    } else {
      return false
    }
  }

  getCurrentProgress(): { progress: number; text: string } {
    return {
      progress: this.currentProgress,
      text: this.currentText,
    }
  }

  reset(): void {
    this.currentProgress = 0
    this.currentText = ''
    this.sources.clear()
    currentLoadingProgress = 0
    currentLoadingText = ''
  }

  private dispatchProgressEvent(progress: number, text: string): void {
    // Update global variables for backward compatibility
    currentLoadingProgress = progress
    currentLoadingText = text

    window.dispatchEvent(
      new CustomEvent('loading-progress', {
        detail: { progress, text },
      }),
    )
  }

  private shouldUpdateProgress(newProgress: number, source: string): boolean {
    // Always allow progress increases
    if (newProgress > this.currentProgress) return true

    // Allow same progress with different text
    if (newProgress === this.currentProgress && this.currentText !== '') return true

    // Don't allow progress decreases
    return false
  }
}



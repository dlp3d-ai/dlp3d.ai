// 直接返回原始截图，不添加任何效果
const applyFrostedGlassEffect = (dataURL: string): Promise<string> => {
  return Promise.resolve(dataURL)
}

export const captureScreenshot = async (): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      // 尝试通过全局变量获取BabylonViewer的ref
      const babylonViewerRef = (window as any).babylonViewerRef

      if (
        babylonViewerRef &&
        babylonViewerRef.current &&
        babylonViewerRef.current.takeScreenshot
      ) {
        // 使用BabylonViewer的截图方法
        babylonViewerRef.current
          .takeScreenshot()
          .then(async (dataURL: string) => {
            // 应用磨砂效果
            const processedDataURL = await applyFrostedGlassEffect(dataURL)
            resolve(processedDataURL)
          })
          .catch((error: any) => {
            console.error('BabylonViewer screenshot failed:', error)
            fallbackToHtml2Canvas(resolve, reject)
          })
      } else {
        // 如果没有找到BabylonViewer ref，使用html2canvas截取整个页面
        fallbackToHtml2Canvas(resolve, reject)
      }
    } catch (error) {
      console.error('Screenshot capture error:', error)
      reject(error)
    }
  })
}

const fallbackToHtml2Canvas = (
  resolve: (value: string) => void,
  reject: (reason?: any) => void,
) => {
  import('html2canvas')
    .then(({ default: html2canvas }) => {
      html2canvas(document.body, {
        allowTaint: true,
        useCORS: true,
      })
        .then(async (canvas: HTMLCanvasElement) => {
          const dataURL = canvas.toDataURL('image/png')
          // 应用磨砂效果
          const processedDataURL = await applyFrostedGlassEffect(dataURL)
          resolve(processedDataURL)
        })
        .catch((error: any) => {
          console.error('Full page screenshot capture failed:', error)
          reject(error)
        })
    })
    .catch((error: any) => {
      console.error('Failed to load html2canvas:', error)
      reject(error)
    })
}
class ScreenshotDB {
  private dbName = 'dlp_screenshots'
  private version = 1
  private storeName = 'screenshots'

  private async openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)

      request.onupgradeneeded = event => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'id' })
        }
      }
    })
  }

  async saveScreenshot(sessionId: string, screenshotData: string): Promise<void> {
    const db = await this.openDB()
    const transaction = db.transaction([this.storeName], 'readwrite')
    const store = transaction.objectStore(this.storeName)

    const data = {
      id: sessionId,
      data: screenshotData,
      timestamp: Date.now(),
    }

    await new Promise<void>((resolve, reject) => {
      const request = store.put(data)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async getScreenshot(sessionId: string): Promise<string | null> {
    try {
      const db = await this.openDB()
      const transaction = db.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)

      return new Promise((resolve, reject) => {
        const request = store.get(sessionId)
        request.onsuccess = () => {
          const result = request.result
          if (result && result.data) {
            resolve(result.data)
          } else {
            resolve(null)
          }
        }
        request.onerror = () => reject(request.error)
      })
    } catch (error) {
      console.error('Failed to get screenshot from IndexedDB:', error)
      return null
    }
  }

  async clearOldScreenshots(): Promise<void> {
    try {
      const db = await this.openDB()
      const transaction = db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)

      const allScreenshots = await new Promise<any[]>((resolve, reject) => {
        const request = store.getAll()
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      })

      const sortedScreenshots = allScreenshots.sort(
        (a, b) => b.timestamp - a.timestamp,
      )
      const toDelete = sortedScreenshots.slice(10)

      for (const screenshot of toDelete) {
        await new Promise<void>((resolve, reject) => {
          const deleteRequest = store.delete(screenshot.id)
          deleteRequest.onsuccess = () => resolve()
          deleteRequest.onerror = () => reject(deleteRequest.error)
        })
      }
    } catch (error) {
      console.error('Failed to clear old screenshots:', error)
    }
  }

  async clearScreenshot(sessionId: string): Promise<void> {
    try {
      const db = await this.openDB()
      const transaction = db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      await new Promise<void>((resolve, reject) => {
        const deleteRequest = store.delete(sessionId)
        deleteRequest.onsuccess = () => resolve()
        deleteRequest.onerror = () => reject(deleteRequest.error)
      })
    } catch (error) {
      console.error('Failed to clear screenshot:', error)
    }
  }

  async clearAllScreenshots(): Promise<void> {
    try {
      const db = await this.openDB()
      const transaction = db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      await new Promise<void>((resolve, reject) => {
        const clearRequest = store.clear()
        clearRequest.onsuccess = () => resolve()
        clearRequest.onerror = () => reject(clearRequest.error)
      })
      console.log('All screenshots cleared from IndexedDB')
    } catch (error) {
      console.error('Failed to clear all screenshots:', error)
    }
  }
}

const screenshotDB = new ScreenshotDB()

export const saveScreenshotToStorage = async (
  screenshotData: string,
  sessionId?: string,
): Promise<void> => {
  try {
    if (!sessionId) {
      throw new Error('Session ID is required for IndexedDB storage')
    }
    await screenshotDB.clearOldScreenshots()
    await screenshotDB.saveScreenshot(sessionId, screenshotData)
  } catch (error) {
    console.error('Failed to save screenshot to IndexedDB:', error)
    throw error
  }
}

export const getScreenshotFromStorage = async (
  sessionId?: string,
): Promise<string | null> => {
  try {
    if (!sessionId) {
      return null
    }
    const data = await screenshotDB.getScreenshot(sessionId)
    return data
  } catch (error) {
    console.error('Failed to get screenshot from storage:', error)
    return null
  }
}

export const clearScreenshotFromStorage = async (
  sessionId?: string,
): Promise<void> => {
  try {
    if (sessionId) {
      await screenshotDB.clearScreenshot(sessionId)
    } else {
      console.warn('No sessionId provided, cannot clear screenshot from IndexedDB')
    }
  } catch (error) {
    console.error('Failed to clear screenshot from storage:', error)
  }
}

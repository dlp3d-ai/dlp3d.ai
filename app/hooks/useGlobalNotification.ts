import { useNotification } from '../components/common/GlobalNotification'

// 导出便捷的 Hook
export {
  useNotification,
  useErrorHandler,
} from '../components/common/GlobalNotification'

// 专门用于错误处理的 Hook
export const useErrorNotification = () => {
  const { showError } = useNotification()

  const showErrorNotification = (error: unknown, fallbackMessage?: string) => {
    let message = fallbackMessage || 'An unexpected error occurred'

    if (error instanceof Error) {
      message = error.message
    } else if (typeof error === 'string') {
      message = error
    }

    showError(message)
  }

  return { showErrorNotification }
}

// 用于在 async 函数中处理错误的 Hook
export const useAsyncErrorHandler = () => {
  const { showError } = useNotification()

  const handleAsyncError = async <T>(
    asyncFn: () => Promise<T>,
    errorMessage?: string,
  ): Promise<T | null> => {
    try {
      return await asyncFn()
    } catch (error) {
      const message =
        errorMessage || (error instanceof Error ? error.message : 'Operation failed')
      showError(message)
      return null
    }
  }

  return { handleAsyncError }
}

export const useSuccessNotification = () => {
  const { showSuccess } = useNotification()

  const showSuccessNotification = (message: string) => {
    showSuccess(message)
  }

  return { showSuccessNotification }
}

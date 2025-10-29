import { useNotification } from '../components/common/GlobalNotification'

// Export convenient hooks
export {
  useNotification,
  useErrorHandler,
} from '../components/common/GlobalNotification'

/*
  React hook that provides a helper for showing error notifications.

  @returns {object} An API with `showErrorNotification(error, fallbackMessage?)`.
*/
export const useErrorNotification = () => {
  const { showError } = useNotification()

  /*
    Display an error notification derived from the provided value.

    @param error {unknown} An Error instance, string, or any unknown value.
    @param fallbackMessage {string | undefined} Optional message to use if an error message cannot be extracted. Default: undefined.

    @returns {void} No return value.
  */
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

/*
  React hook that wraps async functions with centralized error handling.

  @returns {object} An API with `handleAsyncError(asyncFn, errorMessage?)`.
*/
export const useAsyncErrorHandler = () => {
  const { showError } = useNotification()

  /*
    Execute an async function and handle any thrown error by showing a notification.

    @param asyncFn {() => Promise<T>} The async function to execute.
    @param errorMessage {string | undefined} Optional message to display when an error occurs. Default: undefined.

    @returns {Promise<T | null>} Resolves to the function result, or null if an error occurred.
  */
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

/*
  React hook that provides a helper for showing success notifications.

  @returns {object} An API with `showSuccessNotification(message)`.
*/
export const useSuccessNotification = () => {
  const { showSuccess } = useNotification()

  /*
    Display a success notification with the provided message.

    @param message {string} The success message to display.

    @returns {void} No return value.
  */
  const showSuccessNotification = (message: string) => {
    showSuccess(message)
  }

  return { showSuccessNotification }
}

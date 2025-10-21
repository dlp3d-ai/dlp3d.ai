import { createTheme } from '@mui/material/styles'

/**
 * Application theme configuration.
 *
 * Defines the color palette and component styling for the entire application.
 * Uses a dark theme with primary color #EEEEEE (light gray) and secondary color #FFD369 (gold).
 */
export const appTheme = createTheme({
  palette: {
    primary: { main: '#EEEEEE' },
    secondary: { main: '#FFD369' },
    text: {
      primary: '#EEEEEE',
      secondary: '#FFD369',
      disabled: '#555555',
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: '#222831',
        },
      },
    },
  },
})

/**
 * Default export of the application theme.
 *
 * @returns The configured Material-UI theme object.
 */
export default appTheme

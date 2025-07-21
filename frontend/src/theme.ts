import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#003366', // Deep Blue
      contrastText: '#fff',
    },
    secondary: {
      main: '#C8102E', // Red/Pink
      contrastText: '#fff',
    },
    background: {
      default: '#F5F5F5', // Light Gray
      paper: '#fff',
    },
    text: {
      primary: '#222222', // Dark Gray
      secondary: '#003366',
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
  },
});

export default theme; 
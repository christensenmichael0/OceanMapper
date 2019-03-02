import React from 'react';
import ReactDOM from 'react-dom';
import AppRouter from './AppRouter';
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';
import purple from '@material-ui/core/colors/purple';
import './index.css';

const theme = createMuiTheme({
  palette: {
    primary: {
      main: '#cccccc', // '#e0e0e0'
    },
    secondary: purple
  },
  status: {
    danger: 'orange',
  }
});

function MuiAppContainer() {
  return (
    <MuiThemeProvider theme={theme}>
      <AppRouter />
    </MuiThemeProvider>
  );
}

ReactDOM.render(<MuiAppContainer />, document.getElementById('root'));

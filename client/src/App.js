import React, { Component } from 'react';
import { withTheme } from '@material-ui/core/styles';
import PersistentDrawerLeft from './components/PersistentDrawerLeft.js';
// import './App.css';
// import Map from './Map';

class App extends Component {
  render() {
    return (
      <div >
        <PersistentDrawerLeft />
      </div>
    );
  }
}

export default withTheme()(App);
// export default App;

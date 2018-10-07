import React, { Component } from 'react';

import Navigation from './components/Navigation';
import Router from './components/Router';

class App extends Component {

  render() {
    return (
      <div className='App container'>
        <Navigation />
        <Router />
      </div>
    );
  }
}

export default App;

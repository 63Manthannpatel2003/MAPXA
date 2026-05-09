import React from 'react';
import './App.css';
import FileUpload from './views/FileUpload';

const App = () => {
  return (
    <div className="App">
      <header className="App-header">
        {/* <h1>Fruit Management App</h1> */}
      </header>
      <main>
        {/* <FruitList /> */}
        <FileUpload />
      </main>
    </div>
  );
};

export default App;
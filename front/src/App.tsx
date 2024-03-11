import React, {useEffect, useState} from 'react';
import logo from './logo.svg';
import './App.css';
import {Base} from "./Base";
import {Brick} from "./Brick";

let element = {
  id:'str354',
  name:"une brique",
  link: "alink.fr",
  icon: "icon.png"
}
function App() {
  const [bricks, setBricks] = useState([]);
  useEffect(()=>{
    fetch('/api/elements/bricks').then(res=>res.json()).then(setBricks);
  },[])
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        {/*@ts-ignore*/}
        {bricks.map(brick=><Brick key={brick.id} data={brick}/>)}
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}


export default App;

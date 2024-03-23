import React, {useEffect, useState} from 'react';
import logo from './logo.svg';
import './App.css';
import {Base} from "./Base";
import {Brick} from "./Brick";
import {BrowserRouter as Router, Link, Route, Routes} from "react-router-dom";
import Inventory, {InventoryDetail} from "./Inventory";
import Catalogue from "./Catalogue";
import Home from "./Home";
let element = {
  id:'str354',
  name:"une brique",
  link: "alink.fr",
  icon: "icon.png"
}
function App() {


    return (
    <div className="App">
        <Router>
            <header className="App-header">
                <img src={logo} className="App-logo" alt="logo"/>
            </header>
                <div className="menubar">
                    <ul className="menubar">
                        <li className="menuitem"><Link to="/home">Home</Link></li>
                        <li className="menuitem"><Link to="/inventory">Inventory</Link></li>
                        <li className="menuitem"><Link to='/catalogue'>Catalogue</Link></li>
                    </ul>
                </div>
                <Routes>
                    <Route path="/home" element={<Home/>}/>
                    <Route path="/inventory" element={<Inventory/>}/>
                    <Route path="/catalogue" element={<Catalogue/>}/>
                    <Route path="/inventory/details/:id" element={<Inventory/>}/>
                </Routes>
        </Router>
    </div>
    );
}


export default App;

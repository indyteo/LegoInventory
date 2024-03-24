import React from "react";
import "./App.css";
import { BrowserRouter as Router, Link, Route, Routes } from "react-router-dom";
import Inventory, { Inventories, InventoryDetails } from "./Inventory";
import Catalog, {
  CatalogBrick,
  CatalogBricks,
  CatalogMinifigure,
  CatalogMinifigures,
  CatalogSet,
  CatalogSets
} from "./Catalog";
import Home from "./Home";

function App() {
  return (
    <div className="App">
      <Router>
        <ul className="menubar">
          <li className="menuitem">
            <Link to="/">Home</Link>
          </li>
          <li className="menuitem">
            <Link to="/inventory">Inventory</Link>
          </li>
          <li className="menuitem">
            <Link to="/catalog">Catalog</Link>
          </li>
        </ul>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/inventory" element={<Inventories />} />
          <Route path="/inventory/:id" element={<Inventory />} />
          <Route path="/inventory/:id/minifigures" element={<InventoryDetails type="minifigures" />} />
          <Route path="/inventory/:id/bricks" element={<InventoryDetails type="bricks" />} />
          <Route path="/catalog" element={<Catalog />} />
          <Route path="/catalog/brick" element={<CatalogBricks />} />
          <Route path="/catalog/brick/:id" element={<CatalogBrick />} />
          <Route path="/catalog/minifigure" element={<CatalogMinifigures />} />
          <Route path="/catalog/minifigure/:id" element={<CatalogMinifigure />} />
          <Route path="/catalog/set" element={<CatalogSets />} />
          <Route path="/catalog/set/:id" element={<CatalogSet />} />
          <Route
            path="*" element={
            <div>
              <h1>404 Not Found</h1>
              <Link to="/">Home</Link>
            </div>
          }
          />
        </Routes>
      </Router>
    </div>
  );
}

export default App;

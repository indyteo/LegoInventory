import React from "react";
import { Link } from "react-router-dom";

export default function Home(){
  return (
    <div>
      <h1 style={{ paddingBottom: 20 }}>Welcome to Lego Inventory!</h1>
      <div>
        <Link to="/inventory">Explore inventories</Link>
      </div>
      <div>
        <Link to="/catalog">Browse catalog</Link>
      </div>
    </div>
  );
}

import React, { useEffect, useState } from "react";
import CategoriesFlameGraph from "./CategoriesFlameGraph";
import { InventoriesType, InventoryDetailsType, InventoryType } from "./types";
import { api } from "./utils";
import { Brick, Minifigure, Set } from "./Element";
import { Link, useNavigate, useParams } from "react-router-dom";

export function Inventories() {
  const navigate = useNavigate();
  const [ inventories, setInventories ] = useState<InventoriesType[]>();

  useEffect(() => {
    api<InventoriesType[]>("/inventories").then(setInventories);
  }, []);

  const addInventory = () => {
    const name = window.prompt("Inventory name");
    if (name === null)
      return;
    api<{ id: string }>("/inventories", "POST", { name })
      .then(inventory => navigate(`/inventory/${inventory.id}`));
  };

  const deleteInventory = (id: string) => {
    if (!window.confirm("Are you sure?"))
      return;
    api(`/inventories/${id}`, "DELETE")
      .then(() => api<InventoriesType[]>("/inventories"))
      .then(setInventories);
  };

  return (
    <div>
      <button onClick={addInventory}>Create inventory</button>
      {inventories?.map(inventory => (
        <div key={inventory.id}>
          <Link to={`/inventory/${inventory.id}`}><h1>{inventory.name}</h1></Link>
          <p>{inventory.sets} sets / {inventory.minifigures} minifigures</p>
          <button onClick={() => deleteInventory(inventory.id)}>Delete inventory</button>
        </div>
      ))}
    </div>
  );
}

export default function Inventory() {
  const { id } = useParams();
  const [ inventory, setInventory ] = useState<InventoryType>();

  useEffect(() => {
    api<InventoryType>(`/inventories/${id}`).then(setInventory);
  }, [ id ]);

  const addItem = () => {
    const elementId = window.prompt("Item ID");
    if (elementId === null)
      return;
    api(`/inventories/${id}/content`, "POST", { elementId })
      .then(() => api<InventoryType>(`/inventories/${id}`))
      .then(setInventory);
  };

  const deleteItem = (elementId: string) => {
    if (!window.confirm("Are you sure?"))
      return;
    api(`/inventories/${id}/content/${elementId}`, "DELETE")
      .then(() => api<InventoryType>(`/inventories/${id}`))
      .then(setInventory);
  };

  if (inventory === undefined)
    return null;
  return (
    <div>
      <Link to="/inventory">Back</Link>
      <h2>Inventory: {inventory.name}</h2>
      {inventory.content.length > 0 && (
        <div id="categories-flame-graph" style={{ marginLeft: "25px" }}>
          <CategoriesFlameGraph categories={inventory.categories} />
        </div>
      )}
      <Link to={`/inventory/${inventory.id}/minifigures`}>Minifigures list</Link>
      {" - "}
      <Link to={`/inventory/${inventory.id}/bricks`}>Bricks list</Link>
      <hr />
      <h2>Content</h2>
      <button onClick={addItem}>Add item</button>
      {inventory.content.map(item => (
        <div key={item.element.id}>
          {item.element.type == "M" ? <Minifigure data={item.element} /> : <Set data={item.element} />}
          <div>Quantity: {item.quantity}</div>
          <div>Since: {new Date(item.since.year, item.since.month - 1, item.since.day).toJSON().substring(0, 10)}</div>
          <button onClick={() => deleteItem(item.element.id)}>Delete item</button>
        </div>
      ))}
    </div>
  );
}

export interface InventoryDetailsProps {
  type: "minifigures" | "bricks";
}

export function InventoryDetails({ type }: InventoryDetailsProps) {
  const { id } = useParams();
  const [ details, setDetails ] = useState<InventoryDetailsType[]>();
  const [ page, setPage ] = useState(1);

  useEffect(() => {
    api<InventoryDetailsType[]>(`/inventories/${id}/${type}?page=${page}`).then(setDetails);
  }, [ id, page ]);

  if (details === undefined)
    return null;
  return (
    <div>
      <Link to={`/inventory/${id}`}>Back</Link>
      <h2><span style={{ textTransform: "capitalize" }}>{type}</span> in inventory</h2>
      {details.map(element => (
        <div key={element.id}>
          {type === "minifigures" ? <Minifigure data={element} /> : <Brick data={element} color={element.color} />}
          <p>Quantity: {element.quantity}</p>
          <div>
            {element.from.map(from => (
              <div key={from.element || id}>
                {from.quantity} from {from.element === null ? (
                  <>direct inventory</>
                ) : (
                  <>{from.type === "M" ? "minifigure" : "set"} <Link to={`/catalog/${from.type === "M" ? "minifigure" : "set"}/${from.element}`}>{from.element}</Link></>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
      <div style={{
        marginTop: "35px",
        justifyContent: "center",
        display: "flex",
        flexWrap: "nowrap",
        textAlign: "center"
      }}>
        <button onClick={() => setPage(p => p - 1)} disabled={page === 1}>Previous page</button>
        <div style={{ marginLeft: "10px", marginRight: "10px" }}>Page {page}</div>
        <button onClick={() => setPage(p => p + 1)}>Next page</button>
      </div>
    </div>
  );
}

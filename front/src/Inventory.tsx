import {Minifigure,MinifigureList} from './Minifigure';
import {Set,SetList} from './Set';
import React, {useEffect, useState} from "react";
import {FlameGraphTest} from "./FlameGraphTest";

//Component to display Inventory content
export default function Inventory(){

    const [inventory, setInventory] = useState({});
    useEffect(()=>{
        fetch('http://localhost:8080/inventories/c2aa2173-ad4e-46bb-8804-2712e0b0566e').then(res=>res.json()).then(setInventory);
    },[])
    const [page, setPage] = useState(1);
    return (
        <div className="Inventory">
            {/*@ts-ignore*/}
            <h2>Composition de l'inventaire {inventory.name}</h2>
            <div style={{marginLeft: "200px"}}>
                <FlameGraphTest/>
            </div>
            <h2>Contenu de l'inventaire</h2>
            {/*@ts-ignore*/}
            {inventory.map(item => item.type == 'M' ? <Minifigure key={item.id} data={item}/> : <Set key={item.id} data={item}/>)}
            <div style={{
                width: "300px",
                alignContent: "center",
                display: "flex",
                flexWrap: "nowrap",
                paddingBottom: "10px",
                textAlign: "center",
                marginLeft: "560px"
            }}>
                <button onClick={() => setPage(p => p - 1)} disabled={page == 1}>Previous page</button>
                <div style={{marginLeft: "10px", marginRight: "10px"}}>Page {page}</div>
                <button onClick={() => setPage(p => p + 1)}>Next page</button>
            </div>
        </div>
    );
}
// Component to display details about element (set or minifigure)
interface InventoryDetailProps{
    data:{
        content:{};
        type:string;
    }
}
// @ts-ignore
export function InventoryDetail({data:{content,type}}:InventoryDetailProps){
    return (
        <div className="InventoryDetail">

            <h2>Contenu de l'inventaire</h2>
            {/*@ts-ignore*/}
            {type == 'M' ? <MinifigureList key={content.id} data={content}/>  : <SetList key={content.id} data={content}/>}

        </div>
    );
}
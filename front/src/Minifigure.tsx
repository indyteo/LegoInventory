import {Base} from "./Base";
import React, {useEffect, useState} from "react";
import {Brick,Bricklist} from "./Brick";
import {Link} from "react-router-dom";
interface MinifigureProps{
    data:{
        id:string,
        name:string,
        icon:string,
        instructions:string,
        quantity:number,
        bricks:[]

    }
}
//Component for inventory
export function Minifigure({data:{id,name,icon,bricks}}:MinifigureProps){
    /*const [bricks_list, setBricks] = useState([]);
    useEffect(()=>{fetch('http://localhost:8080/elements/bricks').then(res => res.json()).then(setBricks)},[]);*/
    return(
        <>
            <div>
                <div style={{width:'100%'}}>{/*TODO apply css with classes*/}
                    <img src={icon}/>
                    <div>
                        <h3 id={id}>{name}</h3>
                    </div>
                    <div><Link to={`/inventory/details/${id}`}><button>détails</button></Link> </div>
                </div>
            </div>
        </>
    );
}
//Component for inventory detail
export function MinifigureList({data:{id,name,icon,instructions,quantity,bricks}}:MinifigureProps){
    /*const [bricks_list, setBricks] = useState([]);
    useEffect(()=>{fetch('http://localhost:8080/elements/bricks').then(res => res.json()).then(setBricks)},[]);*/
    return(
        <>
            <div style={{display: "flex", flexDirection: "row"}}>
                <div style={{display: "flex", flexDirection: "row"}}>
                    <img src={icon}/>
                    <h4 id={id}>{name}</h4>
                    <div style={{display: "flex", flexDirection: "row"}}>contains {bricks.length} bricks</div>
                    <div>quantity: {quantity}</div>
                    <div><Link to={instructions} target='_blank'>Instructions</Link></div>
                </div>
                <div style={{width: '100%'}}>{bricks.map(brick => <Bricklist key={brick['id']} data={brick}/>)}</div>
            </div>
        </>
    );
}
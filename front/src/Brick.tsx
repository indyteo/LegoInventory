import React, {useState} from "react";
import {Base} from "./Base";

//base + couleur
/*let element = {
    id:'str354',
    name:"une brique",
    link: "alink.fr",
    icon: "icon.png"
}*/
interface BrickProps{
    data: {
        id:string;
        name:string;
        link:string;
        icon:string;
        color:string;
    };

}
//Component for catalogue
export function Brick({data:{id,name,link,icon,color}}:BrickProps){
    return(
        <>
            <Base key={id} data={{id,name,link,icon}}/>
            <p>{color}</p>
        </>
    )
}
//Component for inventory detail
export function Bricklist({data:{id,name,icon,color}}:BrickProps){
    return(
        <>

            <div style={{display: "flex", flexDirection: "row"}}>
                <div style={{display: "flex", flexDirection: "row"}}>
                    <img src={icon}/>
                    <h4 id={id}>{name}</h4>
                    <div style={{display: "flex", flexDirection: "row"}}><div style={{width:2,height:2,backgroundColor:color}}></div> {color}</div>
                </div>

            </div>

        </>
    )
}

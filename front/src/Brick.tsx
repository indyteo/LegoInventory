import {useState} from "react";
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

export function Brick({data:{id,name,link,icon,color}}:BrickProps){
    return(
        <>
            <Base key={id} data={{id,name,link,icon}}/>
            <p>{color}</p>
        </>
    )
}


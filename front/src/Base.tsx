import {useState} from "react";
//element base qui contient img, name, link
/*let element = {
    id:'str354',
    name:"une brique",
    link: "alink.fr",
    icon: "icon.png"
}*/
interface BaseProps{

    data: {
        id:string;
        name:string;
        link:string;
        icon:string;
    };
}
export function Base({data:{id,name,link,icon}}:BaseProps){
    return(
        <>
            <a href={link} target="_blank"><h1 id={id}>{name}</h1></a>
                <img src={icon}/>
        </>
    )
}



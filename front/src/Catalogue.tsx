import {Brick,Bricklist} from "./Brick";
import React, {useEffect, useState} from "react";
import {FlameGraphTest} from "./FlameGraphTest";

export default function Catalogue(){
    const [bricks, setBricks] = useState([]);
    const [page, setPage] = useState(1);
    useEffect(()=>{
        fetch(`http://localhost:8080/elements/bricks?page=${page}`).then(res=>res.json()).then(setBricks);
    },[page])
    return(
        <div style={{alignContent:"center"}}>
            <h1>Catalogue des pièces</h1>
            {/*@ts-ignore*/}
            {bricks.map(brick => <Brick key={brick.id} data={brick}/>)}
            <div style={{width:"300px",alignContent:"center", display:"flex", flexWrap:"nowrap", paddingBottom:"10px", textAlign:"center",marginLeft:"560px"}}>
                <button onClick={() => setPage(p=>p - 1)} disabled={page==1}>Previous page</button>
                <div style={{marginLeft:"10px",marginRight:"10px"}}>Page {page}</div>
                <button onClick={() => setPage(p=>p + 1)}>Next page</button>
            </div>
    </div>
    )
}
import {Brick, Bricklist} from './Brick';
import {Minifigure, MinifigureList} from './Minifigure';
import React from "react";
import {Link} from "react-router-dom";

interface SetListProps{
    data: {

        bricks: [],
        minifigures:[]
    };

}
// @ts-ignore
export function Set(content){
   return(
       <div>
           <div style={{width: '100%'}}>{/*TODO apply css with classes*/}
               <img src={content.icon}/>
               <div>
                   <h3 id={content.id}>{content.name}</h3>
                   <p>quantity {content.quantity}</p>
                   <div><Link to={content.instructions} target='_blank'>Instructions</Link></div>
               </div>
               <div><Link to='/inventory/details/:id'>
                   <button>détails</button>
               </Link></div>
           </div>
       </div>
   );
}

export function SetList({data: {bricks, minifigures}}: SetListProps) {
    return (
        <div className='SetList'>
            <h1>Briques ({bricks.length})</h1>
            <div>{bricks.map(brick => <Bricklist key={brick['id']} data={brick}/>)}</div>
            <h1>Minifigures ({minifigures.length})</h1>
            <div>{minifigures.map(minifigure => <MinifigureList key={minifigure['id']} data={minifigure}/>)}</div>
        </div>

    );

}
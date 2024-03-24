import React, { useEffect, useState } from "react";
import { Brick, BrickColor, BricksList, Minifigure, Set } from "./Element";
import { Link, useParams } from "react-router-dom";
import { api } from "./utils";
import {
  CatalogBricksType,
  CatalogBrickType,
  CatalogMinifiguresType,
  CatalogMinifigureType,
  CatalogSetsType, CatalogSetType
} from "./types";

export default function Catalog() {
  return (
    <div>
      <div>
        <Link to="/catalog/brick">List of bricks</Link>
      </div>
      <div>
        <Link to="/catalog/minifigure">List of minifigures</Link>
      </div>
      <div>
        <Link to="/catalog/set">List of sets</Link>
      </div>
    </div>
  );
}

interface CatalogItemsPropsGeneric<T, I> {
  type: T;
  renderItem: (item: I) => React.ReactNode;
}

type CatalogItemsProps = CatalogItemsPropsGeneric<"bricks", CatalogBricksType>
  | CatalogItemsPropsGeneric<"minifigures", CatalogMinifiguresType>
  | CatalogItemsPropsGeneric<"sets", CatalogSetsType>;

function CatalogItems({ type, renderItem }: CatalogItemsProps) {
  const [ items, setItems ] = useState<any[]>();
  const [ page, setPage ] = useState(1);

  useEffect(() => {
    api<any[]>(`/elements/${type}?page=${page}`).then(setItems);
  }, [ type, page ]);

  if (items === undefined)
    return null;
  return (
    <div>
      <Link to="/catalog">Back</Link>
      <h1>List of {type}</h1>
      {items.map(renderItem)}
      <div
        style={{
          marginTop: "35px",
          justifyContent: "center",
          display: "flex",
          flexWrap: "nowrap",
          textAlign: "center"
        }}
      >
        <button onClick={() => setPage(p => p - 1)} disabled={page === 1}>Previous page</button>
        <div style={{ marginLeft: "10px", marginRight: "10px" }}>Page {page}</div>
        <button onClick={() => setPage(p => p + 1)}>Next page</button>
      </div>
    </div>
  );
}

export function CatalogBricks() {
  return (
    <CatalogItems type="bricks" renderItem={brick => (
      <div key={brick.id}>
        <Brick data={brick} />
        <div>Produced in colors:</div>
        {brick.colors.map(color => <div key={color.id}><BrickColor color={color} /> {color.name}</div>)}
      </div>
    )} />
  );
}

export function CatalogMinifigures() {
  return (
    <CatalogItems type="minifigures" renderItem={minifigure => (
      <div key={minifigure.id}>
        <Minifigure data={minifigure} />
        <div>Pieces: {minifigure.pieces}</div>
      </div>
    )} />
  );
}

export function CatalogSets() {
  return (
    <CatalogItems type="sets" renderItem={set => (
      <div key={set.id}>
        <Set data={set} />
        <div>Pieces: {set.pieces}</div>
        <div>Minifigures: {set.minifigures}</div>
      </div>
    )} />
  );
}

export function CatalogBrick() {
  const { id } = useParams();
  const [ brick, setBrick ] = useState<CatalogBrickType>();

  useEffect(() => {
    api<CatalogBrickType>(`/elements/bricks/${id}`).then(setBrick);
  }, [ id ]);

  if (brick === undefined)
    return null;
  return (
    <div>
      <Link to="/catalog/brick">Back</Link>
      <h1>{brick.name}</h1>
      <p>Brick ID: {brick.id}</p>
      <div>
        <img src={brick.image} alt={brick.name} />
      </div>
      <a href={brick.link} target="_blank">See on BrickLink.com</a>
      <hr />
      {brick.colors.length > 0 && (
        <>
          <div>Produced in colors:</div>
          {brick.colors.map(color => <div key={color.id}><BrickColor color={color} /> {color.name}</div>)}
          <hr />
        </>
      )}
      <div>Part of elements:</div>
      {brick.isPartOf.map(part => (
        <div key={part.element.id}>
          {part.element.type === "M" ? <Minifigure data={part.element} /> : <Set data={part.element} />}
          <div>Quantity: {part.quantity}</div>
          {part.details.map(detail => (
            <div key={detail.color?.id ?? part.element.id}>
              {detail.quantity} {detail.color === null ? "with no color specified" : (
                <>in <BrickColor color={detail.color!} /> {detail.color!.name}</>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function CatalogMinifigure() {
  const { id } = useParams();
  const [ minifigure, setMinifigure ] = useState<CatalogMinifigureType>();

  useEffect(() => {
    api<CatalogMinifigureType>(`/elements/minifigures/${id}`).then(setMinifigure);
  }, [ id ]);

  if (minifigure === undefined)
    return null;
  return (
    <div>
      <Link to="/catalog/minifigure">Back</Link>
      <h1>{minifigure.name}</h1>
      <p>Minifigure ID: {minifigure.id}</p>
      <div>
        <img src={minifigure.image} alt={minifigure.name} />
      </div>
      <a href={minifigure.link} target="_blank">See on BrickLink.com</a>
      <hr />
      <div>Pieces: ({minifigure.pieces.reduce((total, part) => total + part.quantity, 0)})</div>
      <BricksList data={minifigure.pieces} />
      <hr />
      <div>Part of elements:</div>
      {minifigure.isPartOf.map(part => (
        <div key={part.set.id}>
          <Set data={part.set} />
          <div>Quantity: {part.quantity}</div>
        </div>
      ))}
    </div>
  );
}

export function CatalogSet() {
  const { id } = useParams();
  const [ set, setSet ] = useState<CatalogSetType>();

  useEffect(() => {
    api<CatalogSetType>(`/elements/sets/${id}`).then(setSet);
  }, [ id ]);

  if (set === undefined)
    return null;
  return (
    <div>
      <Link to="/catalog/set">Back</Link>
      <h1>{set.name}</h1>
      <p>Set ID: {set.id}</p>
      <div>
        <img src={set.image} alt={set.name} />
      </div>
      <a href={set.link} target="_blank">See on BrickLink.com</a>
      <hr />
      <div>Minifigures: ({set.minifigures.reduce((total, part) => total + part.quantity, 0)})</div>
      {set.minifigures.map(part => (
        <div key={part.minifigure.id}>
          <Minifigure data={part.minifigure} />
          <div>Quantity: {part.quantity}</div>
        </div>
      ))}
      <hr />
      <div>Pieces: ({set.pieces.reduce((total, part) => total + part.quantity, 0)})</div>
      <BricksList data={set.pieces} />
    </div>
  );
}

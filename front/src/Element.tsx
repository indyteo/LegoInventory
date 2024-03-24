import { Link } from "react-router-dom";
import { BrickPart, Color, ElementType } from "./types";

interface ElementProps {
  data: ElementType;
  type: "brick" | "minifigure" | "set";
}

export function Element({ data, type }: ElementProps) {
  return (
    <div>
      <Link to={`/catalog/${type}/${data.id}`}>
        <h1>{data.name}</h1>
      </Link>
      <div>
        <img src={data.icon} alt={data.name} />
      </div>
      <a href={data.link} target="_blank" rel="noreferrer">See on BrickLink.com</a>
    </div>
  )
}

interface SetProps extends Omit<ElementProps, "type"> {}

export function Set({ data }: SetProps) {
  return (
    <div>
      <Element data={data} type="set" />
      <a href={data.instructions} target="_blank" rel="noreferrer">Instructions PDF</a>
    </div>
  );
}

interface MinifigureProps extends Omit<ElementProps, "type"> {}

export function Minifigure({ data }: MinifigureProps) {
  return <Element data={data} type="minifigure" />;
}

interface BrickProps extends Omit<ElementProps, "type"> {
  color?: Color | null;
}

export function Brick({ data, color }: BrickProps) {
  return (
    <div>
      <Element data={data} type="brick" />
      {color ? <div>Color: {color?.name} <BrickColor color={color} /></div> : null}
    </div>
  );
}

interface BrickColorProps {
  color: Color;
}

export function BrickColor({ color }: BrickColorProps) {
  return (
    <div style={{
      display: "inline-block",
      width: "15px",
      height: "15px",
      backgroundColor: `#${color.value.toString(16).padStart(6, "0")}`,
      border: "1px solid white",
      borderRadius: "5px"
    }}></div>
  );
}

interface BricksListProps {
  data: BrickPart[];
}

export function BricksList({ data }: BricksListProps) {
  return (
    <div>
      {data.map(part => (
        <div key={`${part.brick.id}/${part.color?.id ?? ""}`}>
          <Brick data={part.brick} color={part.color} />
          <div>Quantity: {part.quantity}</div>
        </div>
      ))}
    </div>
  );
}

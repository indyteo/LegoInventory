import { scrap, ScrapableElement } from "./scraping";
import { getInstructions, legoIdFromBrickLinkId } from "./lego";

export type ElementType = "S" | "M";

export interface BaseElement {
  id: string;
  name: string;
  link: string;
  icon: string;
}

export interface CatalogItem extends BaseElement {
  image: string;
  source: string;
  type: ElementType;
  instructions: string | null;
  category: Category["id"];
  bricks: Brick[];
  minifigures: Minifigure[];
}

export interface QuantifiedElement extends BaseElement {
  quantity: number;
}

export interface Brick extends QuantifiedElement {
  image: string;
  color: Color["id"];
}

export interface Minifigure extends QuantifiedElement {
  image: string;
}

export interface Color {
  id: number;
  name: string;
  value: number;
  type: string;
}

export interface Category {
  id: string;
  name: string;
  link: string;
  parent: Category["id"] | null;
}

export async function getCatalogItem(type: ElementType, id: string): Promise<CatalogItem | null> {
  let page;
  try {
    page = await scrap(`https://www.bricklink.com/catalogItemInv.asp?${type}=${id}&viewType=P&sortBy=0&sortAsc=A&bt=0`);
  } catch {
    return null;
  }
  const root = page.getElement("//html/body/center/table[1]/tbody/tr/td/table[2]/tbody/tr/td/center");
  if (root === null)
    return null;

  const colors = await getColors();

  const name = root.getString("./font/b");
  const icon = root.getURL("./p/font/a/img/@src");
  const image = `"https://www.bricklink.com/${type}L/${id}.jpg"`;
  const link = `https://www.bricklink.com/v2/catalog/catalogitem.page?${type}=${id}`;
  const source = root.getString("./form/p[.//text()=\"Source:\"]/font/text()");
  const instructions = type === "S" ? await getInstructions(legoIdFromBrickLinkId(id)) : null;
  const category = page.getURL("//html/body/center/table[1]/tbody/tr/td/table[1]/tbody/tr/td/table/tbody/tr/td[1]/b/font/a[last()-1]/@href", true).searchParams.get("catString")!;

  const content = root.getElements("./form/table[1]/tbody/tr");
  const bricks = [];
  let i;
  for (i = 3; i < content.length; i++) {
    const brick = content[i];
    if (brick.hasElement("./td[@colspan=\"5\"]"))
      break;
    const data = parseElement(brick);
    const colorId = parseInt(new URL(data.link).searchParams.get("idColor") ?? "0");
    const image = `https://img.bricklink.com/ItemImage/PN/${colorId}/${data.id}.png`;
    const color = colors.find(color => color.id === colorId);
    if (color && data.name.startsWith(color.name))
      data.name = data.name.substring(color.name.length + 1);
    bricks.push({ ...data, image, color: colorId });
  }
  const minifigures = [];
  if (i < content.length && content[i].hasElement("./*[.//text()=\"Minifigures:\"]")) {
    for (i++; i < content.length; i++) {
      const minifigure = content[i];
      if (minifigure.hasElement("./td[@colspan=\"5\"]"))
        break;
      const data = parseElement(minifigure);
      const image = `https://www.bricklink.com/ML/${data.id}.jpg`;
      minifigures.push({ ...data, image });
    }
  }
  return { id, name, icon, image, link, source, type, instructions, category, bricks, minifigures };
}

function parseElement(element: ScrapableElement): QuantifiedElement {
  const id = element.getString("./td[3]/a");
  const name = element.getString("./td[4]/b");
  const quantity = element.getInteger("./td[2]");
  const link = element.getURL("./td[3]/a/@href");
  const icon = element.getURL("./td[1]/b/a/img/@src");
  return { id, name, quantity, link, icon };
}

export async function getColors(): Promise<Color[]> {
  const page = await scrap("https://www.bricklink.com/catalogColors.asp");
  return page.getElements("//html/body/div[2]/center/table/tbody/tr/td/table[position()>1 and @cellspacing=\"0\"]/tbody/tr/td/center/table/tbody/tr[position()>1]").map(color => ({
    id: color.getInteger("./td[1]/font"),
    name: color.getString("./td[4]/font"),
    value: parseInt(color.getString("./td[2]/@bgcolor"), 16),
    type: color.getString("(./td/preceding::table)[1]").slice(0, -" Colors".length)
  }));
}

export async function getCategories(): Promise<Category[]> {
  const page = await scrap("https://www.bricklink.com/catalogTree.asp?itemType=S");
  return page.getElements("//html/body/div[2]/center/table/tbody/tr/td/table/tbody/tr[3]/td/table/tbody/tr/td/table/tbody/tr[2]//a[text()!=\"{}\" and contains(@href,\"catString=\")]").map(category => {
    const url = category.getURL("./@href", true);
    const id = url.searchParams.get("catString")!;
    const dot = id.lastIndexOf(".");
    return {
      id,
      name: category.getString("."),
      link: url.href,
      parent: dot === -1 ? null : id.substring(0, dot)
    };
  });
}

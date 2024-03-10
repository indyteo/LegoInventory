import { DOMWindow, JSDOM } from "jsdom";
import { HeadersInit } from "node-fetch";

export class ScrapableElement {
  private readonly dom: JSDOM;
  public readonly node: Node;
  public readonly parent?: ScrapableElement;

  constructor(dom: JSDOM, node?: Node, parent?: ScrapableElement) {
    this.dom = dom;
    this.node = node ?? this.document;
    this.parent = parent;
  }

  public get window(): DOMWindow {
    return this.dom.window;
  }

  public get document(): Document {
    return this.window.document;
  }

  public get root(): ScrapableElement {
    return this.parent ? this.parent.root : this;
  }

  public xpath(xpath: string, type: number): XPathResult {
    return this.document.evaluate(xpath, this.node, null, type);
  }

  public getElement(xpath: string): ScrapableElement | null {
    const node = this.xpath(xpath, this.window.XPathResult.FIRST_ORDERED_NODE_TYPE).singleNodeValue;
    return node === null ? null : new ScrapableElement(this.dom, node, this);
  }

  public getElements(xpath: string): ScrapableElement[] {
    const nodes = this.xpath(xpath, this.window.XPathResult.ORDERED_NODE_ITERATOR_TYPE);
    const elements = [];
    let node;
    while (node = nodes.iterateNext())
      elements.push(new ScrapableElement(this.dom, node, this));
    return elements;
  }

  public hasElement(xpath: string): boolean {
    return this.xpath(xpath, this.window.XPathResult.ANY_UNORDERED_NODE_TYPE).singleNodeValue !== null;
  }

  public getString(xpath: string, trim: boolean = true): string {
    const value = this.xpath(xpath, this.window.XPathResult.STRING_TYPE).stringValue;
    return trim ? value.trim() : value;
  }

  public getURL(xpath: string, raw?: false): string;
  public getURL(xpath: string, raw?: true): URL;
  public getURL(xpath: string, raw = false): string | URL {
    const url = new URL(this.getString(xpath), this.node.baseURI);
    return raw ? url : url.href;
  }

  public getInteger(xpath: string): number {
    return parseInt(this.getString(xpath));
  }
}

export async function request(url: string, method?: string, body?: RequestInit["body"], headers?: HeadersInit, json?: false): Promise<string>;
export async function request<T>(url: string, method?: string, body?: RequestInit["body"], headers?: HeadersInit, json?: true): Promise<T>;
export async function request(url: string, method = "GET", body?: RequestInit["body"], headers?: HeadersInit, json = false): Promise<string | any> {
  const res = await fetch(url, {
    method,
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0",
      ...(json ? { "Content-Type": "application/json", "Accept": "application/json" } : {}),
      ...headers
    },
    body,
    redirect: "manual"
  });
  if (!res.ok)
    throw { name: "HTTP Error", message: `Excepted HTTP response to be 200 OK, got ${res.status} ${res.statusText} instead!`, res };
  return await (json ? res.json() : res.text());
}

export async function scrap(url: string): Promise<ScrapableElement> {
  return new ScrapableElement(new JSDOM(await request(url), { url }));
}

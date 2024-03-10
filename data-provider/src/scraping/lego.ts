import { request, scrap } from "./scraping";

export async function getInstructions(id: string): Promise<string | null> {
  const page = await scrap("https://www.lego.com/fr-fr/service/buildinginstructions/" + id);
  const scriptSrc = page.getString("//html/head/script[starts-with(@src, \"https://www.lego.com/service/dist/scripts.min.min.\")]/@src");
  const scriptText = await request(scriptSrc);
  const match = scriptText.match(/\{headers:\{"x-api-key":"([^"]+)"}}/);
  if (match === null)
    return null;
  const apiKey = match[1];
  const response = await request<{
    hits?: {
      hits?: [
        {
          _source?: {
            product_versions?: [
              {
                building_instructions?: [
                  {
                    file?: {
                      url?: string;
                    }
                  }
                ]
              }
            ]
          }
        }
      ]
    }
  }>("https://services.slingshot.lego.com/api/v4/lego_historic_product_read/_search", "POST", JSON.stringify({
    "_source": [
      "product_number",
      "locale.fr-fr",
      "locale.en-us",
      "market.fr.skus.item_id",
      "market.us.skus.item_id",
      "availability",
      "themes",
      "product_versions",
      "assets"
    ],
    "from": 0,
    "query": {
      "bool": {
        "filter": [],
        "must": [
          {
            "term": {
              "product_number": id
            }
          }
        ],
        "should": []
      }
    },
    "size": 1
  }), { "x-api-key": apiKey }, true);
  return response?.hits?.hits?.[0]?._source?.product_versions?.[0]?.building_instructions?.[0]?.file?.url ?? null;
}

export function legoIdFromBrickLinkId(id: string): string {
  return id.split("-", 1)[0];
}

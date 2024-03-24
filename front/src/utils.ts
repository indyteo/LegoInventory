export const apiURL = process.env.REACT_APP_API_URL || "/api";

export async function api<T>(url: string, method: "GET" | "POST" | "DELETE" = "GET", body?: any): Promise<T> {
  const res = await fetch(apiURL + url, {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json"
    }
  });
  return method === "DELETE" ? undefined : res.json();
}

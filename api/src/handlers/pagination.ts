import { Request } from "express";
import { readDatabaseOne } from "shared";

export type PaginationQuery<Q extends {} = {}> = Q & {
  page: string;
  count: string;
};

export type PaginatedRequest<T = any, Q extends {} = {}> = Request<T, any, any, PaginationQuery<Q>>;

export interface PaginationParams {
  page: number;
  count: number;
  total: number;
  pageMax: number;
  limit: number;
  skip: number;
}

export async function computePaginationParams(req: PaginatedRequest, cypherTotal: string, params?: Record<string, any>): Promise<PaginationParams | null> {
  const count = parseInt((req.query.count || "10") as string);
  const page = parseInt((req.query.page || "1") as string);
  if (count < 1 || count > 50 || page < 1)
    return null;
  const res = await readDatabaseOne(tx => tx.run<{ total: number }>(cypherTotal, params));
  if (res === null || !res.has("total"))
    return null;
  const total = res.get("total");
  const pageMax = total === 0 ? 1 : Math.ceil(total / count);
  if (page > pageMax)
    return null;
  return { page, count, total, pageMax, limit: count, skip: (page - 1) * count };
}

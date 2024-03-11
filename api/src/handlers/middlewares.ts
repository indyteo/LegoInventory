import { Request, Response, NextFunction } from "express";

export function logBefore(req: Request, _res: Response, next: NextFunction): void {
  console.log(`${req.method} ${req.url}`);
  console.group();
  next();
}

export function logAfter(_req: Request, _res: Response, next: NextFunction): void {
  console.groupEnd();
  next();
}

import { Request, Response, NextFunction } from "express";

interface StartTimeLocals {
  start: number;
}

export function logBefore(req: Request, res: Response<any, StartTimeLocals>, next: NextFunction): void {
  console.log(`${req.method} ${req.url}`);
  console.group();
  res.locals.start = Date.now();
  next();
}

export function logAfter(_req: Request, res: Response<any, StartTimeLocals>, next: NextFunction): void {
  const end = Date.now();
  console.log(`${res.statusCode} ${res.statusMessage} in ${end - res.locals.start}ms`);
  console.groupEnd();
  next();
}

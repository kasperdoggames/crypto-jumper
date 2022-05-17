import { Request, Response, NextFunction } from "express";

export default (req: Request, res: Response, next: NextFunction) => {
  if (
    process.env.NODE_ENV === "production" &&
    req.headers["x-forwarded-proto"] !== "https"
  ) {
    return res.redirect(["https://", req.hostname, req.url].join(""));
  }
  return next();
};

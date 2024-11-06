import * as dotenv from "dotenv";
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

dotenv.config();

/* This function checks the authentication of a token; if invalid, it shows an error message */
export default function authenticateJWT(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  const jwtSecret = process.env.JWT_SIGN_SECRET;

  if (!jwtSecret) {
    console.error("JWT secret is undefined");
    return res.status(500).send("Internal server error: JWT secret is missing");
  }

  if (authHeader) {
    const token = authHeader.split(" ")[1];
    jwt.verify(token, jwtSecret, (err: unknown) => {
      if (err) {
        if (err instanceof Error) {
          console.log("JWT verification error:", err.message);
        }
        return res.sendStatus(403);
      }
      next();
    });
  } else {
    res.sendStatus(401);
  }
}

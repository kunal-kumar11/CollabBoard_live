import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const SECRET = "collab_it";

export type UserPayload = {
  email: string;
  name: string;
  isAdmin: boolean;
};

export type AuthRequest = Request & {
  user: UserPayload;
};

function verifyToken(
  req: Request,              // ✅ normal Request
  res: Response,
  next: NextFunction
) {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Token missing" });
  }

  try {
    const decoded = jwt.verify(token, SECRET);

    if (
      typeof decoded === "string" ||
      !decoded ||
      typeof decoded !== "object"
    ) {
      return res.status(403).json({ error: "Invalid token" });
    }

    const user = {
      email: String(decoded.email),
      name: String(decoded.name),
      isAdmin: Boolean(decoded.isAdmin),
    };

    (req as AuthRequest).user = user;

    next();
  } catch (err) {
    return res.status(403).json({ error: "Invalid token" });
  }
}

export default verifyToken;
import type { Request, Response, NextFunction, RequestHandler } from "express";
import { verifyToken, clerkClient } from "@clerk/express";

export interface AuthenticatedRequest extends Request {
  userId?: string;
  userEmail?: string;
}

export const isAuthenticated: RequestHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.replace("Bearer ", "");

    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
    });

    if (!payload.sub) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await clerkClient.users.getUser(payload.sub);

    req.userId = payload.sub;
    req.userEmail = user.emailAddresses?.[0]?.emailAddress;

    next();
  } catch (error) {
    console.error("Auth error:", error);
    return res.status(401).json({ message: "Unauthorized" });
  }
};

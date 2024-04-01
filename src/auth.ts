import { prisma } from ".";
import { NextFunction, Request, Response } from "express";
import { hashSync, compareSync } from "bcrypt";

import { sign, verify, decode } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "tanmay";

const generateToken = (payload: any): string => {
  return sign(payload, JWT_SECRET, { expiresIn: "1h" });
};

const verifyToken = (token: string): any => {
  return verify(token, JWT_SECRET);
};

const decodeToken = (token: string): any => {
  return decode(token);
};

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = decodeToken(req.cookies.token);
    if (token.userId) {
      const user = await prisma.user.findUnique({
        where: { id: token.userId },
      });

      if (user) {
        req.body.user = user;
        next();
      } else {
        res.status(500).json({ data: {}, message: "Unauthorized" });
      }
    } else {
      res.status(500).json({ data: {}, message: "Unauthorized" });
    }
  } catch (error) {
    console.error("JTWLogin error:", error);
    res.status(500).json({ data: {}, message: "Internal Server Error" });
  }
};

export const JWTlogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = decodeToken(req.cookies.token);
    if(!token) console.log("No Token Found")
    if (token.userId) {
      const user = await prisma.user.findUnique({
        where: { id: token.userId },
      });

      if (user) {
        res.status(200).json({ data: user, message: "User Logged In" });
      } else {
        res.status(500).json({ data: {}, message: "User Not Found" });
      }
    } else {
      res.status(500).json({ data: {}, message: "JWT corupted" });
    }
  } catch (error) {
    console.error("JTWLogin error:", error);
    res.status(500).json({ data: {}, message: "Internal Server Error" });
  }
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, username, password } = req.body;

    const user = await prisma.user.create({
      data: { email, name, username, password: hashSync(password, 10) },
    });

    if (user) {
      // Generate token
      const token = generateToken({ username: user.username, userId: user.id });

      // Set token in cookie
      res.cookie("token", token);

      res.status(200).json({ data: user, message: "User Created" });
    } else {
      res.status(500).json({ data: {}, message: "User Creation Failed" });
    }
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ data: {}, message: "Internal Server Error" });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;

    // Authenticate user (example)
    const user = await prisma.user.findUnique({ where: { username } });

    // If User Not Found
    if (!user) {
      res.status(401).json({ data: {}, message: "User Not Found" });
      return;
    }

    // Compare Password
    if (!compareSync(password, user.password)) {
      res.status(401).json({ data: {}, message: "Invalid Password" });
      return;
    }

    // Generate token
    const token = generateToken({ username: user.username, userId: user.id });

    // Set token in cookie
    res.cookie("token", token);

    res.status(200).json({ data: user, message: "User Logged In" });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ data: {}, message: "Internal Server Error" });
  }
};

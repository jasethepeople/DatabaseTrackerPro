import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { storage } from "../storage";
import type { User, InsertUser } from "@shared/schema";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const SALT_ROUNDS = 12;

export interface AuthService {
  register(userData: InsertUser): Promise<{ user: Omit<User, 'password'>, token: string }>;
  login(username: string, password: string): Promise<{ user: Omit<User, 'password'>, token: string }>;
  verifyToken(token: string): Promise<User | null>;
}

class AuthServiceImpl implements AuthService {
  async register(userData: InsertUser): Promise<{ user: Omit<User, 'password'>, token: string }> {
    // Check if user already exists
    const existingUser = await storage.getUserByUsername(userData.username);
    if (existingUser) {
      throw new Error("Username already exists");
    }

    const existingEmail = await storage.getUserByEmail(userData.email);
    if (existingEmail) {
      throw new Error("Email already exists");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, SALT_ROUNDS);

    // Create user
    const user = await storage.createUser({
      ...userData,
      password: hashedPassword,
    });

    // Generate token
    const token = this.generateToken(user.id);

    // Remove password from response
    const { password, ...userWithoutPassword } = user;

    return { user: userWithoutPassword, token };
  }

  async login(username: string, password: string): Promise<{ user: Omit<User, 'password'>, token: string }> {
    // Find user
    const user = await storage.getUserByUsername(username);
    if (!user) {
      throw new Error("Invalid credentials");
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new Error("Invalid credentials");
    }

    // Generate token
    const token = this.generateToken(user.id);

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return { user: userWithoutPassword, token };
  }

  async verifyToken(token: string): Promise<User | null> {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
      const user = await storage.getUser(decoded.userId);
      return user || null;
    } catch (error) {
      return null;
    }
  }

  private generateToken(userId: number): string {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
  }
}

export const authService = new AuthServiceImpl();

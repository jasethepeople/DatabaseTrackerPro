import bcrypt from "bcrypt";
import { storage } from "../storage.js";

async function createDemoUser() {
  try {
    // Check if demo user already exists
    const existingUser = await storage.getUserByUsername("demo");
    if (existingUser) {
      console.log("Demo user already exists");
      return;
    }

    // Create demo user
    const hashedPassword = await bcrypt.hash("demo123", 10);
    const demoUser = await storage.createUser({
      username: "demo",
      email: "demo@localreplit.com",
      passwordHash: hashedPassword,
    });

    console.log("Demo user created successfully:", {
      username: demoUser.username,
      email: demoUser.email,
      id: demoUser.id
    });
  } catch (error) {
    console.error("Error creating demo user:", error);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createDemoUser().then(() => process.exit(0));
}
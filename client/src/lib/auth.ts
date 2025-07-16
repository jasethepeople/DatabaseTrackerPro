import { apiRequest } from "./queryClient";

interface LoginResponse {
  user: {
    id: number;
    username: string;
    email: string;
  };
  token: string;
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

export const auth = {
  async login(username: string, password: string): Promise<LoginResponse> {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new AuthError(error.message || "Login failed");
    }
    
    const data = await response.json();
    localStorage.setItem("auth_token", data.token);
    console.log("Token stored in localStorage:", data.token);
    return data;
  },

  async register(username: string, email: string, password: string): Promise<LoginResponse> {
    const response = await apiRequest("POST", "/api/auth/register", {
      username,
      email,
      password,
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new AuthError(error.message || "Registration failed");
    }
    
    const data = await response.json();
    localStorage.setItem("auth_token", data.token);
    return data;
  },

  async getCurrentUser() {
    const token = this.getToken();
    if (!token) {
      console.log("No token found");
      return null;
    }

    try {
      const response = await fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.log("Auth me failed:", response.status);
        this.logout();
        return null;
      }

      const user = await response.json();
      console.log("getCurrentUser returning:", user);
      return user;
    } catch (error) {
      console.error("getCurrentUser error:", error);
      this.logout();
      return null;
    }
  },

  getToken(): string | null {
    return localStorage.getItem("auth_token");
  },

  logout(): void {
    localStorage.removeItem("auth_token");
    window.location.href = "/login";
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },
};

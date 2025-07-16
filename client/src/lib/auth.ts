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
    const response = await apiRequest("POST", "/api/auth/login", {
      username,
      password,
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new AuthError(error.message || "Login failed");
    }
    
    const data = await response.json();
    localStorage.setItem("auth_token", data.token);
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
    if (!token) return null;

    try {
      const response = await fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        this.logout();
        return null;
      }

      return await response.json();
    } catch (error) {
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

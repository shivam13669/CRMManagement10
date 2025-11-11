// API utility functions for making HTTP requests to the backend
import { ChangePasswordRequest, ChangePasswordResponse } from "@shared/api";

const API_BASE = "/api";

interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

// Helper function to get auth token from localStorage
function getAuthToken(): string | null {
  return localStorage.getItem("authToken");
}

// Helper function to make authenticated requests
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  try {
    const token = getAuthToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    let data;
    try {
      // Get the response text first, then try to parse it
      let text = "";
      try {
        text = await response.text();
      } catch (readError) {
        // If response body was already read, try using json() as fallback
        if (
          readError instanceof TypeError &&
          readError.message.includes("body stream")
        ) {
          try {
            data = await response.json();
          } catch {
            // Both text and json failed, return error
            return {
              error: !response.ok
                ? `Request failed with status ${response.status}`
                : "Failed to read response body",
            };
          }
        } else {
          throw readError;
        }
      }

      if (!data) {
        if (!text) {
          data = { message: "No response content" };
        } else {
          // Try to parse as JSON, fallback to text
          try {
            data = JSON.parse(text);
          } catch {
            // If JSON parsing fails, treat as plain text
            data = { message: text };
          }
        }
      }
    } catch (parseError) {
      console.error("Failed to parse response:", parseError);
      return {
        error: !response.ok
          ? `Request failed with status ${response.status}`
          : "Invalid response format",
      };
    }

    if (!response.ok) {
      return {
        error:
          data?.error ||
          data?.message ||
          `Request failed with status ${response.status}`,
        data: data, // Pass additional error details like status, type etc.
      };
    }

    return { data };
  } catch (error) {
    console.error("API request error:", error);
    return { error: "Network error occurred" };
  }
}

// Authentication API
export interface RegisterData {
  username: string;
  email: string;
  password: string;
  role: "admin" | "doctor" | "customer" | "staff";
  full_name: string;
  phone?: string;
  // Customer specific fields
  date_of_birth?: string;
  gender?: "male" | "female" | "other";
  blood_group?: string;
  address?: string;
  emergency_contact?: string;
  emergency_contact_name?: string;
  emergency_contact_relation?: string;
  allergies?: string;
  medical_conditions?: string;
  current_medications?: string;
  insurance?: string;
  insurance_policy_number?: string;
  occupation?: string;
  // Doctor specific fields
  specialization?: string;
  license_number?: string;
  experience_years?: number;
  consultation_fee?: number;
  available_days?: string;
  available_time_start?: string;
  available_time_end?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  full_name: string;
  phone?: string;
}

export const authApi = {
  async register(
    userData: RegisterData,
  ): Promise<ApiResponse<{ user: User; token: string }>> {
    return apiRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  },

  async login(
    loginData: LoginData,
  ): Promise<ApiResponse<{ user: User; token: string }>> {
    return apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify(loginData),
    });
  },

  async hospitalLogin(
    loginData: LoginData,
  ): Promise<ApiResponse<{ user: User; token: string; hospital: any }>> {
    return apiRequest("/hospital/login", {
      method: "POST",
      body: JSON.stringify(loginData),
    });
  },

  async getProfile(): Promise<ApiResponse<{ user: User }>> {
    return apiRequest("/auth/profile");
  },

  async changePassword(
    passwordData: ChangePasswordRequest,
  ): Promise<ApiResponse<ChangePasswordResponse>> {
    return apiRequest("/auth/change-password", {
      method: "POST",
      body: JSON.stringify(passwordData),
    });
  },

  logout(): void {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userName");
    window.location.href = "/login";
  },
};

// Data API
export interface Customer {
  user_id: number;
  full_name: string;
  email: string;
  phone?: string;
  date_of_birth?: string;
  gender?: string;
  blood_group?: string;
  address?: string;
  medical_conditions?: string;
  created_at: string;
}

export interface Doctor {
  user_id: number;
  full_name: string;
  email: string;
  phone?: string;
  specialization?: string;
  experience_years?: number;
  consultation_fee?: number;
  available_days?: string;
}

export interface DashboardStats {
  totalCustomers: number;
  totalDoctors: number;
  todayAppointments: number;
  pendingReports: number;
}

export const dataApi = {
  async getCustomers(): Promise<
    ApiResponse<{ customers: Customer[]; total: number }>
  > {
    return apiRequest("/customers");
  },

  async getDoctors(): Promise<
    ApiResponse<{ doctors: Doctor[]; total: number }>
  > {
    return apiRequest("/doctors");
  },

  async getDashboardStats(): Promise<ApiResponse<{ stats: DashboardStats }>> {
    return apiRequest("/dashboard/stats");
  },
};

// Helper functions for authentication state
export const authUtils = {
  isAuthenticated(): boolean {
    return !!getAuthToken();
  },

  getCurrentUser(): {
    role: string;
    userName: string;
    admin_type?: string | null;
    state?: string | null;
  } | null {
    const role = localStorage.getItem("userRole");
    const userName = localStorage.getItem("userName");
    const admin_type = localStorage.getItem("admin_type");
    const state = localStorage.getItem("state");

    if (role && userName) {
      return {
        role,
        userName,
        admin_type: admin_type || null,
        state: state || null,
      };
    }

    return null;
  },

  setAuthData(token: string, user: User): void {
    // Save token under both keys for compatibility with different pages
    localStorage.setItem("authToken", token);
    localStorage.setItem("token", token);
    localStorage.setItem("userRole", user.role);
    localStorage.setItem("userName", user.full_name);
    // if API returns admin_type or state, persist them
    // @ts-ignore
    if ((user as any).admin_type)
      localStorage.setItem("admin_type", (user as any).admin_type);
    // @ts-ignore
    if ((user as any).state) localStorage.setItem("state", (user as any).state);
  },
  logout(): void {
    localStorage.removeItem("authToken");
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userName");
    localStorage.removeItem("admin_type");
    localStorage.removeItem("state");
    window.location.href = "/login";
  },
};

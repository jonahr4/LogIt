/**
 * Log It — API Client
 * Handles authenticated requests to Vercel API with Firebase token
 */

import { firebaseAuth } from '@/lib/firebase';
import { Config } from '@/constants/config';
import type { ApiError } from '@/types/api';

class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = Config.api.baseUrl;
  }

  private async getAuthHeaders(): Promise<HeadersInit> {
    const user = firebaseAuth.currentUser;
    if (!user) {
      return { 'Content-Type': 'application/json' };
    }
    const token = await user.getIdToken();
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  }

  private async fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), Config.api.timeout || 10000);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal as RequestInit['signal'],
      });
      return response;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new Error('API Request timed out.');
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
      throw errorData as ApiError;
    }
    
    // Some endpoints may return empty 204 responses
    if (response.status === 204) return {} as T;
    
    return response.json();
  }

  async get<T>(path: string, params?: Record<string, string>): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          url.searchParams.set(key, value);
        }
      });
    }

    const headers = await this.getAuthHeaders();
    const response = await this.fetchWithTimeout(url.toString(), {
      method: 'GET',
      headers,
    });

    return this.handleResponse<T>(response);
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    const headers = await this.getAuthHeaders();
    const response = await this.fetchWithTimeout(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  async patch<T>(path: string, body: unknown): Promise<T> {
    const headers = await this.getAuthHeaders();
    const response = await this.fetchWithTimeout(`${this.baseUrl}${path}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(body),
    });

    return this.handleResponse<T>(response);
  }

  async delete<T>(path: string, body?: unknown): Promise<T> {
    const headers = await this.getAuthHeaders();
    const response = await this.fetchWithTimeout(`${this.baseUrl}${path}`, {
      method: 'DELETE',
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    return this.handleResponse<T>(response);
  }
}

export const api = new ApiClient();

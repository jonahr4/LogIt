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
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw error;
    }

    return response.json();
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw error;
    }

    return response.json();
  }

  async patch<T>(path: string, body: unknown): Promise<T> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw error;
    }

    return response.json();
  }

  async delete<T>(path: string): Promise<T> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw error;
    }

    return response.json();
  }
}

export const api = new ApiClient();

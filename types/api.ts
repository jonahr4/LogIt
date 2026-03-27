/**
 * Log It — API Response Types
 */

/** Standard success response wrapper */
export interface ApiResponse<T> {
  data: T;
}

/** Paginated response */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

/** Standard error response (matches API_DESIGN.md) */
export interface ApiError {
  error: {
    code: string;
    message: string;
    status: number;
  };
}

/** Username availability check */
export interface UsernameCheckResponse {
  available: boolean;
  username: string;
}

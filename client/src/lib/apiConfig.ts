/**
 * Configuration for API endpoints based on environment
 */

// Determine if we're in development or production
const isDevelopment = import.meta.env.DEV;

// Base URL for API requests
export const API_BASE_URL = isDevelopment
  ? '' // In development, use relative path (proxied through Vite)
  : 'https://your-api-url.com'; // Replace with your production API URL when deploying

// Function to get the full API URL
export function getApiUrl(endpoint: string): string {
  return `${API_BASE_URL}${endpoint}`;
}
/**
 * Use EXPO_PUBLIC_API_URL for device-specific base URLs.
 * Android emulator: http://10.0.2.2:3000
 * iOS simulator: http://localhost:3000
 * Physical device: your machine LAN IP, e.g. http://192.168.1.10:3000
 */
const envUrl = process.env.EXPO_PUBLIC_API_URL;

export const API_BASE_URL = (envUrl?.replace(/\/$/, '') ||
  'http://localhost:3000') as string;

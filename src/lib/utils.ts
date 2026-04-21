import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Strategy-based LLM Provider Detection
 * Detects provider from key prefix or endpoint
 */
export function detectProvider(apiKey: string, baseUrl?: string): string {
  if (baseUrl?.includes('localhost') || baseUrl?.includes('ollama')) return 'ollama';
  if (apiKey.startsWith('sk-ant-')) return 'anthropic';
  if (apiKey.startsWith('sk-')) return 'openai';
  if (apiKey.startsWith('gsk_')) return 'groq';
  // Add more patterns as needed
  return 'unknown';
}

import { GoogleGenAI } from "@google/genai";

export type LLMProvider = 'openai' | 'anthropic' | 'google' | 'groq' | 'mistral' | 'cohere' | 'perplexity' | 'ollama' | 'azure';

export interface LLMConfig {
  provider: LLMProvider;
  model: string;
  apiKey: string;
  baseUrl?: string;
  apiVersion?: string;
  settings?: {
    temperature?: number;
    maxTokens?: number;
    [key: string]: any;
  };
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export class LLMClient {
  private config: LLMConfig;

  constructor(config: LLMConfig) {
    this.config = config;
  }

  async chat(messages: ChatMessage[], options?: any) {
    // This is where we'd branch out to different provider SDKs
    // For now, let's implement the Google Gemini logic using the SDK
    // and provide pointers for others.
    
    if (this.config.provider === 'google') {
      const ai = new GoogleGenAI({ apiKey: this.config.apiKey });
      const response = await ai.models.generateContent({
        model: this.config.model || 'gemini-3-flash-preview',
        contents: messages.map(m => ({ 
          role: m.role === 'user' ? 'user' : 'model', 
          parts: [{ text: m.content }] 
        })),
        config: {
          temperature: this.config.settings?.temperature ?? 0.7,
        }
      });
      return response.text;
    }

    if (this.config.provider === 'azure') {
      const { apiKey, baseUrl, model, apiVersion } = this.config;
      // Standard Azure OpenAI layout: {endpoint}/openai/deployments/{model}/chat/completions?api-version={apiVersion}
      // If baseUrl is the full endpoint, we use it directly.
      const url = baseUrl?.includes('?') ? baseUrl : `${baseUrl}/openai/deployments/${model}/chat/completions?api-version=${apiVersion || '2024-02-15-preview'}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': apiKey
        },
        body: JSON.stringify({
          messages,
          temperature: this.config.settings?.temperature ?? 0.7,
        })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(`Azure Error: ${err.error?.message || response.statusText}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    }

    // For other providers, we would typically use their fetch-based APIs or SDKs
    // But since the request is to "figure out the model and provider by the API key and endpoint", 
    // we use the utility function to refine the config if needed.
    
    // Fallback error for non-implemented in this scaffold
    throw new Error(`Provider ${this.config.provider} implementation is pending integration.`);
  }

  async *stream(messages: ChatMessage[], options?: any) {
    if (this.config.provider === 'google') {
       const ai = new GoogleGenAI({ apiKey: this.config.apiKey });
       const stream = await ai.models.generateContentStream({
         model: this.config.model || 'gemini-3-flash-preview',
         contents: messages.map(m => ({ 
           role: m.role === 'user' ? 'user' : 'model', 
           parts: [{ text: m.content }] 
         })),
       });

       for await (const chunk of stream) {
         yield chunk.text;
       }
    } else {
       yield `Streaming for ${this.config.provider} is not yet implemented in this preview.`;
    }
  }
}

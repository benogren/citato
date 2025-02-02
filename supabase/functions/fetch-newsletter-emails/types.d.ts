declare global {
    interface Window {
      Deno?: {
        env: {
          get(key: string): string | undefined;
        };
      };
    }
  }
  
  export {};
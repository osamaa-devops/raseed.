export {};

declare global {
  interface Window {
    raseedDesktop?: {
      platform: string;
      version: string;
      pickDirectory: () => Promise<string | null>;
      pickFile: (options?: { filters?: Array<{ name: string; extensions: string[] }> }) => Promise<string | null>;
      showItemInFolder: (filePath: string) => Promise<boolean>;
    };
  }
}

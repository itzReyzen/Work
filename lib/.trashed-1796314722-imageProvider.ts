// Plug-in point for an authorized image-generation provider later.
// Today the admin copies a prompt into ChatGPT and uploads the result.
export interface ImageProvider { name: string; generate(prompt: string): Promise<Blob>; }
export const provider: ImageProvider | null = null;

declare module 'pdf-parse' {
  export default function pdf(
    data: Buffer | Uint8Array | ArrayBuffer,
    options?: any
  ): Promise<{
    text: string;
    numpages: number;
    info: any;
    metadata: any;
    version: string;
  }>;
}

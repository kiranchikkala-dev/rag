export interface DocumentIngestUnit {
  kind: "text" | "figure";
  page: number;
  content: string;
  imageBuffer?: Buffer;
  imageContentType?: string;
  imageUrl?: string;
}
export interface DocumentExtractResult {
  fullText: string;
  units: DocumentIngestUnit[];
  title?: string;
}
export interface DocumentIngestProfile {
  id: string;
  extensions: readonly string[];
  sourceType: any;
  structured: boolean;
  extract: (
    buffer: Buffer,
    extension: string,
  ) => Promise<DocumentExtractResult>;
}

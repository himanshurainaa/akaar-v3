
export interface UploadedImage {
  file: File;
  previewUrl: string;
  base64: string;
  mimeType: string;
}

export type FitOption = 'slim' | 'regular' | 'loose' | 'baggy' | 'oversized';

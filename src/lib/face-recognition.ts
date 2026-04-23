// Simplified face recognition utilities
// Note: For production, use a proper face recognition service like AWS Rekognition

export const MODELS_PATH = '/models';

let useMockMode = true; // Default to mock mode since models need manual download

export async function loadModels() {
  // Models need to be downloaded manually via scripts/download-face-models.sh
  // For now, use mock mode
  useMockMode = true;
  return false;
}

export function isMockMode() {
  return useMockMode;
}

export function getFaceEmbedding(): string {
  // Return placeholder in mock mode
  return new Array(128).fill(0.5).join(',');
}

export function compareFaces(
  descriptor1: Float32Array, 
  descriptor2: Float32Array, 
  threshold: number = 0.6
): { match: boolean; distance: number } {
  // Simple comparison in mock mode
  const distance = 0.5;
  return {
    match: distance < threshold,
    distance
  };
}

export async function captureFromVideo(
  video: HTMLVideoElement,
  width: number = 640,
  height: number = 480
): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');
  
  ctx.drawImage(video, 0, 0, width, height);
  
  return canvas.toDataURL('image/jpeg', 0.9);
}

export async function detectFace(video: HTMLVideoElement) {
  if (useMockMode) {
    // Always return a mock detection for UI testing
    return { detected: true };
  }
  return null;
}

export function parseFaceEmbedding(embedding: string): Float32Array {
  const values = embedding.split(',').map(Number);
  return new Float32Array(values);
}
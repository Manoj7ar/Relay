// TODO: replace with getUserMedia({ video: true }) preview and capture.

export interface CameraCapture {
  imageRef: string;
  capturedAt: number;
}

export async function captureContext(): Promise<CameraCapture> {
  await new Promise((r) => setTimeout(r, 260));
  return {
    imageRef: `mock://capture/${Date.now()}`,
    capturedAt: Date.now(),
  };
}

// TODO: wire to SmartThings API via caregiver-provided OAuth token.

export interface SmartThingsScene {
  id: string;
  label: string;
}

export async function runScene(_scene: SmartThingsScene): Promise<boolean> {
  await new Promise((r) => setTimeout(r, 260));
  return true;
}

export async function testConnection(_apiKey: string): Promise<boolean> {
  await new Promise((r) => setTimeout(r, 400));
  return true;
}

/**
 * SmartThings smart-home bridge. Not wired yet — implement OAuth + the
 * scene runner via a server proxy. Functions here throw until connected
 * so the UI can show a clear "not configured" state instead of faking
 * success.
 */

export interface SmartThingsScene {
  id: string;
  label: string;
}

export class SmartThingsNotConnectedError extends Error {
  constructor() {
    super(
      'SmartThings is not configured. Wire OAuth + scene endpoints in ' +
        'src/services/smartthings.ts.',
    );
    this.name = 'SmartThingsNotConnectedError';
  }
}

export async function runScene(_scene: SmartThingsScene): Promise<boolean> {
  throw new SmartThingsNotConnectedError();
}

export async function testConnection(_apiKey: string): Promise<boolean> {
  throw new SmartThingsNotConnectedError();
}

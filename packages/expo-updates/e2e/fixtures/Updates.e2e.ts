import { by, device, element, waitFor } from 'detox';
import jestExpect from 'expect';

import Server from './utils/server';
import Update from './utils/update';

const platform = device.getPlatform();
const protocolVersion = platform === 'android' ? 1 : 0;
const TIMEOUT_BIAS = process.env.CI ? 10 : 1;

const checkUpdateStringAsync = async () => {
  const attributes: any = await element(by.id('updateString')).getAttributes();
  return attributes?.text.substring(8) || '';
};

const waitForAppToBecomeVisible = async () => {
  await waitFor(element(by.id('updateString')))
    .toBeVisible()
    .withTimeout(2000);
};

describe('Basic tests', () => {
  afterEach(async () => {
    await device.uninstallApp();
    Server.stop();
  });

  it('starts app, stops, and starts again', async () => {
    console.warn(`Platform = ${platform}`);
    jest.setTimeout(300000 * TIMEOUT_BIAS);
    Server.start(Update.serverPort, protocolVersion);
    await device.installApp();
    await device.launchApp({
      newInstance: true,
    });
    await waitForAppToBecomeVisible();

    const message = await checkUpdateStringAsync();
    jestExpect(message).toBe('test');
    await device.terminateApp();
    await device.launchApp();
    await waitForAppToBecomeVisible();

    const message2 = await checkUpdateStringAsync();
    jestExpect(message2).toBe('test');

    // Force failure to test EAS graceful shutdown
    jestExpect(message2).toBe('test_fail');
    await device.terminateApp();
  });
});

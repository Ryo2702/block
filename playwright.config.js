import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser',
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 5185 --strictPort',
    url: 'http://127.0.0.1:5185',
    reuseExistingServer: false,
  },
  use: {
    baseURL: 'http://127.0.0.1:5185',
    headless: true,
    launchOptions: { executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] },
  },
});

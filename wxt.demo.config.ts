import { defineConfig } from 'wxt';
import productionConfig from './wxt.config';

export default defineConfig({
  ...productionConfig,
  entrypointsDir: 'demo/entrypoints',
  hooks: {
    'config:resolved': (wxt) => {
      const origin = wxt.config.dev.server?.origin;
      if (!origin) return;

      wxt.config.runnerConfig.config.startUrls = [
        `${origin}/src/demo/page/index.html`,
      ];
    },
  },
});

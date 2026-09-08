import { defineConfig } from 'wxt';

import productionConfig from './wxt.config';

export default defineConfig({
  ...productionConfig,
  webExt: {
    ...productionConfig.webExt,
    chromiumArgs: ['--lang=en-US'],
    chromiumPref: {
      intl: {
        accept_languages: 'en-US,en',
      },
    },
  },
});

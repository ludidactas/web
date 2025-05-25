// Optimiza, limpia y estandariza un svg
// svgo source.svg -o target.svg --pretty --config svgo.config.js
// eslint-disable-next-line import/no-anonymous-default-export

import { nestIdsPlugin } from './svg/plugins/nestIdsPlugin.js';
import { normalizeIdsPlugin } from './svg/plugins/normalizeIdsPlugin.js';

export default {
  plugins: [
    {
      name: 'preset-default',
      params: {
        overrides: {
          cleanupIds: false,
        },
      },
    },
    nestIdsPlugin,
    normalizeIdsPlugin,
  ],
}

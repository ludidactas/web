// Optimiza, limpia y estandariza un svg
// svgo source.svg -o target.svg --pretty --config svgo.config.js
// eslint-disable-next-line import/no-anonymous-default-export

import { nestIdsPlugin } from './svg/plugins/nestIdsPlugin.js';
// import { normalizeIdsPlugin } from './svg/plugins/normalizeIdsPlugin.js';
import { randomizeImageIds } from './svg/plugins/randomizeImageIds.js';

// eslint-disable-next-line import/no-anonymous-default-export
export default {
  plugins: [
    {
      name: 'preset-default',
      params: {
        overrides: {
          cleanupIds: false,
          collapseGroups: false,
        },
      },
    },
    randomizeImageIds,
    nestIdsPlugin,
    // normalizeIdsPlugin,
  ],
}

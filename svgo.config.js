// Optimiza, limpia y estandariza un svg
// svgo source.svg -o target.svg --pretty --config svgo.config.js
// eslint-disable-next-line import/no-anonymous-default-export

import { nestIdsPlugin } from './svg/plugins/nestIdsPlugin.js'
// import { normalizeIdsPlugin } from './svg/plugins/normalizeIdsPlugin.js';
import { randomizeImageIds } from './svg/plugins/randomizeImageIds.js'

// eslint-disable-next-line import/no-anonymous-default-export
export default {
  plugins: [
    {
      name: 'preset-default',
      params: {
        overrides: {
          cleanupIds: false,
          collapseGroups: false,
          // Los exports de Affinity traen matrices con coordenadas enormes: convertidas a
          // rotate(ángulo, cx, cy) el centro queda lejísimo y el redondeo del ángulo corre
          // los elementos (p. ej. los ojos de Personajito2). Las dejamos como matrices
          convertTransform: { matrixToTransform: false },
        },
      },
    },
    randomizeImageIds,
    nestIdsPlugin,
    // normalizeIdsPlugin,
  ],
}

/**
 * Plugin de SVGO para jerarquizar ids. <g id="uno"><g id="dos"/></g/>
 * se convierte en <g id="uno"><g id="uno.dos"/></g/>
 * Usado en svgo.config.js. Útil para evitar colisiones de IDs en SVGs anidados.
 */
const nestIdsPlugin = {
  name: 'nestIds',
  description: 'Anida IDs en SVGs para evitar colisiones, separando los niveles con `.`',
  fn: () => {
    // Track the current ID path as we traverse the tree
    const idPath = []
    // id original -> id anidado, para actualizar las referencias (url(#...), href="#...")
    const renombrados = new Map()
    const nodos = []

    return {
      root: {
        // Las referencias pueden aparecer antes o después de la definición, así que
        // las reescribimos al final, cuando ya conocemos todos los renombres
        exit: () => {
          const actualizar = (id) => renombrados.get(id) ?? id
          nodos.forEach((node) => {
            Object.entries(node.attributes).forEach(([attr, valor]) => {
              if ((attr === 'href' || attr === 'xlink:href') && valor.startsWith('#')) {
                node.attributes[attr] = `#${actualizar(valor.slice(1))}`
              } else if (valor.includes('url(#')) {
                node.attributes[attr] = valor.replace(/url\(#([^)]+)\)/g, (_, id) => `url(#${actualizar(id)})`)
              }
            })
          })
        },
      },
      element: {
        enter: (node) => {
          nodos.push(node)
          // Check if the node has an ID attribute
          const idAttr = node.attributes.id

          if (idAttr) {
            // Store the original ID
            const originalId = idAttr

            // If we have a parent ID path, create a nested ID
            if (idPath.length > 0) {
              // Create the fully qualified ID by joining parent path with current ID
              const nestedId = [...idPath, originalId].join('.')
              // Update the node's ID attribute
              node.attributes.id = nestedId
              renombrados.set(originalId, nestedId)
            }

            // Add this ID to the path for child elements
            idPath.push(originalId)

            // Store the original ID to restore it when exiting
            node._originalId = originalId
          }
        },
        exit: (node) => {
          // If this node had an ID, remove it from the path when exiting
          if (node._originalId) {
            idPath.pop()
            // Clean up our temporary property
            delete node._originalId
          }
        },
      },
    }
  },
}

// Export as CommonJS module
module.exports = { nestIdsPlugin }

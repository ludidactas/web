/**
 * Plugin de SVGO para prefijar solo los IDs '_Image*' (exportados por Affinity)
 * con un string aleatorio. Previene colisiones entre SVGs diferentes en el mismo documento.
 */
const randomizeImageIds = {
  name: 'prefixImageIds',
  description: `Prefijar solo IDs '_Image*' con prefijo aleatorio`,
  fn: (_ast, _params, info) => {
    const idMap = new Map() // Track original -> prefixed ID mappings
    const fileName = info.path.split('/').pop().split('.')[0]
    // const randomPrefix = Math.random().toString(36).substring(2, 8);

    return {
      element: {
        enter: (node) => {
          // Handle ID attributes - only for _Image* ids
          const idAttr = node.attributes.id
          if (idAttr && idAttr.startsWith('_Image')) {
            const prefixedId = `${fileName}-${idAttr}`
            idMap.set(idAttr, prefixedId)
            node.attributes.id = prefixedId
          }

          // Handle references to _Image* IDs
          Object.keys(node.attributes).forEach((attrName) => {
            const attrValue = node.attributes[attrName]

            // Handle xlink:href references (like #_Image1)
            if (attrName === 'xlink:href' && attrValue.startsWith('#_Image')) {
              const referencedId = attrValue.substring(1)
              if (idMap.has(referencedId)) {
                node.attributes[attrName] = `#${idMap.get(referencedId)}`
              } else {
                // Create mapping for this reference
                const prefixedRef = `${fileName}-${referencedId}`
                idMap.set(referencedId, prefixedRef)
                node.attributes[attrName] = `#${prefixedRef}`
              }
            }

            // Handle href references
            if (attrName === 'href' && attrValue.startsWith('#_Image')) {
              const referencedId = attrValue.substring(1)
              if (idMap.has(referencedId)) {
                node.attributes[attrName] = `#${idMap.get(referencedId)}`
              } else {
                const prefixedRef = `${fileName}-${referencedId}`
                idMap.set(referencedId, prefixedRef)
                node.attributes[attrName] = `#${prefixedRef}`
              }
            }

            // Handle url() references in styles
            if (typeof attrValue === 'string' && attrValue.includes('url(#_Image')) {
              const updatedValue = attrValue.replace(/url\(#(_Image[^)]+)\)/g, (match, id) => {
                if (idMap.has(id)) {
                  return `url(#${idMap.get(id)})`
                } else {
                  const prefixedRef = `${fileName}-${id}`
                  idMap.set(id, prefixedRef)
                  return `url(#${prefixedRef})`
                }
              })
              node.attributes[attrName] = updatedValue
            }
          })
        },
      },
    }
  },
}

// Export as CommonJS module
module.exports = { randomizeImageIds }

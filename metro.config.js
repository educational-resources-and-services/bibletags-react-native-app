const MetroConfig = require('@ui-kitten/metro-config')

const evaConfig = {
  evaPackage: '@eva-design/eva',
  // Optional, but may be useful when using mapping customization feature.
  customMappingPath: './src/themes/custom-mapping.js',
}

module.exports = MetroConfig.create(evaConfig, {
  // Whatever was previously specified
})
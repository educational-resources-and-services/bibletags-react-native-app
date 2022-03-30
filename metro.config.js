const MetroConfig = require('@ui-kitten/metro-config')
const { getDefaultConfig } = require('expo/metro-config')

const defaultConfig = getDefaultConfig(__dirname)
defaultConfig.resolver.assetExts.push('db')

const evaConfig = {
  evaPackage: '@eva-design/eva',
  // Optional, but may be useful when using mapping customization feature.
  customMappingPath: './custom-mapping.json',
}

module.exports = MetroConfig.create(evaConfig, defaultConfig)
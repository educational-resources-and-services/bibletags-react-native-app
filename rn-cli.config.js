const extraNodeModules = require('node-libs-browser')
const defaultAssetExts = require("metro-config/src/defaults/defaults").assetExts

module.exports = {
  extraNodeModules,
  resolver: {
    assetExts: [
      ...defaultAssetExts,
      // sqlite format
      "db"
    ]
  },
}

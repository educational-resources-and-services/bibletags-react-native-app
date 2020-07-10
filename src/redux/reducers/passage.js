import Constants from "expo-constants"

import bibleVersions from "../../../versions"

const {
  DEFAULT_BIBLE_VERSIONS,
} = Constants.manifest.extra

const initialState = {
  "ref": {
    "bookId": 1,
    "chapter": 1,
  },
  "versionId": DEFAULT_BIBLE_VERSIONS.filter(id => (bibleVersions.filter(version => version.id === id)[0] || {}).myVersionsRestriction !== 'secondary-only')[0],
}

export default (state = initialState, action) => {
  // see setPassage.js
  return state
}
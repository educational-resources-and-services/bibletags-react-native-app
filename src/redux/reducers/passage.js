import { Constants } from "expo"

const {
  PRIMARY_VERSIONS,
} = Constants.manifest.extra

const initialState = {
  "ref": {
    "bookId": 1,
    "chapter": 1,
  },
  "versionId": PRIMARY_VERSIONS[0],
}

export default function(state = initialState, action) {
  // see setPassage.js
  return state
}
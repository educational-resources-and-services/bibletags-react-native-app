import { combineReducers } from "redux"
import reduceReducers from "reduce-reducers"

import passage from "./reducers/passage"
import passageScrollY from "./reducers/passageScrollY"
import history from "./reducers/history"
import recentPassages from "./reducers/recentPassages"
import recentSearches from "./reducers/recentSearches"
import displaySettings from "./reducers/displaySettings"
import myBibleVersions from "./reducers/myBibleVersions"

import setPassage from "./reducers/setPassage"
import recordSearch from "./reducers/recordSearch"

const slicedReducers = combineReducers({
  passage,
  passageScrollY,
  history,
  recentPassages,
  recentSearches,
  displaySettings,
  myBibleVersions,
})

const allReducers = reduceReducers(
  slicedReducers,

  // the following reducers receive the entire store
  setPassage,
  recordSearch,
)

export default allReducers
import { combineReducers } from "redux"
import reduceReducers from "reduce-reducers"

import passage from "./reducers/passage.js"
import history from "./reducers/history.js"
import recentPassages from "./reducers/recentPassages.js"
import recentSearches from "./reducers/recentSearches.js"
import displaySettings from "./reducers/displaySettings.js"

import setPassage from "./reducers/setPassage.js"
import recordSearch from "./reducers/recordSearch.js"
import setMode from "./reducers/setMode.js"

const slicedReducers = combineReducers({
  passage,
  history,
  recentPassages,
  recentSearches,
  displaySettings,
})

const allReducers = reduceReducers(
  slicedReducers,

  // the following reducers receive the entire store
  setPassage,
  recordSearch,
  setMode,
)

export default allReducers
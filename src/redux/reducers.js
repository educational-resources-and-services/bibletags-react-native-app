import { combineReducers } from "redux"
import reduceReducers from "reduce-reducers"

import passage from "./reducers/passage.js"
import displaySettings from "./reducers/displaySettings.js"

import setMode from "./reducers/setMode.js"

const slicedReducers = combineReducers({
  passage,
  displaySettings,
})

const allReducers = reduceReducers(
  slicedReducers,

  // the following reducers receive the entire store
  setMode,
)

export default allReducers
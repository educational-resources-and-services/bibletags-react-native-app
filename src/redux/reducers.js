import { combineReducers } from "redux"
import reduceReducers from "reduce-reducers"

import displaySettings from "./reducers/displaySettings.js"

const slicedReducers = combineReducers({
  displaySettings,
})

const allReducers = reduceReducers(
  slicedReducers,

  // the following reducers receive the entire store
)

export default allReducers
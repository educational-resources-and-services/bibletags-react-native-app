import { combineReducers } from "redux"
import reduceReducers from "reduce-reducers"

import displaySettings from "./reducers/displaySettings.js"

import setSort from "./reducers/setSort.js"
import endRecordReading from "./reducers/endRecordReading.js"

const slicedReducers = combineReducers({
  displaySettings,
})

const allReducers = reduceReducers(
  slicedReducers,

  // the following reducers receive the entire store
)

export default allReducers
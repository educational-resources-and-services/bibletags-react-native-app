import Constants from "expo-constants"
import { updateRecentLists } from "../../utils/toolbox"

const {
  MAXIMUM_NUMBER_OF_HISTORY,
} = Constants.manifest.extra

export default function(state, action) {

  const newState = { ...state }

  switch (action.type) {

    case "RECORD_SEARCH": {

      const { searchString, versionId, numberResults } = action

      newState.history = [ ...newState.history ]

      // take care of history
      newState.history.unshift({
        type: 'search',
        searchString,
        versionId,
        numberResults,
        lastViewTime: Date.now(),
      })
      newState.history.splice(MAXIMUM_NUMBER_OF_HISTORY, newState.history.length)
      newState.recentPassages = newState.recentPassages.map(index => index === 'current' ? index : index + 1)
      newState.recentSearches = newState.recentSearches.map(index => index + 1)
      newState.recentSearches.unshift(0)

      // take care of recentPassages and recentSearches
      updateRecentLists({ newState })

      return newState

    }

    case "REMOVE_RECENT_SEARCH": {

      newState.recentSearches = newState.recentSearches.filter(historyIndex => (
        action.searchString !== (state.history[historyIndex] || {}).searchString
      ))

      if(newState.recentSearches.length !== state.recentSearches.length) {
        return newState
      }
    }

  }
  
  return state
}
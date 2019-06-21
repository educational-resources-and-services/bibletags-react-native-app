import { Constants } from 'expo'
import { refsMatch, updateRecentLists } from '../../utils/toolbox.js'

const {
  PRIMARY_VERSIONS,
  SECONDARY_VERSIONS,
  MAXIMUM_NUMBER_OF_HISTORY,
} = Constants.manifest.extra

export default function(state = initialState, action) {

  const newState = { ...state }

  switch (action.type) {

    case "SET_REF": {

      newState.history = [ ...newState.history ]

      // take care of history
      newState.history.unshift({
        ...newState.passage,
        type: 'passage',
        lastViewTime: Date.now(),
      })
      newState.history.splice(MAXIMUM_NUMBER_OF_HISTORY, newState.history.length)
      newState.recentPassages = newState.recentPassages.map(index => index === 'current' ? 0 : index + 1)
      newState.recentSearches = newState.recentSearches.map(index => index + 1)
      newState.recentPassages.unshift('current')

      if(!refsMatch(newState.passage.ref, action.ref)) {

        newState.passage = { ...newState.passage }
        newState.passage.ref = { ...newState.passage.ref }

        // take care of passage
        if(newState.passage.ref.bookId !== action.ref.bookId) {
          newState.passage.ref.bookId = action.ref.bookId
        }

        if(newState.passage.ref.chapter !== action.ref.chapter) {
          newState.passage.ref.chapter = action.ref.chapter
        }

        if(newState.passage.ref.scrollY !== action.ref.scrollY) {
          newState.passage.ref.scrollY = action.ref.scrollY
        }

        // take care of recentPassages and recentSearches
        updateRecentLists({ newState })

        return newState
      }

      return state
    }
  
    case "SET_VERSION_ID": {
      if(
        newState.passage.versionId !== action.versionId
        && PRIMARY_VERSIONS.includes(action.versionId)
      ) {
        newState.passage = { ...newState.passage }
        newState.passage.versionId = action.versionId
        return newState
      }
      return state
    }
  
    case "SET_PARALLEL_VERSION_ID": {
      if(
        newState.passage.parallelVersionId !== action.parallelVersionId
        && SECONDARY_VERSIONS.includes(action.parallelVersionId)
      ) {
        newState.passage = { ...newState.passage }
        newState.passage.parallelVersionId = action.parallelVersionId
        return newState
      }
      return state
    }

    case "REMOVE_RECENT_PASSAGE": {

      newState.recentPassages = newState.recentPassages.filter(historyIndex => (
        !refsMatch(action.ref, (state.history[historyIndex] || {}).ref)
      ))

      if(newState.recentPassages.length !== state.recentPassages.length) {
        return newState
      }
    }

  }

  return state
}
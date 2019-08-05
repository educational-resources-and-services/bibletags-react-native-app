import Constants from "expo-constants"
import { refsMatch, updateRecentLists } from '../../utils/toolbox.js'
import { logEvent } from '../../utils/analytics'
import { getPassageStr } from "bibletags-ui-helper"

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
        ref: {
          ...newState.passage.ref,
          scrollY: newState.passageScrollY,
        },
        type: 'passage',
        lastViewTime: Date.now(),
      })
      newState.history.splice(MAXIMUM_NUMBER_OF_HISTORY, newState.history.length)
      newState.recentPassages = newState.recentPassages.map(index => index === 'current' ? 0 : index + 1)
      if(action.wasSwipe) {
        newState.recentPassages = newState.recentPassages.filter(index => index !== 0)
      }
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

        if(newState.passageScrollY !== action.ref.scrollY) {
          newState.passageScrollY = action.ref.scrollY
        }

        // take care of recentPassages and recentSearches
        updateRecentLists({ newState })

        // analytics
        const eventName = `SetPassage`
        const properties = {
          Passage: getPassageStr({ refs: [ newState.passage.ref ] }),
        }
        logEvent({ eventName, properties })

        return newState
      }

      return state
    }

    case "SET_PASSAGE_SCROLL": {
      newState.passageScrollY = action.y
      return newState
    }

    case "SET_VERSION_ID": {
      if(
        newState.passage.versionId !== action.versionId
        && PRIMARY_VERSIONS.includes(action.versionId)
      ) {
        newState.passage = { ...newState.passage }
        newState.passage.versionId = action.versionId

        // analytics
        const eventName = `SetVersion`
        const properties = {
          VersionId: newState.passage.versionId,
        }
        logEvent({ eventName, properties })

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

        // analytics
        const eventName = `SetParallelVersion`
        const properties = {
          ParallelVersionId: newState.passage.parallelVersionId,
        }
        logEvent({ eventName, properties })

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
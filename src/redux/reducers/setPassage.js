import Constants from "expo-constants"
import { refsMatch, updateRecentLists, getVersionInfo } from "../../utils/toolbox"
import { logEvent } from "../../utils/analytics"
import { getPassageStr } from "@bibletags/bibletags-ui-helper"

const {
  MAXIMUM_NUMBER_OF_HISTORY,
} = Constants.manifest.extra

const setRef = ({ state, newState, action }) => {

  const refsAlreadyMatch = refsMatch(newState.passage.ref, action.ref)

  if(!refsAlreadyMatch) {

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

  }

  if(!refsAlreadyMatch || action.ref.verse != null) {

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

    if(action.ref.verse != null) {
      newState.passageScrollY = { verse: action.ref.verse }
    }

  }

  if(!refsAlreadyMatch) {

    // take care of recentPassages and recentSearches
    updateRecentLists({ newState })

    // analytics
    const eventName = `SetPassage`
    const properties = {
      Passage: getPassageStr({ refs: [ newState.passage.ref ] }),
    }
    logEvent({ eventName, properties })

  }

  if(!refsAlreadyMatch || action.ref.verse != null) {

    // if this version doesn't contain the current ref, change the current ref
    const { partialScope } = getVersionInfo(state.passage.versionId)
    if(partialScope === 'nt' && action.ref.bookId < 40) {
      const { id: versionId } = state.myBibleVersions.find(({ id, downloaded }) => (downloaded && [ 'ot', undefined, null ].includes(getVersionInfo(id).partialScope))) || {}
      if(versionId) {
        return setVersionId({ state, newState, action: { versionId } })
      }
    }
    if(partialScope === 'ot' && action.ref.bookId > 39) {
      const { id: versionId } = state.myBibleVersions.find(({ id, downloaded }) => (downloaded && [ 'nt', undefined, null ].includes(getVersionInfo(id).partialScope))) || {}
      if(versionId) {
        return setVersionId({ state, newState, action: { versionId } })
      }
    }

    return newState
  }

  return state
}

const setVersionId = ({ state, newState, action }) => {
  if(newState.passage.versionId !== action.versionId) {
    newState.passage = { ...newState.passage }
    newState.passage.versionId = action.versionId

    // analytics
    const eventName = `SetVersion`
    const properties = {
      VersionId: newState.passage.versionId,
    }
    logEvent({ eventName, properties })

    // if this version doesn't contain the current ref, change the current ref
    const { partialScope } = getVersionInfo(action.versionId)
    if(partialScope === 'nt' && newState.passage.ref.bookId < 40) {
      return setRef({ state, newState, action: { ref: { bookId: 40, chapter: 1 } } })
    }
    if(partialScope === 'ot' && newState.passage.ref.bookId > 39) {
      return setRef({ state, newState, action: { ref: { bookId: 1, chapter: 1 } } })
    }

    return newState
  }
  return state
}

export default (state = initialState, action) => {

  const newState = { ...state }

  switch (action.type) {

    case "SET_REF": {
      return setRef({ state, newState, action })
    }

    case "SET_PASSAGE_SCROLL": {
      newState.passageScrollY = action.y
      return newState
    }

    case "SET_VERSION_ID": {
      return setVersionId({ state, newState, action })
    }

    case "SET_PARALLEL_VERSION_ID": {
      if(newState.passage.parallelVersionId !== action.parallelVersionId) {
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

    case "REMOVE_PARALLEL_VERSION": {
      if(newState.passage.parallelVersionId) {
        newState.passage = { ...newState.passage }
        delete newState.passage.parallelVersionId

        // analytics
        const eventName = `RemoveParallelVersion`
        logEvent({ eventName })

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
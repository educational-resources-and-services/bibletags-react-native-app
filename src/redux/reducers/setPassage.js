import { Constants } from "expo"

const {
  PRIMARY_VERSIONS,
  SECONDARY_VERSIONS,
} = Constants.manifest.extra

const MAXIMUM_NUMBER_OF_RECENT = 6
const MAXIMUM_NUMBER_OF_HISTORY = 100

const refsMatch = (ref1, ref2) => JSON.stringify(ref1) === JSON.stringify(ref2)

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

      if(!refsMatch(newState.passage.ref, action.ref)) {

        newState.passage = { ...newState.passage }
        newState.passage.ref = { ...newState.passage.ref }
        newState.recentPassages = [ ...newState.recentPassages ]
        newState.recentSearches = [ ...newState.recentSearches ]

        // take care of recentPassages and recentSearches
        const newRecentPassages = [ 'current', 0 ]
        const newRecentSearches = []
        state.history.some(({ type, ref, searchString }, index) => {

          if(
            type === 'passage'
            && state.recentPassages.includes(index)
            && !refsMatch(action.ref, ref)
          ) {
            newRecentPassages.push(index + 1)
          }

          if(
            type === 'search'
            && state.recentSearches.includes(index)
          ) {
            newRecentSearches.push(index + 1)
          }

          if(newRecentPassages.length + newRecentSearches.length >= MAXIMUM_NUMBER_OF_RECENT) {
            return true
          }

        })
        newRecentPassages.sort((a, b) => {
          const refA = a === 'current' ? action.ref : newState.history[a].ref
          const refB = b === 'current' ? action.ref : newState.history[b].ref

          return (
            refA.bookId > refB.bookId
            || (
              refA.bookId === refB.bookId
              && refA.chapter > refB.chapter
            )
          )
        })
        newState.recentPassages = newRecentPassages
        newState.recentSearches = newRecentSearches

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
        && SECONDARY_VERSIONS.includes(action.versionId)
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
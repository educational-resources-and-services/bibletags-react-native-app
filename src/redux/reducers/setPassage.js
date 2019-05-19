import { Constants } from "expo"

const {
  PRIMARY_VERSIONS,
  SECONDARY_VERSIONS,
} = Constants.manifest.extra

export default function(state = initialState, action) {

  const newState = {
    ...state,
    passage: {...state.passage},
    history: {...state.history},
    recentPassages: {...state.recentPassages},
  }

  switch (action.type) {

    case "SET_REF": {

      if(JSON.stringify(newState.passage.ref) !== JSON.stringify(action.ref)) {
        newState.passage.ref = { ...newState.passage.ref }

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
        newState.passage.parallelVersionId = action.parallelVersionId
        return newState
      }
      return state
    }

  }

  return state
}
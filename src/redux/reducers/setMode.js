import { Constants } from "expo"

const {
  SECONDARY_VERSIONS,
} = Constants.manifest.extra

const modeOptions = [
  "basic",
  "parallel",
]

export default function(state, action) {

  const newState = {
    ...state,
    passage: {...state.passage},
    displaySettings: {...state.displaySettings},
  }
    
  switch (action.type) {

    case "SET_MODE": {
      const mode = modeOptions.includes(action.mode) ? action.mode : state.mode

      newState.displaySettings.mode = mode

      if(mode === 'parallel') {
        newState.passage.parallelVersionId = (SECONDARY_VERSIONS[0] === state.passage.versionId)
          ? SECONDARY_VERSIONS[1]
          : SECONDARY_VERSIONS[0]
      } else {
        delete newState.passage.parallelVersionId
      }
      
      return newState
    }

  }
  
  return state
}
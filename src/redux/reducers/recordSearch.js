export default function(state, action) {

  const newState = {
    ...state,
    history: {...state.history},
    recentSearches: {...state.recentSearches},
  }
    
  switch (action.type) {

    case "RECORD_SEARCH": {
    }

  }
  
  return state
}
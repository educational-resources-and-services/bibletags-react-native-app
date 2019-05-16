const initialState = {
  "ref": {
    "bookId": 1,
    "chapter": 1,
    "scrollY": 0,
  },
  "versionId": "kjv",
}

export default function(state = initialState, action) {
  const newState = { ...state }

  switch (action.type) {

    case "SET_REF": {

      if(JSON.stringify(newState.ref) !== JSON.stringify(action.ref)) {
        newState.ref = { ...newState.ref }

        if(newState.ref.bookId !== action.ref.bookId) {
          newState.ref.bookId = action.ref.bookId
        }

        if(newState.ref.chapter !== action.ref.chapter) {
          newState.ref.chapter = action.ref.chapter
        }

        if(newState.ref.scrollY !== action.ref.scrollY) {
          newState.ref.scrollY = action.ref.scrollY
        }

        return newState
      }

      return state
    }
  
    case "SET_VERSION_ID": {
      if(newState.versionId !== action.versionId) {
        newState.versionId = action.versionId
        return newState
      }
      return state
    }
  
    case "SET_PARALLEL_VERSION_ID": {
      if(newState.parallelVersionId !== action.parallelVersionId) {
        newState.parallelVersionId = action.parallelVersionId
        return newState
      }
      return state
    }

  }

  return state
}
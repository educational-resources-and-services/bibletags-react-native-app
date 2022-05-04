import Constants from "expo-constants"

import bibleVersions from "../../../versions"

const {
  DEFAULT_BIBLE_VERSIONS=['original'],
} = Constants.manifest.extra

const defaultState = DEFAULT_BIBLE_VERSIONS.map((id, idx) => ({
  id,
  download: true,
  downloaded: idx === 0,
  searchDownloaded: false,
}))

const bibleVersionIds = bibleVersions.map(({ id }) => id)

export default (state = defaultState, action) => {
  
  switch (action.type) {

    case "ADD_BIBLE_VERSION": {
      let { id, download } = action

      if(
        !bibleVersionIds.includes(id)
        || state.some(version => version.id === id)
      ) {
        console.log('Invalid call to ADD_BIBLE_VERSION', action, state)
        return state
      }

      download = !!download

      return [
        ...state,
        {
          id,
          download,
          downloaded: false,
          searchDownloaded: false,
        },
      ]
    }

    case "REMOVE_BIBLE_VERSION": {
      const { id } = action

      const newState = state.filter(version => version.id !== id)

      if(
        newState.length === state.length
        || bibleVersions.some(version => (version.id === id && version.required))
      ) {
        console.log('Invalid call to REMOVE_BIBLE_VERSION', action, state)
        return state
      }

      return newState
    }

    case "SET_MY_BIBLE_VERSIONS_ORDER": {
      const { ids } = action

      const newState = ids.map(id => state.filter(version => version.id === id)[0])

      if(!newState.every(Boolean) || newState.length !== state.length) {
        console.log('Invalid call to SET_MY_BIBLE_VERSIONS_ORDER', action, state)
        return state
      }

      return newState
    }

    case "SET_BIBLE_VERSION_DOWNLOAD_STATUS": {
      let { id, download, downloaded, searchDownloaded } = action

      const newState = [ ...state ]

      for(let idx in newState) {
        if(newState[idx].id === id) {
          newState[idx] = {
            id,
            download: download != undefined ? !!download : state[idx].download,
            downloaded: downloaded != undefined ? !!downloaded : state[idx].downloaded,
            searchDownloaded: searchDownloaded != undefined ? !!searchDownloaded : state[idx].searchDownloaded,
          }
          if(
            newState[idx].download !== state[idx].download
            || newState[idx].downloaded !== state[idx].downloaded
            || newState[idx].searchDownloaded !== state[idx].searchDownloaded
          ) {
            return newState
          }
          break
        }
      }

      console.log('Invalid call to SET_BIBLE_VERSION_DOWNLOAD_STATUS', action, state)
      return state
    }

  }

  return state
}
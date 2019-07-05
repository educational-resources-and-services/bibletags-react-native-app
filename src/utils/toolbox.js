import { Dimensions, NetInfo } from "react-native"
import { SQLite } from 'expo'
import { Constants } from "expo"
import nativeBasePlatformVariables from 'native-base/src/theme/variables/platform'
// import { Toast } from "native-base"

// import i18n from "./i18n.js"
import bibleVersions from '../../versions.js'
import { getBookIdListWithCorrectOrdering } from 'bibletags-versification/src/versification'

const {
  MAXIMUM_NUMBER_OF_RECENT,
} = Constants.manifest.extra

// const cachedSizes = {}

// export const isIPhoneX = nativeBasePlatformVariables.isIphoneX
// export const getFooterHeight = () => nativeBasePlatformVariables.footerHeight - (isIPhoneX ? 34 : 0)
export const getToolbarHeight = () => nativeBasePlatformVariables.toolbarHeight

export const isPhoneSize = () => {
  const { width, height } = Dimensions.get('window')
  return Math.min(width, height) < 500
}

// The navigate function prevents a double tap from causing double navigation
let lastDebounce
export const debounce = (func, ...params) => {
  if(lastDebounce !== JSON.stringify(params)) {
    func(...params)
    lastDebounce = JSON.stringify(params)
    setTimeout(() => lastDebounce = undefined, 1500)
  }
}

let statusBarIsHidden = false
export const setStatusBarHidden = setHidden => {
  if(Platform.OS === 'ios') {
    StatusBar.setHidden(setHidden)
  } else if(Platform.OS === 'android') {
    StatusBar.setBackgroundColor(setHidden ? 'white' : ANDROID_STATUS_BAR_COLOR, true)
    // StatusBar.setBarStyle(setHidden ? 'dark-content' : 'light-content', true)
  }
  statusBarIsHidden = !!setHidden
}
export const isStatusBarHidden = () => statusBarIsHidden

let nextIdForTimeout = 1
const componentTimeouts = {}

export const setUpTimeout = (func, ms, thisVar) => {

  if(!thisVar.__idForTimeouts) {
    thisVar.__idForTimeouts = nextIdForTimeout++
  }

  if(!componentTimeouts[thisVar.__idForTimeouts]) {
    componentTimeouts[thisVar.__idForTimeouts] = {}
  }

  const timeout = setTimeout(() => {
    if((componentTimeouts[thisVar.__idForTimeouts] || {})[timeout]) {
      delete componentTimeouts[thisVar.__idForTimeouts][timeout]
      func()
    }
  }, ms)

  componentTimeouts[thisVar.__idForTimeouts][timeout] = true

  return timeout
}

export const clearOutTimeout = (timeout, thisVar) => {
  clearTimeout(timeout)
  if(componentTimeouts[thisVar.__idForTimeouts]) {
    delete componentTimeouts[thisVar.__idForTimeouts][timeout]
  }
}

export const unmountTimeouts = function() {
  if(componentTimeouts[this.__idForTimeouts]) {
    Object.keys(componentTimeouts[this.__idForTimeouts]).forEach(timeout => clearOutTimeout(parseInt(timeout, 10), this))
    delete componentTimeouts[this.__idForTimeouts]
    delete this.__idForTimeouts
  }
}

let netInfoIsConnectedFetch
let isConnectedResolveFunctions = []

export const isConnected = () => new Promise(resolve => {
  isConnectedResolveFunctions.push(resolve)
  
  if(!netInfoIsConnectedFetch) {
    const doResolves = isConnected => {
      netInfoIsConnectedFetch = undefined
      isConnectedResolveFunctions.forEach(func => func(isConnected))
      isConnectedResolveFunctions = []
    }

    netInfoIsConnectedFetch = NetInfo.isConnected.fetch()
      .then(doResolves)
      .catch(() => doResolves(false))
  }
})

// export const showXapiConsent = ({ idps, setXapiConsentShown }) => {

//   let text = i18n("Note: By using this app, you consent to us recording usage data for the purpose of better improving our services.")

//   if(Object.values(idps).some(idpInfo => {
//     if(idpInfo.idpXapiOn && !idpInfo.xapiConsentShown) {
//       text = idpInfo.idpXapiConsentText || text
//       return true
//     }
//   })) {

//     Toast.show({
//       text,
//       buttonText: i18n("Okay"),
//       duration: 0,
//       onClose: setXapiConsentShown,
//     })

//   }

// }

export const executeSql = async ({ versionId, statement, args, statements, removeCantillation, removeWordPartDivisions }) => {
  const versionInfo = getVersionInfo(versionId)

  if(!versionInfo) return null

  const db = SQLite.openDatabase(`${versionId}.db`)
  const resultSets = []

  const logDBError = error => console.log(`ERROR when running executeSql: ${error}`, error)

  await new Promise(resolveAll => {
    db.transaction(
      tx => {

        if(statement) {
          statements = [{
            statement,
            args,
          }]
        }

        for(let idx in statements) {
          const { statement, args=[] } = statements[idx]

          tx.executeSql(
            statement,
            args,
            (x, resultSet) => resultSets[idx] = resultSet,
            logDBError
          )
        }

      },
      logDBError,
      resolveAll
    )
  })

  if(versionInfo.isOriginal && versionInfo.languageId === 'heb') {
    resultSets.forEach(resultSet => {
      try {
        const { rows: { _array: verses } } = resultSet

        verses.forEach(verse => {

          if(removeWordPartDivisions) {
            verse.usfm = verse.usfm.replace(/\u200B/g, '')  // zero-width space (used to indicate word parts)
          }
          
          if(removeCantillation) {
            verse.usfm = verse.usfm.replace(/[\u0591-\u05AF\u05A5\u05BD\u05BF\u05C0\u05C5\u05C7]/g,'')
          }

        })

      } catch(e) {}
    })
  }

  return statement ? resultSets[0] : resultSets
}

export const escapeLike = like => (
  like
    .replace(/%/g, '\\%')
    .replace(/_/g, '\\_')
)

export const getVersionInfo = versionId => {
  let versionInfo = {}

  bibleVersions.some(version => {
    if(versionId === version.id) {
      versionInfo = version
      return true
    }
  })

  return versionInfo
}

export const isRTL = languageId => (
  [
    'heb',
    'yid',
    'ara',
    'per',
    'fas',
    'urd',
    'pus',
    'syc',
    'syr',
    'sam',
    'snd',
  ].includes(languageId)
)

export const refsMatch = (ref1, ref2) => JSON.stringify(ref1) === JSON.stringify(ref2)

export const updateRecentLists = ({ newState }) => {

  const newRecentPassages = [ 'current' ]
  const newRecentSearches = []
  const newRecentSearchStrings = []

  newState.history.some(({ type, ref, searchString }, index) => {

    if(
      type === 'passage'
      && newState.recentPassages.includes(index)
      && !refsMatch(newState.passage.ref, ref)
    ) {
      newRecentPassages.push(index)
    }

    if(
      type === 'search'
      && newState.recentSearches.includes(index)
      && !newRecentSearchStrings.includes(searchString)
    ) {
      newRecentSearches.push(index)
      newRecentSearchStrings.push(searchString)
    }

    if(newRecentPassages.length + newRecentSearches.length >= MAXIMUM_NUMBER_OF_RECENT) {
      return true
    }

  })

  const versionInfo = getVersionInfo(newState.passage.versionId)
  const bookIds = getBookIdListWithCorrectOrdering({ versionInfo })

  newRecentPassages.sort((a, b) => {
    const refA = a === 'current' ? newState.passage.ref : newState.history[a].ref
    const refB = b === 'current' ? newState.passage.ref : newState.history[b].ref

    return (
      bookIds.indexOf(refA.bookId) > bookIds.indexOf(refB.bookId)
      || (
        refA.bookId === refB.bookId
        && refA.chapter > refB.chapter
      )
    )
  })

  newState.recentPassages = newRecentPassages
  newState.recentSearches = newRecentSearches

}

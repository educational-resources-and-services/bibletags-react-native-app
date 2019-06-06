import { Dimensions, NetInfo } from "react-native"
import { SQLite } from 'expo'
// import { Constants } from "expo"
import nativeBasePlatformVariables from 'native-base/src/theme/variables/platform'
// import { Toast } from "native-base"

// import i18n from "./i18n.js"

// const {
//   SOMETHING,
// } = Constants.manifest.extra

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

export const executeSql = async ({ versionId, statement, args, statements }) => {
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

  return statement ? resultSets[0] : resultSets
}
import React, { useState, useEffect } from "react"
import Constants from "expo-constants"
import * as Font from "expo-font"
import { AppLoading, Updates } from "expo"
import * as StoreReview from 'expo-store-review'
import { Root } from "native-base"
import * as Localization from "expo-localization"

import { NativeRouter } from "react-router-native"
import { AsyncStorage } from "react-native"
import { createStore, applyMiddleware } from "redux"
import { persistStore, persistReducer } from "redux-persist"
import { PersistGate } from 'redux-persist/integration/react'
import reducers from "./src/redux/reducers.js"
import { Provider } from "react-redux"
import { Ionicons } from '@expo/vector-icons'
import { passOverI18n, passOverI18nNumber } from "bibletags-ui-helper/src/i18n.js"
import { logEvent } from './src/utils/analytics'

import { bibleFontLoads } from "./src/utils/bibleFonts.js"
import updateDataStructure from "./src/utils/updateDataStructure.js"
import importUsfm from "./src/utils/importUsfm.js"
// import { reportReadings } from "./src/utils/syncUserData.js"
import { i18nSetup, i18n, i18nNumber } from "inline-i18n"
import { translations, languageOptions } from "./language"
import { fixRTL } from "./src/utils/toolbox"

import SideMenuAndRouteSwitcher from "./src/components/major/SideMenuAndRouteSwitcher.js"

const {
  NUM_OPENS_FOR_RATING_REQUEST=0,
} = Constants.manifest.extra

passOverI18n(i18n)
passOverI18nNumber(i18nNumber)

const patchMiddleware = store => next => action => {
  const result = next(action)
  // if(action.patchInfo) {
  //   patch({
  //     ...action.patchInfo,
  //     ...store.getState(),
  //   })
  // }
  // if(action.reportReadingsInfo) {
  //   reportReadings({
  //     ...action.reportReadingsInfo,
  //     ...store.getState(),
  //   })
  // }
  return result
}

const persistConfig = {
  key: "root",    
  storage: AsyncStorage,
}

const persistedReducer = persistReducer(persistConfig, reducers)
const store = createStore(persistedReducer, applyMiddleware(patchMiddleware))
const persistor = persistStore(store)

const setLocale = async () => {
  const localeOptions = languageOptions.map(({ locale }) => locale)
  const deviceLocale = Localization.locale.split('-')[0]

  i18nSetup({
    locales: [
      await AsyncStorage.getItem(`uiLocale`)
      || (
        localeOptions.includes(deviceLocale)
        ? deviceLocale
        : localeOptions[0]
      )
    ],
    translations,
  })
}

const requestRating = async () => {
  if(!(await StoreReview.hasAction())) return

  const numUserOpensKey = `numUserOpens`
  const numUserOpens = (parseInt(await AsyncStorage.getItem(numUserOpensKey), 10) || 0) + 1

  if(numUserOpens === NUM_OPENS_FOR_RATING_REQUEST) {
    // try {
    //   StoreReview.requestReview()
    // } catch(e) {}
  }

  await AsyncStorage.setItem(numUserOpensKey, `${numUserOpens}`)
}

const App = () => {

  const [ isReady, setIsReady ] = useState(false)

  useEffect(
    () => {
      (async () => {

        await setLocale()

        if(await fixRTL() === 'reload') {
          Updates.reloadFromCache()
          return
        }
    
        await Promise.all([
          Font.loadAsync({
            Roboto: require('native-base/Fonts/Roboto.ttf'),
            Roboto_medium: require('native-base/Fonts/Roboto_medium.ttf'),
            ...bibleFontLoads,
            ...Ionicons.font,
          }),
        ])
        
        await updateDataStructure()  // needs to be after the persistStore call above
    
        await importUsfm()
    
        setIsReady(true)

        requestRating()  // could use `await` here, but not necessary
    
        // no need to wait for the following, but preload anyway
        // Asset.fromModule(require('./assets/images/drawer.png')).downloadAsync(),
        // the above line was causing a crash in development mode
    
        logEvent({ eventName: `OpenApp` })
    
      })()
    },
    [],
  )

  if(!isReady) {
    return <AppLoading />
  }

  return (
    <NativeRouter>
      <Root>
        <Provider store={store}>
          <PersistGate 
            persistor={persistor} 
            loading={<AppLoading />}
          >
            <SideMenuAndRouteSwitcher />
          </PersistGate>
        </Provider>
      </Root>
    </NativeRouter>
  )

}

export default App
import React, { useState, useEffect } from "react"
// import Constants from "expo-constants"
import * as Font from "expo-font"
import { AppLoading } from "expo"
import * as Updates from 'expo-updates'
// import * as StoreReview from 'expo-store-review'
import * as eva from '@eva-design/eva'
import { ApplicationProvider } from "@ui-kitten/components"
import { SafeAreaProvider } from "react-native-safe-area-context"
import * as Localization from "expo-localization"
import { NativeRouter } from "react-router-native"
import { AsyncStorage, StatusBar } from "react-native"
import { createStore, applyMiddleware } from "redux"
import { persistStore, persistReducer } from "redux-persist"
import { PersistGate } from "redux-persist/integration/react"
import { Provider } from "react-redux"
import { passOverI18n, passOverI18nNumber } from "bibletags-ui-helper/src/i18n"
import { i18nSetup, i18n, i18nNumber } from "inline-i18n"

import lightTheme from "./src/themes/light"
import darkTheme from "./src/themes/dark"
import customMapping from "./src/themes/custom-mapping"
import reducers from "./src/redux/reducers"
import { logEvent } from "./src/utils/analytics"
import { bibleFontLoads } from "./src/utils/bibleFonts"
import updateDataStructure from "./src/utils/updateDataStructure"
import syncBibleVersions from "./src/utils/syncBibleVersions"
// import { reportReadings } from "./src/utils/syncUserData"
import { translations, languageOptions } from "./language"
import { fixRTL } from "./src/utils/toolbox"
import { iconFonts } from "./src/components/basic/Icon"
import useSetTimeout from "./src/hooks/useSetTimeout"

import SideMenuAndRouteSwitcher from "./src/components/major/SideMenuAndRouteSwitcher"
import Splash from "./src/components/major/Splash"

// const {
//   NUM_OPENS_FOR_RATING_REQUEST=0,
// } = Constants.manifest.extra

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

const App = () => {

  const [ isFirstRender, setIsFirstRender ] = useState(true)
  const [ showDelayText, setShowDelayText ] = useState(false)
  const [ isLoaded, setIsLoaded ] = useState(false)
  const [ updateExists, setUpdateExists ] = useState(false)
  const [ isReady, setIsReady ] = useState(false)

  const [ setInitialOpenTimeout ] = useSetTimeout()

  // TODO: Install and test (expo install react-native-appearance)
  const colorScheme = 'light' // useColorScheme()

  useEffect(() => { setIsFirstRender(false) }, [])

  useEffect(
    () => {
      (async () => {

        let initialTasksComplete = false
        let newVersionCheckComplete = false

        // record number of opens
        const numUserOpensKey = `numUserOpens`
        const numUserOpens = (parseInt(await AsyncStorage.getItem(numUserOpensKey), 10) || 0) + 1
        await AsyncStorage.setItem(numUserOpensKey, `${numUserOpens}`)

        if(!__DEV__ && numUserOpens === 1) {
          setShowDelayText(true)
        }

        const setIsReadyIfReady = force => {
          if(
            force
            || (
              initialTasksComplete
              && newVersionCheckComplete
            )
          ) {

            setIsReady(true)
            logEvent({ eventName: `OpenApp` })

          }
        }

        if(!__DEV__) {
          Updates.fetchUpdateAsync()
            .then(({ isNew }) => {
              if(isNew) {
                setUpdateExists(true)
              }
            })
            .finally(() => {
              newVersionCheckComplete = true
              setIsReadyIfReady()
            })
        }

        await Promise.all([
          Font.loadAsync({
            ...bibleFontLoads,
            ...iconFonts,
          }),
          (async () => {
            await updateDataStructure()
            await syncBibleVersions()
          })(),
          setLocale(),
        ])

        if(await fixRTL() === 'reload') {
          Updates.reloadAsync()
          return
        }

        if(Platform.OS === 'ios') {
          StatusBar.setBarStyle('dark-content')
        }

        setIsLoaded(true)

        initialTasksComplete = true

        if(!__DEV__ && numUserOpens === 1 && !newVersionCheckComplete) {
          // only wait for 3 more seconds at most
          setInitialOpenTimeout(() => setIsReadyIfReady(true), 1000*3)
        } else {
          setIsReadyIfReady(true)
        }

      })()
    },
    [],
  )

  if(isFirstRender) {
    // needed to prevent an ugly flash on android
    return <AppLoading />
  }

  return (
    <>
      <NativeRouter>
        <ApplicationProvider
          {...eva}
          customMapping={customMapping}
          theme={colorScheme === 'dark' ? darkTheme : lightTheme}
        >
          <Splash
            showDelayText={showDelayText}
            isReady={isReady}
            updateExists={updateExists}
          />
          {!!isLoaded &&
            <SafeAreaProvider>
              <Provider store={store}>
                <PersistGate persistor={persistor}>
                  <SideMenuAndRouteSwitcher />
                </PersistGate>
              </Provider>
            </SafeAreaProvider>
          } 
        </ApplicationProvider>
      </NativeRouter>
    </>
  )

}

export default App
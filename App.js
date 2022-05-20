import React, { useState, useEffect } from "react"
import Constants from "expo-constants"
import * as Font from "expo-font"
import AppLoading from 'expo-app-loading'
import * as Updates from 'expo-updates'
// import * as StoreReview from 'expo-store-review'
import * as eva from '@eva-design/eva'
import { ApplicationProvider } from "@ui-kitten/components"
import { SafeAreaProvider } from "react-native-safe-area-context"
import * as Localization from "expo-localization"
import { NativeRouter } from "react-router-native"
import AsyncStorage from '@react-native-async-storage/async-storage'
import { StatusBar } from "react-native"
import { createStore, applyMiddleware } from "redux"
import { persistStore, persistReducer } from "redux-persist"
import { PersistGate } from "redux-persist/integration/react"
import { Provider } from "react-redux"
import { passOverI18n, passOverI18nNumber } from "@bibletags/bibletags-ui-helper"
import { i18nSetup, i18n, i18nNumber } from "inline-i18n"
import { GestureHandlerRootView } from 'react-native-gesture-handler'

import lightTheme from "./src/themes/light"
import darkTheme from "./src/themes/dark"
import reducers from "./src/redux/reducers"
import { logEvent } from "./src/utils/analytics"
import { bibleFontLoads } from "./src/utils/bibleFonts"
import updateDataStructure from "./src/utils/updateDataStructure"
import syncBibleVersions from "./src/utils/syncBibleVersions"
// import { reportReadings } from "./src/utils/syncUserData"
import { translations, languageOptions } from "./language"
import { fixRTL, initializeDeviceId, updateAndGetNumUserOpens, getAsyncStorage } from "./src/utils/toolbox"
import { iconFonts } from "./src/components/basic/Icon"
import useSetTimeout from "./src/hooks/useSetTimeout"
import * as Sentry from "./src/utils/sentry"

import SideMenuAndRouteSwitcher from "./src/components/major/SideMenuAndRouteSwitcher"
import Splash from "./src/components/major/Splash"

const {
  SENTRY_DSN="[SENTRY_DSN]",
} = Constants.manifest.extra

if(SENTRY_DSN !== "[SENTRY_DSN]") {
  Sentry.init({
    dsn: SENTRY_DSN,
    enableInExpoDevelopment: true,
    debug: true,
  })
}

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
      await getAsyncStorage(`uiLocale`)
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
        let updateExists = false
        const numUserOpens = await updateAndGetNumUserOpens()

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

            if(updateExists) {
              Updates.reloadAsync()
            } else {
              setIsLoaded(true)
              setIsReady(true)
              logEvent({ eventName: `OpenApp` })
            }  

          }
        }

        if(!__DEV__) {
          Updates.fetchUpdateAsync()
            .then(({ isNew }) => {
              if(isNew) {
                updateExists = true
                setUpdateExists(true)
              }
            })
            .finally(() => {
              newVersionCheckComplete = true
              setIsReadyIfReady()
            })
        }

        await Promise.all([
          initializeDeviceId(),
          Font.loadAsync({
            ...bibleFontLoads,
            ...iconFonts,
          }),
          (async () => {
            // these need to be in order
            await updateDataStructure()
            await syncBibleVersions()  // only makes sure that the primary version is downloaded
          })(),
          setLocale(),
        ])

        await fixRTL()  // may involve a reload, and so needs to be separate from the other async tasks

        if(Platform.OS === 'ios') {
          StatusBar.setBarStyle('dark-content')
        }

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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NativeRouter>
        <ApplicationProvider
          {...eva}
          theme={colorScheme === 'dark' ? darkTheme : lightTheme}
        >
          <Splash
            showDelayText={showDelayText}
            isReady={isReady}
          />
          {!!isLoaded &&
            <SafeAreaProvider>
              <Provider store={store}>
                <PersistGate persistor={persistor}>
                  <SideMenuAndRouteSwitcher
                    updateExists={updateExists}
                  />
                </PersistGate>
              </Provider>
            </SafeAreaProvider>
          } 
        </ApplicationProvider>
      </NativeRouter>
    </GestureHandlerRootView>
  )

}

export default App
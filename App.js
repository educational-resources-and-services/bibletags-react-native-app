import React from "react"
import { Constants, Font, AppLoading, StoreReview } from "expo"
import { Root } from "native-base"

import { AsyncStorage, I18nManager } from "react-native"
import { createStore, compose, applyMiddleware } from "redux"
import { persistStore, persistReducer } from "redux-persist"
import { PersistGate } from 'redux-persist/integration/react'
import reducers from "./src/redux/reducers.js"
import { Provider } from "react-redux"
import { Ionicons } from '@expo/vector-icons'
import { passOverI18n, passOverI18nNumber } from "bibletags-ui-helper/src/i18n.js"
import { logEvent } from './src/utils/analytics'

import GlobalNavigator from "./src/navigators/Global.js"

import { bibleFontLoads } from "./src/utils/bibleFonts.js"
import updateDataStructure from "./src/utils/updateDataStructure.js"
import importUsfm from "./src/utils/importUsfm.js"
// import { reportReadings } from "./src/utils/syncUserData.js"
import { RTL } from "./language.js"
import i18n, { i18nNumber } from "./src/utils/i18n.js"

const {
  NUM_OPENS_FOR_RATING_REQUEST=0,
} = Constants.manifest.extra

passOverI18n(i18n)
passOverI18nNumber(i18nNumber)

I18nManager.forceRTL(RTL)

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

// const store = compose(autoRehydrate())(createStore)(reducers, applyMiddleware(patchMiddleware))

const persistConfig = {
  key: "root",    
  storage: AsyncStorage,
}

const persistedReducer = persistReducer(persistConfig, reducers)
const store = createStore(persistedReducer, applyMiddleware(patchMiddleware))
const persistor = persistStore(store)

export default class App extends React.Component {

  constructor(props) {
    super(props)

    this.state = {
      isReady: false,
    }

    this.setUp()
  }

  setUp = async () => {

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

    this.setState({ isReady: true })

    // no need to wait for the following, but preload anyway
    // Asset.fromModule(require('./assets/images/drawer.png')).downloadAsync(),
    // the above line was causing a crash in development mode

    logEvent({ eventName: `OpenApp` })

  }

  componentDidMount() {
    this.requestRating()
  }

  requestRating = async () => {
    const numUserOpensKey = `numUserOpens`
    const numUserOpens = (parseInt(await AsyncStorage.getItem(numUserOpensKey), 10) || 0) + 1

    if(numUserOpens === NUM_OPENS_FOR_RATING_REQUEST) {
      StoreReview.requestReview()
    }

    await AsyncStorage.setItem(numUserOpensKey, `${numUserOpens}`)
  }


  render() {
    const { isReady } = this.state

    if(!isReady) {
      return <AppLoading />
    }

    return (
      <Root>
        <Provider store={store}>
          <PersistGate 
            persistor={persistor} 
            loading={<AppLoading />}
          >
            <GlobalNavigator
              persistenceKey={`NavigationState-${Constants.manifest.version}`}
              renderLoadingExperimental={() => <AppLoading />}
            />
          </PersistGate>
        </Provider>
      </Root>
    )
  }
}
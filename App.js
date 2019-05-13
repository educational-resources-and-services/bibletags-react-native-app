import React from "react"
import { Font, AppLoading } from "expo"
import { Root } from "native-base"

import { AsyncStorage } from "react-native"
import { createStore, compose, applyMiddleware } from "redux"
import { persistStore, persistReducer } from "redux-persist"
import { PersistGate } from 'redux-persist/integration/react'
import reducers from "./src/redux/reducers.js"
import { Provider } from "react-redux"

import GlobalNavigator from "./src/navigators/Global.js"

import updateDataStructure from "./src/utils/updateDataStructure.js"
// import { reportReadings } from "./src/utils/syncUserData.js"

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
  state = {
    isReady: false,
  }

  async componentWillMount() {
    await Promise.all([
      Font.loadAsync({
        Roboto: require('native-base/Fonts/Roboto.ttf'),
        Roboto_medium: require('native-base/Fonts/Roboto_medium.ttf'),
        Ionicons: require("native-base/Fonts/Ionicons.ttf"),
      }),
    ])
    
    await updateDataStructure()  // needs to be after the persistStore call above

    this.setState({ isReady: true })

    // no need to wait for the following, but preload anyway
    // Asset.fromModule(require('./assets/images/drawer.png')).downloadAsync(),
    // the above line was causing a crash in development mode
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
            <GlobalNavigator />
          </PersistGate>
        </Provider>
      </Root>
    )
  }
}
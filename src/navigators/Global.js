import React from "react"
import { createStackNavigator, createAppContainer } from "react-navigation"
import { StyleSheet } from "react-native"

import HomeNavigator from "./Home.js"
import SearchResults from "../components/screens/SearchResults"
import VerseFocus from "../components/screens/VerseFocus"
import ErrorMessage from "../components/screens/ErrorMessage"

const styles = StyleSheet.create({
  hidden: {
    display: 'none',
  },
})

const noHeader = {
  navigationOptions: ({navigation}) => ({
    headerStyle: styles.hidden,
  }),
}

const GlobalNavigator = createStackNavigator(
  {
    Home: { screen: HomeNavigator, ...noHeader },
    SearchResults: { screen: SearchResults, ...noHeader },
    VerseFocus: { screen: VerseFocus, ...noHeader },
    ErrorMessage: { screen: ErrorMessage, ...noHeader },
  },
  {
    initialRouteName: "Home",
  }
)

export default createAppContainer(GlobalNavigator)
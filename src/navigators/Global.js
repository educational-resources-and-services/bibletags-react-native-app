import React from "react"
import { StackNavigator } from "react-navigation"
import { StyleSheet } from "react-native"

import HomeNavigator from "./Home.js"
import SearchResults from "../components/screens/SearchResults"
import VerseFocus from "../components/screens/VerseFocus"
import ErrorMessage from "../components/screens/ErrorMessage"

const noHeader = {
  navigationOptions: ({navigation}) => ({
    headerStyle: styles.hidden,
  }),
}

const GlobalNavigator = StackNavigator(
  {
    Home: { screen: HomeNavigator, ...noHeader },
    SearchResults: { screen: SearchResults, ...noHeader },
    VerseFocus: { screen: VerseFocus, ...noHeader },
    ErrorMessage: { screen: ErrorMessage, ...noHeader },
  },
)

const styles = StyleSheet.create({
  hidden: {
    display: 'none',
  },
})

export default GlobalNavigator
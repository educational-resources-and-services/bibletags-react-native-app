import React from "react"
import { createStackNavigator, createAppContainer } from "react-navigation"
import { StyleSheet } from "react-native"

import Home from "./Home.js"
import SearchResults from "../components/screens/SearchResults"
import VerseFocus from "../components/screens/VerseFocus"
import ErrorMessage from "../components/screens/ErrorMessage"

const styles = StyleSheet.create({
  hidden: {
    display: 'none',
  },
})

// const noHeader = {
//   navigationOptions: ({navigation}) => ({
//     headerStyle: styles.hidden,
//   }),
// }

const GlobalNavigator = createStackNavigator(
  {
    // Home: { screen: Home, ...noHeader },
    Home,
    SearchResults,
    VerseFocus,
    ErrorMessage,
  },
  {
    initialRouteName: "Home",
  }
)

export default createAppContainer(GlobalNavigator)
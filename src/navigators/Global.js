import React from "react"
import { createStackNavigator, createAppContainer } from "react-navigation"
import { StyleSheet } from "react-native"

import HomeNavigator from "./Home.js"
import Search from "../components/screens/Search"
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
    Search: { screen: Search, ...noHeader },
    VerseFocus: { screen: VerseFocus, ...noHeader },
    ErrorMessage: { screen: ErrorMessage, ...noHeader },
  },
  {
    initialRouteName: "Home",
  }
)

export default createAppContainer(GlobalNavigator)
import React from "react"
import { createStackNavigator, createAppContainer } from "react-navigation"
import { StyleSheet } from "react-native"

import HomeNavigator from "./Home.js"
import Search from "../components/screens/Search"
import VerseFocus from "../components/screens/VerseFocus"
import Versions from "../components/screens/Versions"
import LanguageChooser from "../components/screens/LanguageChooser"
import VersionInfo from "../components/screens/VersionInfo"
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
    Versions: { screen: Versions, ...noHeader },
    LanguageChooser: { screen: LanguageChooser, ...noHeader },
    VersionInfo: { screen: VersionInfo, ...noHeader },
    ErrorMessage: { screen: ErrorMessage, ...noHeader },
  },
  {
    initialRouteName: "Home",
  }
)

export default createAppContainer(GlobalNavigator)
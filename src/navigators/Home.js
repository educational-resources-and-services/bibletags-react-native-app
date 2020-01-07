import React from "react"
import { Platform, I18nManager } from "react-native"
import { createDrawerNavigator } from "react-navigation"

import Read from "../components/screens/Read"
import Drawer from "../components/major/Drawer"

const HomeNavigator = createDrawerNavigator(
  {
    Read: { screen: Read },
    // Read,
  },
  {
    drawerPosition: I18nManager.isRTL ? 'right' : 'left',
    contentComponent: props => <Drawer {...props} />,
    ...(Platform.OS === 'android' && I18nManager.isRTL ? { edgeWidth: -9999 } : {}),  // turn off for android rtl because it is buggy
  },
)

export default HomeNavigator
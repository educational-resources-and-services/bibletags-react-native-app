import React from "react"
import { Platform } from "react-native"
import { createDrawerNavigator } from "react-navigation"

import { RTL } from '../../language.js'

import Read from "../components/screens/Read"
import Drawer from "../components/major/Drawer"

const HomeNavigator = createDrawerNavigator(
  {
    Read: { screen: Read },
    // Read,
  },
  {
    drawerPosition: RTL ? 'right' : 'left',
    contentComponent: props => <Drawer {...props} />,
    ...(Platform.OS === 'android' && RTL ? { edgeWidth: -9999 } : {}),  // turn off for android rtl because it is buggy
  },
)

export default HomeNavigator
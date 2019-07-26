import React from "react"
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
    contentComponent: props => <Drawer {...props} />
  },
)

export default HomeNavigator
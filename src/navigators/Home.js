import React from "react"
import { createDrawerNavigator } from "react-navigation"

import Read from "../components/screens/Read"
import Drawer from "../components/major/Drawer"

const HomeNavigator = createDrawerNavigator(
  {
    Read: { screen: Read },
    // Read,
  },
  {
    drawerPosition: 'left',
    contentComponent: props => <Drawer {...props} />
  },
)

export default HomeNavigator
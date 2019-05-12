import React from "react"
import { DrawerNavigator } from "react-navigation"

import Read from "../components/screens/Read"
import Drawer from "../components/major/Drawer"

const HomeNavigator = DrawerNavigator(
  {
    Read: { screen: Read },
  },
  {
    contentComponent: props => <Drawer {...props} />
  },
)

export default HomeNavigator
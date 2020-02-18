import React from "react"
import { Switch, Route, Redirect } from "react-router-native"
// import SideMenu from "react-native-simple-side-menu"  // I have no idea why this won't work

import useRouterState from "../../hooks/useRouterState"

import SideMenu from "../major/SideMenu"
import Drawer from "../major/Drawer"
import Read from "../screens/Read"
import LanguageChooser from "../screens/LanguageChooser"
import ErrorMessage from "../screens/ErrorMessage"
import RouteSwitcher from "../../../RouteSwitcher"

const SideMenuAndRouteSwitcher = () => {

  const { pathname, historyGoBack, historyReplace } = useRouterState()

  return (
    <SideMenu
      open={/\/SideMenu(?:#.*)?$/.test(pathname)}
      onClose={historyGoBack}
      menu={<Drawer />}
    >

      <Switch>
        <Route path="/Read" component={Read} />
        <Route path="/LanguageChooser" component={LanguageChooser} />
        <Route path="/ErrorMessage" component={ErrorMessage} />
        <Route>
          <RouteSwitcher />
        </Route>
      </Switch>

      <Redirect exact from="/" to="/Read" />

    </SideMenu>
  )

}

export default SideMenuAndRouteSwitcher
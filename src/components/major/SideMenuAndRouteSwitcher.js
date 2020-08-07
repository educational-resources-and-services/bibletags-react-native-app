import React, { useEffect } from "react"
import { Switch, Route, Redirect } from "react-router-native"
// import SideMenu from "react-native-simple-side-menu"  // I have no idea why this won't work
import { bindActionCreators } from "redux"
import { connect } from "react-redux"

import syncBibleVersions from "../../utils/syncBibleVersions"
import useRouterState from "../../hooks/useRouterState"
import useBibleVersions from "../../hooks/useBibleVersions"
import useBack from "../../hooks/useBack"

import SideMenu from "../major/SideMenu"
import Drawer from "../major/Drawer"
import Read from "../screens/Read"
import LanguageChooser from "../screens/LanguageChooser"
import ErrorMessage from "../screens/ErrorMessage"
import RouteSwitcher from "../../../RouteSwitcher"

import { setBibleVersionDownloadStatus, removeBibleVersion } from "../../redux/actions"

const SideMenuAndRouteSwitcher = ({
  myBibleVersions,

  setBibleVersionDownloadStatus,
  removeBibleVersion,
}) => {

  const { pathname, historyGoBack } = useRouterState()

  const { versionIds } = useBibleVersions({ myBibleVersions })

  useEffect(
    () => {
      syncBibleVersions({
        versionIds,
        setBibleVersionDownloadStatus,
        removeBibleVersion,
      })
    },
    [ versionIds ],
  )

  useBack(pathname !== '/Read' && historyGoBack)

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

const mapStateToProps = ({ myBibleVersions }) => ({
  myBibleVersions,
})

const matchDispatchToProps = dispatch => bindActionCreators({
  setBibleVersionDownloadStatus,
  removeBibleVersion,
}, dispatch)

export default connect(mapStateToProps, matchDispatchToProps)(SideMenuAndRouteSwitcher)
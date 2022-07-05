import React, { useEffect, useState } from "react"
import { Routes, Route, Navigate } from "react-router-native"
// import SideMenu from "react-native-simple-side-menu"  // I have no idea why this won't work
import { bindActionCreators } from "redux"
import { connect } from "react-redux"

import syncBibleVersions from "../../utils/syncBibleVersions"
import syncData from "../../utils/syncData"
import useRouterState from "../../hooks/useRouterState"
import useBibleVersions from "../../hooks/useBibleVersions"
import useBack from "../../hooks/useBack"
import useNetwork from "../../hooks/useNetwork"

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
  const { online } = useNetwork()

  const { versionIds } = useBibleVersions({ myBibleVersions })

  const [ dataSyncStatus, setDataSyncStatus ] = useState('done')

  useEffect(
    () => {
      ;(async () => {

        await syncBibleVersions({
          versionIds,
          setBibleVersionDownloadStatus,
          removeBibleVersion,
        })

        if(online) {
          await syncData({
            versionIds,
            setDataSyncStatus,
          })
        }

      })()
    },
    [ versionIds, online ],
  )

  useBack(pathname !== '/Read' && historyGoBack)

  const open = /\/SideMenu(?:#.*)?$/.test(pathname)

  return (
    <SideMenu
      open={open}
      onClose={historyGoBack}
      menu={
        <Drawer
          open={open}
          dataSyncStatus={dataSyncStatus}
      />}
    >

      <Routes>
        <Route path="/" element={<Navigate to="/Read" replace />} />
        <Route path="/Read/*" element={<Read />} />
        <Route path="/LanguageChooser/*" element={<LanguageChooser />} />
        <Route path="/ErrorMessage/*" element={<ErrorMessage />} />
        <Route path="*" element={<RouteSwitcher />} />
      </Routes>

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
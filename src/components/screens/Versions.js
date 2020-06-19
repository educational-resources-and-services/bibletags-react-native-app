import React from "react"
import Constants from "expo-constants"
import { StyleSheet } from "react-native"
import { List } from '@ui-kitten/components'
import { Switch, Route } from "react-router-native"
import { i18n } from "inline-i18n"

import SafeLayout from "../basic/SafeLayout"
import VersionInfo from "./VersionInfo"
import BasicHeader from "../major/BasicHeader"
import VersionItem from "../basic/VersionItem"

const {
  PRIMARY_VERSIONS,
  SECONDARY_VERSIONS,
} = Constants.manifest.extra

const ALL_VERSIONS = [...new Set([ ...PRIMARY_VERSIONS, ...SECONDARY_VERSIONS ])]

const styles = StyleSheet.create({
  list: {
    paddingVertical: 10,
    backgroundColor: 'white',
  },
})

const Versions = () => {

  const renderItem = ({ item: versionId }) => (
    <VersionItem
      key={versionId}
      versionId={versionId}
    />
  )

  return (
    <Switch>
      <Route path="/Read/Versions/VersionInfo" component={VersionInfo} />
      <Route>

        <SafeLayout>
          <BasicHeader
            title={i18n("Bible version information")}
          />
          <List
            style={styles.list}
            data={ALL_VERSIONS}
            renderItem={renderItem}
          />
        </SafeLayout>

      </Route>
    </Switch>
  )

}

export default Versions
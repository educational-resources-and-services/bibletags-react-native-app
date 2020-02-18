import React, { useCallback } from "react"
import { StyleSheet, TouchableOpacity, Text } from "react-native"

import { getVersionInfo } from "../../utils/toolbox"
import useRouterState from "../../hooks/useRouterState"

const styles = StyleSheet.create({
  abbr: {
    width: 75,
    paddingRight: 10,
    fontWeight: 'bold',
    textAlign: 'left',
  },
  versionName: {
    textAlign: 'left',
    flex: 1,
  },
  listItem: {
    marginLeft: 0,
    paddingHorizontal: 20,
    paddingVertical: 10,
    flexDirection: 'row',
  },
})

const VersionItem = React.memo(({
  versionId,
}) => {

  const { historyPush } = useRouterState()

  const goVersionInfo = useCallback(
    event => {
      historyPush("/Read/Versions/VersionInfo", {
        versionId,
      })
    },
    [ versionId ],
  )

  const { name, abbr } = getVersionInfo(versionId)

  return (
    <TouchableOpacity
      onPress={goVersionInfo}
      style={styles.listItem}
    >
      <Text
        style={styles.abbr}
      >
        {abbr}
      </Text> 
      <Text style={styles.versionName}>
        {name}
      </Text> 
    </TouchableOpacity>
  )

})

export default VersionItem

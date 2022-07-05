import React, { useState } from "react"
import { StyleSheet, Text } from "react-native"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"
import { List } from "@ui-kitten/components"
import { i18n } from "inline-i18n"

import useThemedStyleSets from "../../hooks/useThemedStyleSets"
import useBibleVersions from "../../hooks/useBibleVersions"
import { getVersionInfo, memo } from '../../utils/toolbox'

import SafeLayout from "../basic/SafeLayout"
import BasicHeader from "../major/BasicHeader"
import VersionItem from "../basic/VersionItem"

import { addBibleVersion } from "../../redux/actions"

const styles = StyleSheet.create({
  list: {
    paddingVertical: 10,
  },
  label: {
    paddingHorizontal: 20,
    paddingVertical: 7,
    fontSize: 11,
    textAlign: 'left',  // needed so that it is flipped to right when rtl
  },
})

const AddVersion = ({
  style,
  labelStyle,

  eva: { style: themedStyle={} },

  myBibleVersions,

  addBibleVersion,
}) => {

  const { baseThemedStyle, labelThemedStyle } = useThemedStyleSets(themedStyle)

  const { unusedVersionIds } = useBibleVersions({ myBibleVersions })

  const [ message, setMessage ] = useState(i18n("Tap to add"))

  const renderItem = ({ item: versionId }) => (
    <VersionItem
      key={versionId}
      versionId={versionId}
      onPress={() => {
        addBibleVersion({
          id: versionId,
          download: true,
        })
        setMessage(
          i18n("Added {{version}} to download queue", {
            version: getVersionInfo(versionId).abbr
          })
        )
      }}
    />
  )

  return (
    <SafeLayout>
      <BasicHeader
        title={i18n("Add Bible Version")}
      />
      <Text
        style={[
          styles.label,
          labelThemedStyle,
          labelStyle,
        ]}
      >
        {message}
      </Text>
      <List
        style={[
          styles.list,
          baseThemedStyle,
          style,
        ]}
        data={unusedVersionIds}
        renderItem={renderItem}
      />
    </SafeLayout>
  )

}

const mapStateToProps = ({ myBibleVersions }) => ({
  myBibleVersions,
})

const matchDispatchToProps = dispatch => bindActionCreators({
  addBibleVersion,
}, dispatch)

 export default memo(connect(mapStateToProps, matchDispatchToProps)(AddVersion), { name: 'AddVersion' })
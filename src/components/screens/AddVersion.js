import React from "react"
import { StyleSheet, Text } from "react-native"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"
import { List, styled } from "@ui-kitten/components"
import { i18n } from "inline-i18n"

import useThemedStyleSets from "../../hooks/useThemedStyleSets"
import useBibleVersions from "../../hooks/useBibleVersions"
import useRouterState from "../../hooks/useRouterState"
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
  },
})

const AddVersion = ({
  style,
  labelStyle,

  themedStyle,

  myBibleVersions,

  addBibleVersion,
}) => {

  const { baseThemedStyle, labelThemedStyle } = useThemedStyleSets(themedStyle)

  const { unusedVersionIds } = useBibleVersions({ myBibleVersions })
  const { historyGoBack } = useRouterState()

  const renderItem = ({ item: versionId }) => (
    <VersionItem
      key={versionId}
      versionId={versionId}
      onPress={() => {
        addBibleVersion({
          id: versionId,
          download: true,
        })
        historyGoBack()
      }}
    />
  )

  return (
    <SafeLayout>
      <BasicHeader
        title={i18n("Add Bible version")}
      />
      <Text
        style={[
          styles.label,
          labelThemedStyle,
          labelStyle,
        ]}
      >
        {i18n("Tap to add")}
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

AddVersion.styledComponentName = 'AddVersion'

const mapStateToProps = ({ myBibleVersions }) => ({
  myBibleVersions,
})

const matchDispatchToProps = dispatch => bindActionCreators({
  addBibleVersion,
}, dispatch)

export default styled(connect(mapStateToProps, matchDispatchToProps)(AddVersion))
import React from "react"
import { StyleSheet, ScrollView, View, TouchableOpacity } from "react-native"
import { styled } from "@ui-kitten/components"

import Icon from "../basic/Icon"
import ChooserVersion from "../basic/ChooserVersion"

const styles = StyleSheet.create({
  container: {
    zIndex: 1,
    flexGrow: 0,
    height: 50,
    minHeight: 50,
  },
  content: {
    padding: 5,
    flexDirection: 'row',
  },
  contentContainer: {
    minWidth: '100%',
  },
  infoContainer: {
    alignSelf: 'stretch',
    justifyContent: 'center',
    paddingHorizontal: 14,
    marginRight: 30,
    paddingTop: 2,
  },
  info: {
    height: 18,
  },
})

const VersionChooser = React.memo(({
  versionIds,
  selectedVersionId,
  update,
  goVersions,
  closeParallelMode,
  style,

  themedStyle,
}) => {

  return (
    <ScrollView
      horizontal={true}
      style={[
        styles.container,
        themedStyle,
        style,
      ]}
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="always"
    >
      <View style={styles.content}>
        {versionIds.map(versionId => {
          const showCloseIcon = versionId === selectedVersionId && closeParallelMode

          return (
            <ChooserVersion
              key={versionId}
              versionId={versionId}
              uiStatus={versionId === selectedVersionId ? "selected" : "unselected"}
              onPress={showCloseIcon ? closeParallelMode : update}
              showCloseIcon={showCloseIcon}
            />
          )
        })}
        <TouchableOpacity
          style={styles.infoContainer}
          onPress={goVersions}
        >
          <Icon
            name="md-information-circle-outline"
            style={[
              styles.info,
              themedStyle,
              style,
            ]}
          />
        </TouchableOpacity>
      </View>
    </ScrollView>
  )

})

VersionChooser.styledComponentName = 'VersionChooser'

export default styled(VersionChooser)

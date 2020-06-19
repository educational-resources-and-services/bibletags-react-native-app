import React from "react"
import { StyleSheet, ScrollView, View, TouchableOpacity } from "react-native"
import Constants from "expo-constants"

import Icon from "../basic/Icon"
import ChooserVersion from "../basic/ChooserVersion"

const {
  CHOOSER_SELECTED_BACKGROUND_COLOR,
} = Constants.manifest.extra

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
    color: 'rgba(0, 0, 0, .5)',
    height: 18,
  },
})

const VersionChooser = React.memo(({
  versionIds,
  selectedVersionId,
  backgroundColor,
  update,
  goVersions,
  closeParallelMode,
}) => {

  return (
    <ScrollView
      horizontal={true}
      style={[
        styles.container,
        { backgroundColor },
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
              selected={versionId === selectedVersionId}
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
            style={styles.info}
          />
        </TouchableOpacity>
      </View>
    </ScrollView>
  )

})

export default VersionChooser

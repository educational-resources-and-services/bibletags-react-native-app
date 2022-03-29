import React from "react"
import { StyleSheet, ScrollView, View, TouchableOpacity } from "react-native"

import useThemedStyleSets from '../../hooks/useThemedStyleSets'
import { memo } from '../../utils/toolbox'

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

const VersionChooser = ({
  versionIds,
  selectedVersionId,
  update,
  goVersions,
  closeParallelMode,
  hideEditVersions,
  style,
  iconStyle,

  eva: { style: themedStyle={} },
}) => {

  const { baseThemedStyle, iconThemedStyle } = useThemedStyleSets(themedStyle)

  return (
    <ScrollView
      horizontal={true}
      style={[
        styles.container,
        baseThemedStyle,
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
        {!hideEditVersions &&
          <TouchableOpacity
            style={styles.infoContainer}
            onPress={goVersions}
          >
            <Icon
              pack="materialCommunity"
              name="pencil"
              style={[
                styles.info,
                iconThemedStyle,
                iconStyle,
              ]}
            />
          </TouchableOpacity>
          }
      </View>
    </ScrollView>
  )

}

export default memo(VersionChooser, { name: 'VersionChooser' })

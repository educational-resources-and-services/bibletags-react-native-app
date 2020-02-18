import React, { useCallback } from "react"
import { View, Text, StyleSheet, TouchableHighlight } from "react-native"
import Constants from "expo-constants"

import { getVersionInfo } from "../../utils/toolbox"

import Icon from "./Icon"

const {
  CHOOSER_SELECTED_BACKGROUND_COLOR,
  CHOOSER_SELECTED_TEXT_COLOR,
  CHOOSER_CHOOSING_BACKGROUND_COLOR,
} = Constants.manifest.extra

const styles = StyleSheet.create({
  version: {
    borderRadius: 20,
    paddingLeft: 18,
    paddingRight: 18,
  },
  versionText: {
    lineHeight: 40,
  },
  versionSelected: {
    backgroundColor: CHOOSER_SELECTED_BACKGROUND_COLOR,
  },
  versionTextSelected: {
    color: CHOOSER_SELECTED_TEXT_COLOR,
  },
  versionTextContainer: {
    flexDirection: 'row',
  },
  closeIcon: {
    fontSize: 15,
    color: 'rgba(255,255,255,.5)',
    lineHeight: 40,
    marginLeft: 10,
  },
})

const ChooserVersion = React.memo(({
  versionId,
  onPress,
  selected,
  showCloseIcon,
}) => {

  const goPress = useCallback(
    () => onPress(versionId),
    [ onPress, versionId ],
  )

  return (
    <TouchableHighlight
      underlayColor={CHOOSER_CHOOSING_BACKGROUND_COLOR}
      onPress={goPress}
      style={[
        styles.version,
        (selected ? styles.versionSelected : null),
      ]}
    >
      <View style={styles.versionTextContainer}>
        <Text
          style={[
            styles.versionText,
            (selected ? styles.versionTextSelected : null),
          ]}
        >{getVersionInfo(versionId).abbr}</Text>
        {!!showCloseIcon &&
          <Icon
            name="md-close"
            style={styles.closeIcon}
          />
        }
      </View>
    </TouchableHighlight>
  )

})

export default ChooserVersion
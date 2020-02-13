import React, { useCallback } from "react"
import { Icon } from "native-base"
import { View, Text, StyleSheet, TouchableHighlight } from "react-native"
import Constants from "expo-constants"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"

import { getVersionInfo } from "../../utils/toolbox"

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
  versionSelectedLowLight: {
    backgroundColor: 'rgba(247, 247, 247, 1)',
  },
  versionTextSelected: {
    color: CHOOSER_SELECTED_TEXT_COLOR,
  },
  versionTextSelectedLowLight: {
    color: 'black',
  },
  versionTextLowLight: {
    color: 'white',
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

const ChooserVersion = ({
  versionId,
  onPress,
  selected,
  showCloseIcon,

  displaySettings,
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
        (displaySettings.theme === 'low-light'
          ?
            (selected ? styles.versionSelectedLowLight : null)
          :
            (selected ? styles.versionSelected : null)
        ),
      ]}
    >
      <View style={styles.versionTextContainer}>
        <Text
          style={[
            styles.versionText,
            (displaySettings.theme === 'low-light'
              ?
                (selected ? styles.versionTextSelectedLowLight : styles.versionTextLowLight)
              :
                (selected ? styles.versionTextSelected : null)
            ),
          ]}
        >{getVersionInfo(versionId).abbr}</Text>
        {!!showCloseIcon &&
          <Icon
            name="md-close"
            style={[
              styles.closeIcon,
              displaySettings.theme === 'high-contrast' ? styles.contrast : null,
            ]}
          />
        }
      </View>
    </TouchableHighlight>
  )

}

const mapStateToProps = ({ displaySettings }) => ({
  displaySettings,
})

const matchDispatchToProps = dispatch => bindActionCreators({
  // setRef,
}, dispatch)

export default connect(mapStateToProps, matchDispatchToProps)(ChooserVersion)
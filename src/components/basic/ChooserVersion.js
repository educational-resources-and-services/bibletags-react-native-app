import React from "react"
import { Text, StyleSheet, TouchableHighlight } from "react-native"
import { Constants } from "expo"

import { getVersionAbbr } from "../../utils/toolbox"

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
})

class ChooserVersion extends React.PureComponent {

  onPress = () => {
    const { onPress, versionId } = this.props

    onPress(versionId)
  }

  render() {
    const { versionId, selected } = this.props

    return (
      <TouchableHighlight
        underlayColor={CHOOSER_CHOOSING_BACKGROUND_COLOR}
        onPress={this.onPress}
        style={[
          styles.version,
          (selected ? styles.versionSelected : null),
        ]}
      >
        <Text
          style={[
            styles.versionText,
            (selected ? styles.versionTextSelected : null),
          ]}
        >{getVersionAbbr(versionId)}</Text>
      </TouchableHighlight>
    )
  }
}

export default ChooserVersion
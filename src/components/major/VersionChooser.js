import React from "react"
import { View } from "native-base"
import { StyleSheet, FlatList } from "react-native"
import { Constants } from "expo"

import ChooserVersion from "../basic/ChooserVersion"

const {
  VERSION_CHOOSER_BACKGROUND_COLOR,
} = Constants.manifest.extra

const styles = StyleSheet.create({
  container: {
    zIndex: 1,
    backgroundColor: VERSION_CHOOSER_BACKGROUND_COLOR,
    padding: 10,
  },
})

class VersionChooser extends React.PureComponent {

  keyExtractor = versionId => versionId

  renderItem = ({ item, index }) => {
    const { selectedVersionId, update } = this.props

    return (
      <ChooserVersion
        versionId={item}
        selected={item === selectedVersionId}
        onPress={update}
      />
    )
  }

  render() {
    const { versionIds, selectedVersionId } = this.props

    return (
      <View style={styles.container}>
        <FlatList
          horizontal={true}
          data={versionIds}
          extraData={this.props}
          keyExtractor={this.keyExtractor}
          renderItem={this.renderItem}
        />
      </View>
    )
  }
}

export default VersionChooser
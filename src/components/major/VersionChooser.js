import React from "react"
import { View } from "native-base"
import { StyleSheet, FlatList } from "react-native"

import ChooserVersion from "../basic/ChooserVersion"

const styles = StyleSheet.create({
  container: {
    zIndex: 1,
    padding: 5,
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
    const { versionIds, selectedVersionId, backgroundColor } = this.props

    return (
      <View
        style={[
          styles.container,
          { backgroundColor },
        ]}
      >
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
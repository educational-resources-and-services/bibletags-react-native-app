import React from "react"
import { Content } from "native-base"
import { StyleSheet } from "react-native"

import ChooserVersion from "../basic/ChooserVersion"

const styles = StyleSheet.create({
  container: {
    zIndex: 1,
    padding: 5,
    flexGrow: 0,
    height: 50,
    minHeight: 50,
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
    const { versionIds, selectedVersionId, backgroundColor, update } = this.props

    return (
      <Content
        horizontal={true}
        style={[
          styles.container,
          { backgroundColor },
        ]}
      >
        {versionIds.map(versionId => (
          <ChooserVersion
            key={versionId}
            versionId={versionId}
            selected={versionId === selectedVersionId}
            onPress={update}
          />
        ))}
      </Content>
    )
  }
}

export default VersionChooser
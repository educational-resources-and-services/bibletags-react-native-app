import React from "react"
import { Content, Button, Icon } from "native-base"
import { StyleSheet } from "react-native"
import { Constants } from "expo"

import ChooserVersion from "../basic/ChooserVersion"

const {
  CHOOSER_SELECTED_BACKGROUND_COLOR,
} = Constants.manifest.extra

const styles = StyleSheet.create({
  container: {
    zIndex: 1,
    padding: 5,
    flexGrow: 0,
    height: 50,
    minHeight: 50,
  },
  info: {
    color: CHOOSER_SELECTED_BACKGROUND_COLOR,
    fontSize: 20,
    lineHeight: 18,
    opacity: .75,
    marginRight: 30,
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
    const { versionIds, selectedVersionId, backgroundColor, update, goVersions } = this.props

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
        <Button
          transparent
          onPress={goVersions}
        >
          <Icon
            name="information-circle-outline"
            style={styles.info}
          />
        </Button>
      </Content>
    )
  }
}

export default VersionChooser
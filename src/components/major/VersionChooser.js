import React from "react"
import { Content, Button, Icon } from "native-base"
import { StyleSheet, ScrollView, View } from "react-native"
import Constants from "expo-constants"

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
  info: {
    color: CHOOSER_SELECTED_BACKGROUND_COLOR,
    fontSize: 20,
    lineHeight: 18,
    opacity: .75,
    marginRight: 30,
  },
})

class VersionChooser extends React.PureComponent {

  render() {
    const { versionIds, selectedVersionId, backgroundColor, update, goVersions } = this.props

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
        </View>
      </ScrollView>
    )
  }
}

export default VersionChooser
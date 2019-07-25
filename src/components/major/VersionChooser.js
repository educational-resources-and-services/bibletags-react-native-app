import React from "react"
import { Content, Button, Icon } from "native-base"
import { StyleSheet, ScrollView, View } from "react-native"
import { Constants } from "expo"

import { RTL } from "../../../language.js"

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
    ...(RTL ? { flexDirection: 'row-reverse' } : {}),
  },
  info: {
    color: CHOOSER_SELECTED_BACKGROUND_COLOR,
    fontSize: 20,
    lineHeight: 18,
    opacity: .75,
    [RTL ? 'marginLeft' : 'marginRight']: 30,
  },
})

class VersionChooser extends React.PureComponent {

  componentDidMount() {
    setTimeout(() => this.ref.scrollToEnd({ animated: false }))
  }

  setRef = ref => this.ref = ref

  render() {
    const { versionIds, selectedVersionId, backgroundColor, update, goVersions } = this.props

    return (
      <ScrollView
        horizontal={true}
        style={[
          styles.container,
          { backgroundColor },
        ]}
        ref={this.setRef}
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
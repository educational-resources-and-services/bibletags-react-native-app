import React from "react"
import { Content, Button, Icon } from "native-base"
import { StyleSheet, ScrollView, View } from "react-native"
import Constants from "expo-constants"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"

import ChooserVersion from "../basic/ChooserVersion"

import { setMode } from "../../redux/actions.js"

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
  lowLight: {
    color: 'white',
  },
})

class VersionChooser extends React.PureComponent {

  render() {
    const { versionIds, selectedVersionId, backgroundColor, update, goVersions, closeParallelMode, displaySettings } = this.props

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
          {versionIds.map(versionId => {
            const showCloseIcon = versionId === selectedVersionId && closeParallelMode

            return (
              <ChooserVersion
                key={versionId}
                versionId={versionId}
                selected={versionId === selectedVersionId}
                onPress={showCloseIcon ? closeParallelMode : update}
                showCloseIcon={showCloseIcon}
              />
            )
          })}
          <Button
            transparent
            onPress={goVersions}
          >
            <Icon
              name="information-circle-outline"
              style={[
                styles.info,
                displaySettings.theme === 'low-light' ? styles.lowLight : null,
              ]}
            />
          </Button>
        </View>
      </ScrollView>
    )
  }
}

const mapStateToProps = ({ displaySettings }) => ({
  displaySettings,
})

const matchDispatchToProps = dispatch => bindActionCreators({
  setMode,
}, dispatch)

export default connect(mapStateToProps, matchDispatchToProps)(VersionChooser)

import React from "react"
import { StyleSheet, View } from "react-native"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"
import { Container, Content, Body, Text } from "native-base"

import { getVersionInfo } from "../../utils/toolbox"

import BasicHeader from "../major/BasicHeader"

const styles = StyleSheet.create({
  body: {
    padding: 20,
    width: '100%',
  },
  copyright: {
    lineHeight: 24,
  },
  view: {
    width: '100%',
  },
  lowLight: {
    backgroundColor: 'black',
    color: 'white',
  },
})

class VersionInfo extends React.Component {

  render() {
    const { navigation, displaySettings } = this.props
    const { versionId } = navigation.state.params || {}

    const { theme } = displaySettings

    const { name, copyright } = getVersionInfo(versionId)

    return (
      <Container style={displaySettings.theme === 'low-light' ? styles.lowLight: null}>
        <BasicHeader
          navigation={navigation}
          title={name}
        />
        <Content>
          <Body style={[
            styles.body,
            displaySettings.theme === 'low-light' ? styles.lowLight: null,
            ]}
          >
            <View style={styles.view}
            >
              <Text style={[
                styles.copyright,
                displaySettings.theme === 'low-light' ? styles.lowLight: null,
              ]}
              >
                {copyright}
              </Text>
            </View>
          </Body>
        </Content>
      </Container>
    )
  }
}

const mapStateToProps = ({ displaySettings }) => ({
  displaySettings,
})

const matchDispatchToProps = dispatch => bindActionCreators({
  // setTheme,
}, dispatch)

export default connect(mapStateToProps, matchDispatchToProps)(VersionInfo)

import React from "react"
import { StyleSheet, View, Linking } from "react-native"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"
import { Container, Content, Body, Text } from "native-base"

import { getVersionInfo, replaceWithJSX } from "../../utils/toolbox"

import BasicHeader from "../major/BasicHeader"

const styles = StyleSheet.create({
  body: {
    padding: 20,
    width: '100%',
  },
  copyrightLine: {
    marginBottom: 15,
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
  link: {
    color: 'blue',
    textDecorationLine: 'underline',
  },
})

class VersionInfo extends React.Component {

  render() {
    const { navigation, displaySettings } = this.props
    const { versionId } = navigation.state.params || {}

    const { theme } = displaySettings

    const { name, copyright } = getVersionInfo(versionId)

    return (
      <Container style={displaySettings.theme === 'low-light' ? styles.lowLight: {}}>
        <BasicHeader
          navigation={navigation}
          title={name}
        />
        <Content>
          <Body
            style={[
              styles.body,
              displaySettings.theme === 'low-light' ? styles.lowLight: null,
            ]}
          >
            <View style={styles.view}>
              {copyright.split(/\n/g).map((copyrightLine, idx) => (
                <View
                  key={idx}
                  style={styles.copyrightLine}
                >
                  <Text style={[
                    styles.copyright,
                    displaySettings.theme === 'low-light' ? styles.lowLight: null,
                  ]}
                  >
                    {replaceWithJSX(copyrightLine, '<a href="([^"]+)">([^<]+)<\/a>', (x, href, linkText) => (
                      <Text
                        style={styles.link}
                        onPress={() => Linking.openURL(href)}
                      >
                        {linkText}
                      </Text>
                    ))}
                  </Text>
                </View>
              ))}
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

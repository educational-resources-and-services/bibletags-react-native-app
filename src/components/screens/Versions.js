import React from "react"
import Constants from "expo-constants"
import { StyleSheet, View } from "react-native"
import { Container, Content, Body, Text, List } from "native-base"

import i18n from "../../utils/i18n.js"
import { getVersionInfo } from "../../utils/toolbox"

import BasicHeader from "../major/BasicHeader"
import VersionItem from "../basic/VersionItem"

const {
  PRIMARY_VERSIONS,
  SECONDARY_VERSIONS,
} = Constants.manifest.extra

const ALL_VERSIONS = [...new Set([ ...PRIMARY_VERSIONS, ...SECONDARY_VERSIONS ])]

const styles = StyleSheet.create({
  body: {
    width: '100%',
  },
  list: {
    width: '100%',
  },
})

class Versions extends React.Component {

  render() {
    const { navigation } = this.props

    return (
      <Container>
        <BasicHeader
          navigation={navigation}
          title={i18n("Bible version information")}
        />
        <Content>
          <Body style={styles.body}>
            <List style={styles.list}>
              {ALL_VERSIONS.map(versionId => (
                <VersionItem
                  key={versionId}
                  navigation={navigation}
                  versionId={versionId}
                />
              ))}
            </List>
          </Body>
        </Content>
      </Container>
    )
  }
}

export default Versions

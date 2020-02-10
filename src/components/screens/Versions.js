import React from "react"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"
import Constants from "expo-constants"
import { StyleSheet } from "react-native"
import { Container, Content, Body, List } from "native-base"

import { i18n } from "inline-i18n"

import BasicHeader from "../major/BasicHeader"
import VersionItem from "../basic/VersionItem"

const {
  PRIMARY_VERSIONS,
  SECONDARY_VERSIONS,
} = Constants.manifest.extra

const ALL_VERSIONS = [...new Set([ ...PRIMARY_VERSIONS, ...SECONDARY_VERSIONS ])]

const styles = StyleSheet.create({
  containerLowLight: {
    backgroundColor: 'black',
  },
  body: {
    width: '100%',
  },
  bodyLowLight: {
    backgroundColor: 'black',
  },
  list: {
    width: '100%',
  },
  listLowLight: {
    color: 'white',
  },
})

const Versions = ({
  navigation,

  displaySettings,
}) => {

  const { theme } = displaySettings

  return (
    <Container style={theme === 'low-light' ? styles.containerLowLight : {}}>
      <BasicHeader
        navigation={navigation}
        title={i18n("Bible version information")}
      />
      <Content>
        <Body
          style={[
            styles.body,
            (theme === 'low-light' ? styles.bodyLowLight : null),
          ]}
        >
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

const mapStateToProps = ({ displaySettings }) => ({
  displaySettings,
})

const matchDispatchToProps = dispatch => bindActionCreators({
  // setTheme,
}, dispatch)

export default connect(mapStateToProps, matchDispatchToProps)(Versions)
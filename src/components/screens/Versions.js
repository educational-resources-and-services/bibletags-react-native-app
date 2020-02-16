import React from "react"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"
import Constants from "expo-constants"
import { StyleSheet } from "react-native"
import { Container, Content, Body, List } from "native-base"
import { Switch, Route } from "react-router-native"

import { i18n } from "inline-i18n"

import VersionInfo from "./VersionInfo"
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
  displaySettings,
}) => {

  const { theme } = displaySettings

  return (
    <Switch>
      <Route path="/Versions/VersionInfo" component={VersionInfo} />
      <Route>

        <Container style={theme === 'low-light' ? styles.containerLowLight : {}}>
          <BasicHeader
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
                    versionId={versionId}
                  />
                ))}
              </List>
            </Body>
          </Content>
        </Container>

      </Route>
    </Switch>
  )

}

const mapStateToProps = ({ displaySettings }) => ({
  displaySettings,
})

const matchDispatchToProps = dispatch => bindActionCreators({
  // setTheme,
}, dispatch)

export default connect(mapStateToProps, matchDispatchToProps)(Versions)
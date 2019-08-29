import React from "react"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"
import { Image, StyleSheet, Linking } from "react-native"
import { ListItem, Body, View, Text } from "native-base"

import i18n from "../../utils/i18n.js"
import { debounce, getVersionInfo } from "../../utils/toolbox"

const styles = StyleSheet.create({
  abbr: {
    width: 60,
  },
  abbrText: {
    fontWeight: 'bold',
    textAlign: 'left',
  },
  versionName: {
    textAlign: 'left',
  },
  image: {
    width: '100%',
    height: 0,
    paddingBottom: '50%',
    resizeMode: 'cover',
    backgroundColor: 'white',
  },
  listItem: {
    marginLeft: 0,
    paddingLeft: 20,
    paddingRight: 20,
  },
  listItemLowLight: {
    color: 'white',
  },
})

class VersionItem extends React.PureComponent {

  goVersionInfo = event => {
    const { navigation, versionId } = this.props

    debounce(
      navigation.navigate,
      "VersionInfo",
      {
        versionId,
      }
    )
  }

  render() {
    const { versionId, displaySettings } = this.props

    const { theme } = displaySettings

    const { name, abbr } = getVersionInfo(versionId)

    return (
      <ListItem
        button={true}
        onPress={this.goVersionInfo}
        style={styles.listItem}
      >
      <View style={styles.abbr}>
        <Text
          style={[
            styles.abbrText,
            displaySettings.theme === 'low-light' ? styles.listItemLowLight: null,
          ]}
        >
            {abbr}
          </Text> 
        </View>
        <Body>
          <Text
            style={[
              styles.versionName,
              displaySettings.theme === 'low-light' ? styles.listItemLowLight: null,
            ]}
          >
            {name}
          </Text> 
        </Body>
      </ListItem>
    )
  }
}

const mapStateToProps = ({ displaySettings }) => ({
  displaySettings,
})

const matchDispatchToProps = dispatch => bindActionCreators({
  // setTheme,
}, dispatch)

export default connect(mapStateToProps, matchDispatchToProps)(VersionItem)

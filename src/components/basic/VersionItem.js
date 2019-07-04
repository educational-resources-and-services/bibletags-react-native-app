import React from "react"
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
    const { versionId } = this.props

    const { name, abbr } = getVersionInfo(versionId)

    return (
      <ListItem
        button={true}
        onPress={this.goVersionInfo}
        style={styles.listItem}
      >
        <View style={styles.abbr}>
          <Text style={styles.abbrText}>
            {abbr}
          </Text> 
        </View>
        <Body>
          <Text>{name}</Text> 
        </Body>
      </ListItem>
    )
  }
}

export default VersionItem

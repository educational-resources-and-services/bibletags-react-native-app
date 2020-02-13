import React, { useCallback } from "react"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"
import { StyleSheet } from "react-native"
import { ListItem, Body, View, Text } from "native-base"

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

const VersionItem = React.memo(({
  navigation,
  versionId,

  displaySettings,
}) => {

  const goVersionInfo = useCallback(
    event => {
      debounce(
        navigation.navigate,
        "VersionInfo",
        {
          versionId,
        }
      )
    },
    [ navigation, versionId ],
  )

  const { theme } = displaySettings

  const { name, abbr } = getVersionInfo(versionId)

  return (
    <ListItem
      button={true}
      onPress={goVersionInfo}
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

})

const mapStateToProps = ({ displaySettings }) => ({
  displaySettings,
})

const matchDispatchToProps = dispatch => bindActionCreators({
  // setTheme,
}, dispatch)

export default connect(mapStateToProps, matchDispatchToProps)(VersionItem)

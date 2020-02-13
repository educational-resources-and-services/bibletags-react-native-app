import React, { useCallback } from "react"
import { bindActionCreators } from "redux"
import { Updates } from "expo"
import Constants from "expo-constants"
import { connect } from "react-redux"
import { AsyncStorage, StyleSheet } from "react-native"
import { ListItem, Body, Text } from "native-base"

import { getLocale } from "inline-i18n"
import { fixRTL } from "../../utils/toolbox"

const {
  INPUT_HIGHLIGHT_COLOR,
} = Constants.manifest.extra

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
  selected: {
    fontWeight: 'bold',
    color: INPUT_HIGHLIGHT_COLOR,
  },
})

const LanguageItem = ({
  navigation,
  locale,
  label,

  displaySettings,
}) => {

  const goChangeLanguage = useCallback(
    async event => {
      navigation.goBack()

      if(getLocale() !== locale) {
        await AsyncStorage.setItem(`uiLocale`, locale)
        await AsyncStorage.removeItem(`fixedRTL`)
        await fixRTL(locale)
        Updates.reloadFromCache()
      }
    },
    [ locale, navigation ],
  )

  const selected = getLocale() === locale

  return (
    <ListItem
      button={true}
      onPress={goChangeLanguage}
      style={styles.listItem}
    >
      <Body>
        <Text
          style={[
            styles.versionName,
            displaySettings.theme === 'low-light' ? styles.listItemLowLight: null,
            selected ? styles.selected : null,
          ]}
        >
          {label}
        </Text> 
      </Body>
    </ListItem>
  )

}

const mapStateToProps = ({ displaySettings }) => ({
  displaySettings,
})

const matchDispatchToProps = dispatch => bindActionCreators({
  // setTheme,
}, dispatch)

export default connect(mapStateToProps, matchDispatchToProps)(LanguageItem)

import React, { useCallback } from "react"
import { Updates } from "expo"
import Constants from "expo-constants"
import { AsyncStorage, StyleSheet } from "react-native"
import { ListItem } from '@ui-kitten/components'
import { getLocale } from "inline-i18n"

import { fixRTL } from "../../utils/toolbox"
import useRouterState from "../../hooks/useRouterState"

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
  selected: {
    fontWeight: 'bold',
    color: INPUT_HIGHLIGHT_COLOR,
  },
})

const LanguageItem = React.memo(({
  locale,
  label,
}) => {

  const { historyGoBack } = useRouterState()

  const goChangeLanguage = useCallback(
    async event => {

      historyGoBack()

      if(getLocale() !== locale) {
        await AsyncStorage.setItem(`uiLocale`, locale)
        await AsyncStorage.removeItem(`fixedRTL`)
        await fixRTL(locale)
        Updates.reloadFromCache()
      }
    },
    [ locale ],
  )

  const selected = getLocale() === locale

  return (
    <ListItem
      title={label}
      onPress={goChangeLanguage}
      style={styles.listItem}
      titleStyle={[
        styles.versionName,
        selected ? styles.selected : null,
      ]}
    />
  )

})

export default LanguageItem

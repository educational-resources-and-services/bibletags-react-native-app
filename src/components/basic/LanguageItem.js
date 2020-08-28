import React, { useCallback } from "react"
import * as Updates from 'expo-updates'
import { AsyncStorage, StyleSheet } from "react-native"
import { ListItem } from "@ui-kitten/components"

import { getLocale } from "inline-i18n"

import { fixRTL, memo } from "../../utils/toolbox"
import useRouterState from "../../hooks/useRouterState"

const styles = StyleSheet.create({
  versionName: {
    textAlign: 'left',
  },
  listItem: {
    marginLeft: 0,
    paddingLeft: 20,
    paddingRight: 20,
  },
})

const LanguageItem = ({
  locale,
  label,
  style,

  themedStyle,
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

  return (
    <ListItem
      title={label}
      onPress={goChangeLanguage}
      style={styles.listItem}
      titleStyle={[
        styles.versionName,
        themedStyle,
        style,
      ]}
    />
  )

}

export default memo(LanguageItem, { name: 'LanguageItem' })

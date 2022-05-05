import React, { useCallback } from "react"
import { StyleSheet, Text } from "react-native"
import { ListItem } from "@ui-kitten/components"

import { getLocale } from "inline-i18n"

import { fixRTL, memo, setAsyncStorage, removeAsyncStorage } from "../../utils/toolbox"
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

  eva: { style: themedStyle={} },
}) => {

  const { historyGoBack } = useRouterState()

  const goChangeLanguage = useCallback(
    async event => {

      historyGoBack()

      if(getLocale() !== locale) {
        await setAsyncStorage(`uiLocale`, locale)
        await removeAsyncStorage(`fixedRTL`)
        await fixRTL({ locale, forceReload: true })
      }
    },
    [ locale ],
  )

  return (
    <ListItem
      title={evaProps => (
        <Text
          {...evaProps}
          style={[
            styles.versionName,
            themedStyle,
            style,
          ]}
        >
          {label}
        </Text>
      )}
      onPress={goChangeLanguage}
      style={styles.listItem}
    />
  )

}

export default memo(LanguageItem, { name: 'LanguageItem' })

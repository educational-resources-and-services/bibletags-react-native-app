import React from "react"
import { StyleSheet } from "react-native"
import { List, styled } from '@ui-kitten/components'
import { i18n, getLocale } from "inline-i18n"

import { languageOptions } from "../../../language"

import SafeLayout from "../basic/SafeLayout"
import BasicHeader from "../major/BasicHeader"
import LanguageItem from "../basic/LanguageItem"

const styles = StyleSheet.create({
  list: {
    paddingTop: 10,
  },
})

const LanguageChooser = ({
  style,

  themedStyle,
}) => {

  const renderItem = ({ item: { locale, label } }) => (
    <LanguageItem
      key={locale}
      locale={locale}
      label={label}
      uiStatus={getLocale() === locale ? "selected" : "unselected"}
    />
  )

  return (
    <SafeLayout>
      <BasicHeader
        title={i18n("Change app language")}
      />
      <List
        style={[
          styles.list,
          themedStyle,
          style,
        ]}
        data={languageOptions}
        renderItem={renderItem}
      />
    </SafeLayout>
  )

}

LanguageChooser.styledComponentName = 'LanguageChooser'

export default styled(LanguageChooser)
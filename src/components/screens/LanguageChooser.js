import React from "react"
import { StyleSheet } from "react-native"
import { List } from '@ui-kitten/components'
import { i18n, getLocale } from "inline-i18n"

import { languageOptions } from "../../../language"

import SafeLayout from "../basic/SafeLayout"
import BasicHeader from "../major/BasicHeader"
import LanguageItem from "../basic/LanguageItem"

const styles = StyleSheet.create({
  list: {
    paddingTop: 10,
    backgroundColor: 'white',
  },
})

const LanguageChooser = () => {

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
        style={styles.list}
        data={languageOptions}
        renderItem={renderItem}
      />
    </SafeLayout>
  )

}

export default LanguageChooser
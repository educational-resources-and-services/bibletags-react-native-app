import React from "react"
import { StyleSheet, Text, View } from "react-native"
import { getMorphPartDisplayInfo, getIsEntirelyPrefixAndSuffix } from "@bibletags/bibletags-ui-helper"
import { i18n } from "inline-i18n"

import { getMorphInfo } from "../../utils/toolbox"

const styles = StyleSheet.create({
  container: {
    paddingVertical: 2,
  },
  morph: {
  },
  indeclinable: {
    color: '#999',
  },
})

const Parsing = ({
  morph,
  strong,
  onLayout,
}) => {

  const resetAndReturn = () => {
    onLayout && onLayout(0, 0)
    return null
  }

  if(!morph) return resetAndReturn()

  const isEntirelyPrefixAndSuffix = getIsEntirelyPrefixAndSuffix({ strong })

  const { morphLang, morphParts, mainPartIdx } = getMorphInfo(morph)

  let contents = morphParts.map((morphPart, idx) => {

    const isPrefixOrSuffix = isEntirelyPrefixAndSuffix || idx !== mainPartIdx
    const wordIsMultiPart = morphParts.length > 1
    const { str, color } = getMorphPartDisplayInfo({ morphLang, morphPart, isPrefixOrSuffix, wordIsMultiPart })

    if(!str) return null

    return (
      <Text
        key={`${idx} ${str} ${color}`}
        style={color ? { color } : undefined}
      >
        {idx > 0 && (
          <Text>{i18n(" + ", "combination character")}</Text>
        )}
        {str}
      </Text>
    )

  })

  if(contents.filter(Boolean).length === 0) {
    contents = (
      <Text style={styles.indeclinable}>
        {i18n("indeclinable")}
      </Text>
    )
  }

  return (
    <View
      style={styles.container}
      onLayout={onLayout}
    >
      <Text style={styles.morph}>
        {contents}
      </Text>
    </View>
  )

}

export default Parsing
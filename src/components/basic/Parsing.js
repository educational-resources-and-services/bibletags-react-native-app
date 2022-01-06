import React from "react"
import { StyleSheet, Text, View } from "react-native"
import { getMorphPartDisplayInfo, getIsEntirelyPrefixAndSuffix,
         getNormalizedPOSCode, getMainWordPartIndex } from "@bibletags/bibletags-ui-helper"
import { i18n } from "inline-i18n"

const styles = StyleSheet.create({
  container: {
    borderColor: 'rgba(0, 0, 0, .15)',
    borderBottomWidth: 1,
    paddingVertical: 15,
    paddingHorizontal: 18,
  },
  morph: {
  },
})

const Parsing = ({
  selectedInfo,
  onLayout,
}) => {

  const { morph } = selectedInfo || {}

  const resetAndReturn = () => {
    onLayout(0, 0)
    return null
  }

  if(!morph) return resetAndReturn()

  const isEntirelyPrefixAndSuffix = getIsEntirelyPrefixAndSuffix(selectedInfo)

  const morphLang = morph.substr(0,2)
  let morphParts
  let mainPartIdx
  let morphPos

  if(['He','Ar'].includes(morphLang)) {
    morphParts = morph.substr(3).split(':')
    mainPartIdx = getMainWordPartIndex(morphParts)
    morphPos = morphParts[mainPartIdx].substr(0,1)
  } else {
    morphParts = [ morph.substr(3) ]
    mainPartIdx = 0
    morphPos = getNormalizedPOSCode({ morphLang, morphPos: morph.substr(3,2) })
  }

  const contents = morphParts.map((morphPart, idx) => {

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

  if(contents.filter(Boolean).length === 0) return resetAndReturn()

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
import React, { useCallback } from "react"
import { Text } from "react-native"
import { getMorphInfo } from "@bibletags/bibletags-ui-helper"

const OriginalWordWithColoredWordParts = ({
  text,
  children=[],
  morph='',
  selected,
  wordIdx,
  setSelectedWordIdx,
  semiSelectedVsThemedStyle,
}) => {

  const { morphLang } = getMorphInfo(morph)
  const language = ['He','Ar'].includes(morphLang) ? `heb` : `grc`

  const goSetSelectedWordIdx = useCallback(() => setSelectedWordIdx(wordIdx), [ setSelectedWordIdx, wordIdx ])

  return (text ? [{ text }] : children).map(({ text, color=`black`, notIncludedInTag }, idx) => (
    <Text
      key={`${idx} ${color}`}
      style={{
        ...(notIncludedInTag ? semiSelectedVsThemedStyle : { color }),
        ...(selected ? { backgroundColor: '#F2F2F2' } : {}),
        fontFamily: `original-${language}`,
      }}
      onPress={setSelectedWordIdx ? goSetSelectedWordIdx : undefined}
    >
      {text}
    </Text>
  ))

}

export default OriginalWordWithColoredWordParts
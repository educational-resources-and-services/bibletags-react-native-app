import React, { useCallback } from "react"
import { Text } from "react-native"

import { getMorphInfo } from "../../utils/toolbox"

const OriginalWordWithColoredWordParts = ({
  text,
  children=[],
  morph='',
  selected,
  wordIdx,
  setSelectedWordIdx,
}) => {

  const { morphLang } = getMorphInfo(morph)
  const language = ['He','Ar'].includes(morphLang) ? `heb` : `grk`

  const goSetSelectedWordIdx = useCallback(() => setSelectedWordIdx(wordIdx), [ setSelectedWordIdx, wordIdx ])

  return (text ? [{ text }] : children).map(({ text, color }, idx) => (
    <Text
      key={`${idx} ${color}`}
      style={{
        ...(color ? { color } : {}),
        ...(selected ? { textDecorationLine: 'underline' } : {}),
        fontFamily: `original-${language}`,
      }}
      onPress={setSelectedWordIdx ? goSetSelectedWordIdx : undefined}
    >
      {text}
    </Text>
  ))

}

export default OriginalWordWithColoredWordParts
import React from "react"
import { Text } from "react-native"

import { getMorphInfo } from "../../utils/toolbox"

const OriginalWordWithColoredWordParts = ({
  text,
  children=[],
  morph='',
}) => {

  const { morphLang } = getMorphInfo(morph)
  const language = ['He','Ar'].includes(morphLang) ? `heb` : `grk`

  return (text ? [{ text }] : children).map(({ text, color }, idx) => (
    <Text
      key={`${idx} ${color}`}
      style={{
        ...(color ? { color } : {}),
        fontFamily: `original-${language}`,
      }}
    >
      {text}
    </Text>
  ))

}

export default OriginalWordWithColoredWordParts
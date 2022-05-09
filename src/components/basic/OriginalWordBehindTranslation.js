import React from "react"
import { StyleSheet, Text } from "react-native"

import OriginalWordWithColoredWordParts from "./OriginalWordWithColoredWordParts"

const styles = StyleSheet.create({
  container: {
    fontSize: 16,
    paddingVertical: 1,
  },
})

const OriginalWordBehindTranslation = ({
  originalWordsInfo,
  selectedWordIdx,  // this and the next prop used for situations where two orig words are tagged together
  setSelectedWordIdx,
  onLayout,
}) => {

  const { morph, text, children, status } = originalWordsInfo[0] || {}

  return (
    <Text
      style={styles.container}
      onLayout={onLayout}
    >
      <OriginalWordWithColoredWordParts
        text={text}
        children={children}
        morph={morph}
      />
    </Text>
  )

}

export default OriginalWordBehindTranslation
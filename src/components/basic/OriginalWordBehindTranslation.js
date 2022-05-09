import React from "react"
import { StyleSheet, Text } from "react-native"

import OriginalWordWithColoredWordParts from "./OriginalWordWithColoredWordParts"

const styles = StyleSheet.create({
  container: {
    fontSize: 16,
    paddingVertical: 2,
  },
})

const OriginalWordBehindTranslation = ({
  originalWordsInfo,
  selectedWordIdx,  // this and the next prop used for situations where two orig words are tagged together
  setSelectedWordIdx,
  onLayout,
}) => {

  return (
    <Text
      style={styles.container}
      onLayout={onLayout}
    >
      {originalWordsInfo.map(({ morph, text, children, status }, idx) => (
        <React.Fragment key={idx}>
          {idx > 0 && ` `}
          <OriginalWordWithColoredWordParts
            text={text}
            children={children}
            morph={morph}
            selected={originalWordsInfo.length > 1 && idx === selectedWordIdx}
            wordIdx={idx}
            setSelectedWordIdx={originalWordsInfo.length > 1 && setSelectedWordIdx}
          />
        </React.Fragment>
      ))}
    </Text>
  )

}

export default OriginalWordBehindTranslation
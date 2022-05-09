import React from "react"
import { StyleSheet, Text } from "react-native"
import { i18n } from "inline-i18n"

import useThemedStyleSets from "../../hooks/useThemedStyleSets"
import { memo } from '../../utils/toolbox'

import OriginalWordWithColoredWordParts from "./OriginalWordWithColoredWordParts"

const styles = StyleSheet.create({
  container: {
    fontSize: 16,
    paddingVertical: 2,
  },
  translatedFrom: {
    fontSize: 14,
  },
})

const OriginalWordBehindTranslation = ({
  originalWordsInfo,
  selectedWordIdx,  // this and the next prop used for situations where two orig words are tagged together
  setSelectedWordIdx,
  onLayout,
  labelStyle,

  eva: { style: themedStyle={} },
}) => {

  const { labelThemedStyle } = useThemedStyleSets(themedStyle)

  return (
    <Text
      style={styles.container}
      onLayout={onLayout}
    >
      <Text
        style={[
          styles.translatedFrom,
          labelThemedStyle,
          labelStyle,
        ]}
      >
        {i18n("Inflected: ")}
      </Text>
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

export default memo(OriginalWordBehindTranslation, { name: 'OriginalWordBehindTranslation' })
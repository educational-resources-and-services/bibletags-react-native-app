import React, { useCallback } from "react"
import { Text, StyleSheet, TouchableHighlight } from "react-native"
import { i18nNumber } from "inline-i18n"

import useThemedStyleSets from "../../hooks/useThemedStyleSets"
import { memoStyled } from '../../utils/toolbox'

const styles = StyleSheet.create({
  chapter: {
    width: 42,
    borderRadius: 21,
  },
  chapterText: {
    lineHeight: 42,
    textAlign: 'center',
  },
})

const ChooserChapter = ({
  chapter,
  onPress,
  style,
  labelStyle,

  themedStyle,
}) => {

  const { baseThemedStyle, labelThemedStyle } = useThemedStyleSets(themedStyle)

  const goPress = useCallback(
    () => onPress(chapter),
    [ onPress, chapter ],
  )

  return (
    <TouchableHighlight
      underlayColor="rgba(0, 0, 0, .2)"  // this just darkens the item when first touched
      onPress={goPress}
      style={[
        styles.chapter,
        baseThemedStyle,
        style,
      ]}
    >
      <Text
        style={[
          styles.chapterText,
          labelThemedStyle,
          labelStyle,
        ]}
      >
        {i18nNumber({ num: chapter, type: 'formal' })}
      </Text>
    </TouchableHighlight>
  )

}

export default memoStyled(ChooserChapter, 'ChooserChapter')
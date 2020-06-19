import React, { useCallback } from "react"
import { Text, StyleSheet, TouchableHighlight } from "react-native"
import { i18nNumber } from "inline-i18n"
import { styled } from "@ui-kitten/components"

import useThemedStyleSets from "../../hooks/useThemedStyleSets"


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

const ChooserChapter = React.memo(({
  chapter,
  onPress,
  style,
  displaySettings,

  themedStyle,
}) => {

  const { baseThemedStyle, labelThemedStyle } = useThemedStyleSets(themedStyle)

  const goPress = useCallback(
    () => onPress(chapter),
    [ onPress, chapter ],
  )

  return (
    <TouchableHighlight
      underlayColor={"rgba(0,0,0,.2)"}
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
          style,
        ]}
      >{i18nNumber({ num: chapter, type: 'formal' })}</Text>
    </TouchableHighlight>
  )

})

ChooserChapter.styledComponentName = 'ChooserChapter'

export default styled(ChooserChapter)
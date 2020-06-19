import React, { useCallback } from "react"
import { Text, StyleSheet, TouchableHighlight } from "react-native"
import Constants from "expo-constants"
import { i18nNumber } from "inline-i18n"

const {
  CHOOSER_SELECTED_BACKGROUND_COLOR,
  CHOOSER_SELECTED_TEXT_COLOR,
  CHOOSER_CHOOSING_BACKGROUND_COLOR,
} = Constants.manifest.extra

const styles = StyleSheet.create({
  chapter: {
    width: 42,
    borderRadius: 21,
  },
  chapterText: {
    lineHeight: 42,
    textAlign: 'center',
  },
  chapterSelected: {
    backgroundColor: CHOOSER_SELECTED_BACKGROUND_COLOR,
  },
  chapterTextSelected: {
    color: CHOOSER_SELECTED_TEXT_COLOR,
  },
})

const ChooserChapter = React.memo(({
  chapter,
  onPress,
  selected,

  displaySettings,
}) => {

  const goPress = useCallback(
    () => onPress(chapter),
    [ onPress, chapter ],
  )

  return (
    <TouchableHighlight
      underlayColor={CHOOSER_CHOOSING_BACKGROUND_COLOR}
      onPress={goPress}
      style={[
        styles.chapter,
        (selected ? styles.chapterSelected : null),
      ]}
    >
      <Text
        style={[
          styles.chapterText,
          (selected ? styles.chapterTextSelected : null),
        ]}
      >{i18nNumber({ num: chapter, type: 'formal' })}</Text>
    </TouchableHighlight>
  )

})

export default ChooserChapter
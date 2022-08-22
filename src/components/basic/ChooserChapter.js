import React, { useCallback } from "react"
import { Text, StyleSheet, TouchableHighlight, Platform } from "react-native"
import { i18nNumber } from "inline-i18n"

import useThemedStyleSets from "../../hooks/useThemedStyleSets"
import { memo } from '../../utils/toolbox'

const styles = StyleSheet.create({
  chapter: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
  },
  chapterText: {
    textAlign: 'center',
  },
})

const ChooserChapter = ({
  chapter,
  onPress,
  style,
  labelStyle,

  eva: { style: themedStyle={} },
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
        key={Platform.OS === 'android' && labelThemedStyle.color}  // TODO: remove this line when RN bug fixed
        style={[
          styles.chapterText,
          labelThemedStyle,
          labelStyle,
        ]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {i18nNumber({ num: chapter, type: 'formal' })}
      </Text>
    </TouchableHighlight>
  )

}

export default memo(ChooserChapter, { name: 'ChooserChapter' })
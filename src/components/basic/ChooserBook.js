import React, { useCallback } from "react"
import { Text, StyleSheet, TouchableHighlight, Platform } from "react-native"
import { getBibleBookName } from "@bibletags/bibletags-ui-helper"

import useThemedStyleSets from "../../hooks/useThemedStyleSets"
import { memo } from '../../utils/toolbox'

const styles = StyleSheet.create({
  book: {
    paddingRight: 15,
    paddingLeft: 15,
  },
  bookText: {
    lineHeight: 40,
    textAlign: 'left',
  },
})

const ChooserBook = ({
  bookId,
  onPress,
  style,
  labelStyle,

  eva: { style: themedStyle={} },
}) => {

  const { baseThemedStyle, labelThemedStyle } = useThemedStyleSets(themedStyle)

  const goPress = useCallback(
    () => onPress(bookId),
    [ onPress, bookId ],
  )

  return (
    <TouchableHighlight
      underlayColor="rgba(0, 0, 0, .2)"  // this just darkens the item when first touched
      onPress={goPress}
      style={[
        styles.book,
        baseThemedStyle,
        style,
      ]}
    >
      <Text
        key={Platform.OS === 'android' && labelThemedStyle.color}  // TODO: remove this line when RN bug fixed
        style={[
          styles.bookText,
          labelThemedStyle,
          labelStyle,
        ]}
      >
        {getBibleBookName(bookId)}
      </Text>
    </TouchableHighlight>
  )

}

export default memo(ChooserBook, { name: 'ChooserBook' })
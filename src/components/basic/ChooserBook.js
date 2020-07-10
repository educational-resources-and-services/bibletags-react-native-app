import React, { useCallback } from "react"
import { Text, StyleSheet, TouchableHighlight } from "react-native"
import { getBibleBookName } from "bibletags-ui-helper"
import { styled } from "@ui-kitten/components"

import useThemedStyleSets from "../../hooks/useThemedStyleSets"

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

const ChooserBook = React.memo(({
  bookId,
  onPress,
  style,
  labelStyle,

  themedStyle,
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

})

ChooserBook.styledComponentName = 'ChooserBook'

export default styled(ChooserBook)
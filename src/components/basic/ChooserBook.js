import React, { useCallback } from "react"
import { Text, StyleSheet, TouchableHighlight } from "react-native"
import Constants from "expo-constants"
import { getBibleBookName } from "bibletags-ui-helper"

const {
  CHOOSER_BOOK_LINE_HEIGHT,
  CHOOSER_SELECTED_BACKGROUND_COLOR,
  CHOOSER_SELECTED_TEXT_COLOR,
  CHOOSER_CHOOSING_BACKGROUND_COLOR,
} = Constants.manifest.extra

const styles = StyleSheet.create({
  book: {
    paddingRight: 15,
    paddingLeft: 15,
  },
  bookText: {
    lineHeight: CHOOSER_BOOK_LINE_HEIGHT,
    textAlign: 'left',
  },
  bookSelected: {
    backgroundColor: CHOOSER_SELECTED_BACKGROUND_COLOR,
  },
  bookTextSelected: {
    color: CHOOSER_SELECTED_TEXT_COLOR,
  },
})

const ChooserBook = React.memo(({
  bookId,
  selected,
  onPress,
}) => {

  const goPress = useCallback(
    () => onPress(bookId),
    [ onPress, bookId ],
  )

  return (
    <TouchableHighlight
      underlayColor={CHOOSER_CHOOSING_BACKGROUND_COLOR}
      onPress={goPress}
      style={[
        styles.book,
        (selected ? styles.bookSelected : null),
      ]}
    >
      <Text
        style={[
          styles.bookText,
          (selected ? styles.bookTextSelected : null),
        ]}
      >{getBibleBookName(bookId)}</Text>
    </TouchableHighlight>
  )

})

export default ChooserBook
import React, { useCallback } from "react"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"
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
  bookSelectedLowLight: {
    backgroundColor: 'white',
  },
  bookTextSelected: {
    color: CHOOSER_SELECTED_TEXT_COLOR,
  },
  bookTextSelectedLowLight: {
    color: 'black',
  },
  bookTextLowLight: {
    color: 'white',
  },
})

const ChooserBook = React.memo(({
  bookId,
  selected,
  onPress,

  displaySettings,
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
        (selected 
          ?
            (displaySettings.theme === 'low-light' ? styles.bookSelectedLowLight : styles.bookSelected)
          :
            null
        ),
      ]}
    >
      <Text
        style={[
          styles.bookText,
          (displaySettings.theme === 'low-light' 
            ?
              (selected ? styles.bookTextSelectedLowLight : styles.bookTextLowLight)
            :
              (selected ? styles.bookTextSelected : null)
          ),
        ]}
      >{getBibleBookName(bookId)}</Text>
    </TouchableHighlight>
  )

})

const mapStateToProps = ({ displaySettings }) => ({
  displaySettings,
})

const matchDispatchToProps = (dispatch, x) => bindActionCreators({
  // recordSearch,
}, dispatch)

export default connect(mapStateToProps, matchDispatchToProps)(ChooserBook)
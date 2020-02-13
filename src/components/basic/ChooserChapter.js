import React, { useCallback } from "react"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"
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
  chapterSelectedLowLight: {
    backgroundColor: 'white',
  },
  chapterTextSelectedLowLight: {
    color: 'black',
  },
  chapterTextLowLight: {
    color: 'white',
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
        (selected 
          ?
            (displaySettings.theme === 'low-light' ? styles.chapterSelectedLowLight : styles.chapterSelected)
          :
            null
        ),
      ]}
    >
      <Text
        style={[
          styles.chapterText,
          (displaySettings.theme === 'low-light' 
            ?
              (selected ? styles.chapterTextSelectedLowLight : styles.chapterTextLowLight)
            :
              (selected ? styles.chapterTextSelected : null)
          ),
        ]}
      >{i18nNumber({ num: chapter, type: 'formal' })}</Text>
    </TouchableHighlight>
  )

})

const mapStateToProps = ({ displaySettings }) => ({
  displaySettings,
})

const matchDispatchToProps = (dispatch, x) => bindActionCreators({
  // recordSearch,
}, dispatch)

export default connect(mapStateToProps, matchDispatchToProps)(ChooserChapter)
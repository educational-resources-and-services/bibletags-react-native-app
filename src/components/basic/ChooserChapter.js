import React from "react"
import { Text, StyleSheet, TouchableHighlight } from "react-native"
import { Constants } from "expo"

const {
  CHOOSER_SELECTED_BACKGROUND_COLOR,
  CHOOSER_SELECTED_TEXT_COLOR,
  CHOOSER_CHOOSING_BACKGROUND_COLOR,
} = Constants.manifest.extra

const styles = StyleSheet.create({
  chapter: {
    width: 50,
    borderRadius: 25,
  },
  chapterText: {
    lineHeight: 50,
    textAlign: 'center',
  },
  chapterSelected: {
    backgroundColor: CHOOSER_SELECTED_BACKGROUND_COLOR,
  },
  chapterTextSelected: {
    color: CHOOSER_SELECTED_TEXT_COLOR,
  },
})

class ChooserChapter extends React.PureComponent {

  onPress = () => {
    const { onPress, chapter } = this.props

    onPress(chapter)
  }

  render() {
    const { chapter, selected } = this.props

    return (
      <TouchableHighlight
        underlayColor={CHOOSER_CHOOSING_BACKGROUND_COLOR}
        onPress={this.onPress}
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
        >{chapter}</Text>
      </TouchableHighlight>
    )
  }
}

export default ChooserChapter
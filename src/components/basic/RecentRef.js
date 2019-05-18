import React from "react"
import { Text, View, StyleSheet, TouchableWithoutFeedback } from "react-native"
import { Constants } from "expo"

import { getBibleBookName } from "bibletags-ui-helper"

const {
  CHOOSER_SELECTED_BACKGROUND_COLOR,
  CHOOSER_SELECTED_TEXT_COLOR,
  RECENT_REF_TIP_BACKGROUND_COLOR,
} = Constants.manifest.extra

const styles = StyleSheet.create({
  bookmark: {
    borderWidth: 1,
    borderColor: 'black',
    borderBottomWidth: 0,
    width: 26,
    height: 74,
    bottom: -12,
    backgroundColor: 'white',
    marginRight: 10,
  },
  bookmarkSelected: {
    bottom: 0,
  },
  bookmarkTip: {
    backgroundColor: RECENT_REF_TIP_BACKGROUND_COLOR,
    height: 8,
  },
  bookmarkTipSelected: {
    backgroundColor: CHOOSER_SELECTED_BACKGROUND_COLOR,
  },
  bookmarkTextContainer: {
    transform: [
      {
        rotate: '270deg',
      },
      {
        translateX: -25,
      },
      {
        translateY: -18,
      },
    ],
    width: 60,
    height: 20,
  },
  bookmarkText: {
    lineHeight: 18,
    textAlign: 'right',
    fontSize: 12,
  },
})

class RecentRef extends React.PureComponent {

  onPress = () => {
    console.log('do something')
  }

  render() {
    const { bookId, chapter, selected } = this.props

    return (
      <TouchableWithoutFeedback
        onPress={this.onPress}
      >
        <View
          style={[
            styles.bookmark,
            (selected ? styles.bookmarkSelected : null),
          ]}
        >
          <View
            style={[
              styles.bookmarkTip,
              (selected ? styles.bookmarkTipSelected : null),
            ]}
          />
          <View style={styles.bookmarkTextContainer}>
            <Text
              numberOfLines={1}
              style={styles.bookmarkText}
            >
              Mt 22
            </Text>
          </View>
        </View>
      </TouchableWithoutFeedback>
    )
  }
}

export default RecentRef
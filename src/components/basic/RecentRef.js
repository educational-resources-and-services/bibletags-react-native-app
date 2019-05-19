import React from "react"
import { Text, View, StyleSheet, TouchableWithoutFeedback } from "react-native"
import { Constants } from "expo"

import { getPassageStr } from "bibletags-ui-helper"

const {
  RECENT_REF_BACKGROUND_COLOR,
  RECENT_REF_SELECTED_BACKGROUND_COLOR,
} = Constants.manifest.extra

const styles = StyleSheet.create({
  bookmark: {
    width: 25,
    height: 75,
    bottom: -12,
    marginRight: 10,
    backgroundColor: RECENT_REF_BACKGROUND_COLOR,
  },
  bookmarkSelected: {
    bottom: 0,
    backgroundColor: RECENT_REF_SELECTED_BACKGROUND_COLOR,
  },
  bookmarkTextContainer: {
    transform: [
      {
        rotate: '270deg',
      },
      {
        translateX: -26,
      },
      {
        translateY: -17.5,
      },
    ],
    width: 60,
    height: 25,
  },
  bookmarkText: {
    color: 'white',
    lineHeight: 25,
    textAlign: 'right',
    fontSize: 12,
  },
})

class RecentRef extends React.PureComponent {

  onPress = () => {
    console.log('do something')
  }

  render() {
    const { dataRef, selected } = this.props

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
          <View style={styles.bookmarkTextContainer}>
            <Text
              numberOfLines={1}
              style={styles.bookmarkText}
            >
              {getPassageStr({
                refs: [ dataRef ],
                abbreviated: true,
              })}
            </Text>
          </View>
        </View>
      </TouchableWithoutFeedback>
    )
  }
}

export default RecentRef
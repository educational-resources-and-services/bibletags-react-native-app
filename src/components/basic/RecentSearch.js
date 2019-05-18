import React from "react"
import { Text, View, StyleSheet, TouchableWithoutFeedback } from "react-native"

const styles = StyleSheet.create({
  bookmark: {
    backgroundColor: 'blue',
    position: 'absolute',
    width: 20,
    height: 100,
    bottom: 0,
    left: 20,
  },
  bookmarkText: {
  },
})

class RecentSearch extends React.PureComponent {

  onPress = () => {
    console.log('do something')
  }

  render() {
    const { bookId, selected } = this.props

    return (
      <TouchableWithoutFeedback
        onPress={this.onPress}
      >
        <View style={styles.bookmark}>
          <Text style={styles.bookmarkText}>
            Mt 22
          </Text>
        </View>
      </TouchableWithoutFeedback>
    )
  }
}

export default RecentSearch
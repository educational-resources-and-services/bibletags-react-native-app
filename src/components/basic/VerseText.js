import React from "react"
import { Text } from "react-native"

class VerseText extends React.PureComponent {

  onPress = ({ nativeEvent }) => {
    const { verseNumber, onPress } = this.props
    const { pageX, pageY } = nativeEvent

    onPress({ selectedVerse: verseNumber, pageX, pageY })
  }

  render() {
    const { style, children } = this.props

    return (
      <Text
        style={style}
        onPress={this.onPress}
      >
        {children}
      </Text>
    )
  }
}

export default VerseText
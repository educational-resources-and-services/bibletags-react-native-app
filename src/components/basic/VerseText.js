import React from "react"
import { Text } from "react-native"

class VerseText extends React.PureComponent {

  onPress = () => {
    const { verseNumber, onPress } = this.props
    onPress(verseNumber)
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
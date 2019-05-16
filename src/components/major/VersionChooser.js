import React from "react"
import { Button, Text, View } from "native-base"
import { StyleSheet } from "react-native"
import { Constants } from "expo"

const {
  VERSION_CHOOSER_BACKGROUND_COLOR,
} = Constants.manifest.extra

const styles = StyleSheet.create({
  container: {
    zIndex: 1,
  },
})

class VersionChooser extends React.PureComponent {

  render() {
    const { something } = this.props

    return (
      <View style={styles.container}>
        <Text>hi</Text>
        <Button full light>
          <Text>Light</Text>
        </Button>
        <Button full>
          <Text>Primary</Text>
        </Button>
      </View>
    )
  }
}

export default VersionChooser
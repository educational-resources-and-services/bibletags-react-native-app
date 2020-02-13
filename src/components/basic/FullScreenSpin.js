import React from "react"
import { View, Text } from "native-base"
import { StyleSheet } from "react-native"

import Spin from "./Spin"

const styles = StyleSheet.create({
  spinnerContainer: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255, 255, 255, .8)',
  },
  textContainer: {
    padding: "10%",
    paddingTop: 0,
    alignItems: "center",
  },
  spacer: {
    flex: 1,
  },
})

const FullScreenSpin = React.memo(({
  style,
  text,
  percentage,
}) => (
  <View style={[
    styles.spinnerContainer,
    style,
  ]}>
    <View style={styles.spacer} />
    {!!text &&
      <View style={styles.textContainer}>
        <Text>{text}</Text>
      </View>
    }
    <Spin
      percentage={percentage}
    />
    <View style={styles.spacer} />
  </View>
))

export default FullScreenSpin
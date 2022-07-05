import React from "react"
import { StyleSheet, View, Text } from "react-native"

import { memo } from "../../utils/toolbox"

import Spin from "./Spin"

const styles = StyleSheet.create({
  translucent: {
    opacity: .5,
  },
  spinnerContainer: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
  },
  textContainer: {
    padding: 20,
    alignItems: "center",
  },
})

const CoverAndSpin = ({
  text,
  percentage,
  style,
  spinStyle,
  translucent,
  size,

  eva: { style: themedStyle={} },
}) => (
  <View style={[
    (translucent ? styles.translucent : null),
    styles.spinnerContainer,
    themedStyle,
    style,
  ]}>
    <Spin
      style={spinStyle}
      percentage={percentage}
      size={size}
    />
    {!!text &&
      <View style={styles.textContainer}>
        <Text>{text}</Text>
      </View>
    }
  </View>
)

export default memo(CoverAndSpin, { name: 'CoverAndSpin' })
import React from "react"
import { StyleSheet, View, Text } from "react-native"

import { memo } from "../../utils/toolbox"

import Spin from "./Spin"

const styles = StyleSheet.create({
  translucent: {
    opacity: .5,
  },
  spinnerContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  textContainer: {
    padding: 20,
    alignItems: "center",
  },
  spacer: {
    flex: 1,
  },
})

const CoverAndSpin = ({
  text,
  percentage,
  style,
  translucent,

  eva: { style: themedStyle={} },
}) => (
  <View style={[
    (translucent ? styles.translucent : null),
    styles.spinnerContainer,
    themedStyle,
    style,
  ]}>
    <View style={styles.spacer} />
    <Spin
      percentage={percentage}
    />
    {!!text &&
      <View style={styles.textContainer}>
        <Text>{text}</Text>
      </View>
    }
    <View style={styles.spacer} />
  </View>
)

export default memo(CoverAndSpin, { name: 'CoverAndSpin' })
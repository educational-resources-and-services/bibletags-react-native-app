import React from "react"
import { StyleSheet, View, Text } from "react-native"
import { styled } from "@ui-kitten/components"

import Spin from "./Spin"

const styles = StyleSheet.create({
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
  style,
  themedStyle,
  text,
  percentage,
}) => (
  <View style={[
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

CoverAndSpin.styledComponentName = 'CoverAndSpin'

export default styled(CoverAndSpin)
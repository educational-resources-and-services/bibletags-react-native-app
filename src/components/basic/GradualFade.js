import React from "react"
import { View, StyleSheet } from "react-native"
import { styled } from "@ui-kitten/components"

const styles = StyleSheet.create({
  container: {
  },
  faderLine: {
    height: 1,
    backgroundColor: 'white',
  },
})

const GradualFade = React.memo(({
  height=20,
  style,
  lineStyle,

  themedStyle,
}) => (
  <View
    style={[
      styles.container,
      themedStyle,
      style,
    ]}
  >
    {Array(height).fill(0).map((x, idx) => (
      <View
        key={idx}
        style={[
          styles.faderLine,
          lineStyle,
          {
            opacity: 1 - Math.pow(((idx + 1) / (height + 1)), 2),
          },
        ]}
      />
    ))}
  </View>
))

GradualFade.styledComponentName = 'GradualFade'

export default styled(GradualFade)
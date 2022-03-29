import React from "react"
import { View, StyleSheet } from "react-native"

import { memo } from '../../utils/toolbox'

const styles = StyleSheet.create({
  container: {
  },
  faderLine: {
    height: 1,
    backgroundColor: 'white',
  },
})

const GradualFade = ({
  height=20,
  style,
  lineStyle,

  eva: { style: themedStyle={} },
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
)

export default memo(GradualFade, { name: 'GradualFade' })
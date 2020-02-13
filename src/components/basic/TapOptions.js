import React from "react"
import { StyleSheet, Text, View, TouchableOpacity, Dimensions } from "react-native"

import { useDimensions } from 'react-native-hooks'

const MAX_WIDTH_PER_BUTTON = 70

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  buttons: {
    backgroundColor: 'white',
    borderRadius: 3,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  button: {
    backgroundColor: '#333333',
    padding: 12,
  },
  text: {
    color: 'white',
  },
})

const TapOptions = React.memo(({
  options,
  centerX,
  bottomY,
  topY,
}) => {

  const { width } = useDimensions().window
  const MAX_WIDTH = MAX_WIDTH_PER_BUTTON * options.length
  const sideBuffer = MAX_WIDTH/2 + 20

  return (
    <View
      style={[
        styles.container,
        {
          marginLeft: MAX_WIDTH / -2,
          marginRight: MAX_WIDTH / -2,
          width: MAX_WIDTH,
          left: Math.min(Math.max(centerX, sideBuffer), width - sideBuffer),
        },
        bottomY != null ? { bottom: bottomY } : null,
        bottomY == null ? { top: topY } : null,
      ]}
    >
      <View style={styles.buttons}>
        {options.map(({ label, action }) => (
          <TouchableOpacity
            onPress={action}
            key={label}
          >
            <View style={styles.button}>
              <Text style={styles.text}>
                {label}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  )

})

export default TapOptions
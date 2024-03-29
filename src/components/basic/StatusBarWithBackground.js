import React from "react"
import { StyleSheet, View, StatusBar, Platform } from "react-native"

import { memo } from "../../utils/toolbox"

const styles = StyleSheet.create({
  background: {
    zIndex: 3,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 30,
  }
})

const StatusBarWithBackground = ({
  style,
  hidden,
  animated,

  eva: { style: themedStyle={} },
}) => {

  if(Platform.OS === 'android') return null

  return (
    <>
      <View 
        style={[
          styles.background,
          themedStyle,
          style,
        ]}
      />
      <StatusBar
        animated={animated}
        hidden={hidden}
      />
    </>
  )

}

export default memo(StatusBarWithBackground, { name: 'StatusBarWithBackground' })
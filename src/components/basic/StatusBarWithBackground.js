import React from "react"
import { StyleSheet, View, StatusBar } from "react-native"
import { styled } from '@ui-kitten/components'

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

  themedStyle,
}) => {

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

StatusBarWithBackground.styledComponentName = 'StatusBarWithBackground'

export default styled(StatusBarWithBackground)
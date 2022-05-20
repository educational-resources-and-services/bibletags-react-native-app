import React from "react"
import { View, StyleSheet, TouchableWithoutFeedback } from "react-native"

const transparentBar = {
  position: 'absolute',
  left: 0,
  right: 0,
  height: 10,
  backgroundColor: 'transparent',
  zIndex: 15,
}

const styles = StyleSheet.create({
  transparentBarTop: {
    ...transparentBar,
    top: 0,
  },
  transparentBarBottom: {
    ...transparentBar,
    bottom: 0,
  },
})

const noop = () => {}

const PreventTopAndBottomSwipeEvents = () => {

  return (
    <>
      <TouchableWithoutFeedback onPressIn={noop}>
        <View style={styles.transparentBarTop} />
      </TouchableWithoutFeedback>
      <TouchableWithoutFeedback onPressIn={noop}>
        <View style={styles.transparentBarBottom} />
      </TouchableWithoutFeedback>
    </>
  )
}

export default PreventTopAndBottomSwipeEvents
import React, { useEffect, useRef, useState } from "react"
import { Platform, StyleSheet, StatusBar, KeyboardAvoidingView as RNKeyboardAvoidingView } from "react-native"

const styles = StyleSheet.create({
  view: {
    flex: 1,
  },
})

const KeyboardAvoidingView = ({
  children,
  style,
  ...otherProps
}) => {

  const ref = useRef()
  const [ yOffset, setYOffset ] = useState(0)

  useEffect(
    () => {
      // Note: This works on the assumption that this elements y position will not change after it is constructed.
      setTimeout(() => {
        try {
          ref.current.viewRef.current.measure(
            (x, y, w, h, pageX, pageY) => {
              const statusBarHeight = StatusBar.currentHeight || 0
              setYOffset(pageY + (Platform.OS === 'android' ? statusBarHeight : 0))
            }
          )
        } catch(e) {}
      })
    },
    [],
  )

  return (
    <RNKeyboardAvoidingView
      ref={ref}
      style={[
        styles.view,
        style,
      ]}
      behavior="padding"
      keyboardVerticalOffset={yOffset}
      enabled={Platform.OS !== 'android'}  // Note sure why this is not needed on Android, but it isn't.
      {...otherProps}
    >
      {children}
    </RNKeyboardAvoidingView>
  )
}

export default KeyboardAvoidingView
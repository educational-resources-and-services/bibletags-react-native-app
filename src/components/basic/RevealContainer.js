import React, { useEffect, useRef } from "react"
import { StyleSheet, Animated } from "react-native"
import { Layout } from "@ui-kitten/components"

// import SafeLayout from './SafeLayout'

const styles = StyleSheet.create({
  animatedContainer: {
    zIndex: 10,
    shadowColor: '#999999',
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 50,
  },
})

const AnimatedContainer = Animated.createAnimatedComponent(Layout)

const RevealContainer = ({
  revealAmount,
  immediateAdjustment,
  duration=200,
  style,
  children,
}) => {

  const translateYAnimation = useRef(new Animated.Value(revealAmount || 0)).current
  const scaleAnimation = useRef(new Animated.Value(revealAmount ? .95 : 1)).current

  useEffect(
    () => {
      Animated.parallel([
        Animated.timing(
          translateYAnimation,
          {
            toValue: revealAmount,
            duration,
            useNativeDriver: true,
          }
        ),
        Animated.timing(
          scaleAnimation,
          {
            toValue: revealAmount ? .95 : 1,
            duration,
            useNativeDriver: true,
          }
        ),
      ]).start()
    },
    [ revealAmount ],
  )

  return (
    <AnimatedContainer
      style={[
        styles.animatedContainer,
        style,
        {
          marginTop: immediateAdjustment,
          transform: [{
            translateY: translateYAnimation,
          }],
          scaleX: scaleAnimation,
          scaleY: scaleAnimation,
        },
      ]}
    >
      {children}
    </AnimatedContainer>
  )

}

export default RevealContainer
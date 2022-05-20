import React, { useRef, useState, useEffect, useCallback } from "react"
import { Animated, StyleSheet, Dimensions } from "react-native"
import * as SplashScreen from 'expo-splash-screen'
import * as Updates from 'expo-updates'
import Constants from "expo-constants"

import useInstanceValue from "../../hooks/useInstanceValue"
import { memo } from '../../utils/toolbox'

const {
  FIRST_LOAD_SPLASH_TEXT_LINE_1="Original language Bible study...",
  FIRST_LOAD_SPLASH_TEXT_LINE_2="...for everyone.",
} = Constants.manifest.extra

const loadingLine = {
  position: 'absolute',
  width: '100%',
  textAlign: 'center',
  fontWeight: '200',
  fontSize: 16,
}

const windowHeight = Dimensions.get('window').height

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  image: {
    width: undefined,
    height: undefined,
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    resizeMode: Constants.manifest.splash.resizeMode,
    backgroundColor: Constants.manifest.splash.backgroundColor,
  },
  loadingLine1: {
    ...loadingLine,
    top: parseInt(windowHeight/2) + 100,
  },
  loadingLine2: {
    ...loadingLine,
    top: parseInt(windowHeight/2) + 130,
  },
})

const Splash = ({
  isReady,
  showDelayText,
  updateExists,
  style,

  eva: { style: themedStyle={} },
}) => {

  const splashAnimation = useRef(new Animated.Value(0)).current
  const opacityLine1 = useRef(new Animated.Value(0)).current
  const opacityLine2 = useRef(new Animated.Value(0)).current

  const [ textAnimationComplete, setTextAnimationComplete ] = useState(false)
  const [ splashAnimationComplete, setSplashAnimationComplete ] = useState(false)

  const getShowDelayText = useInstanceValue(showDelayText)

  useEffect(
    () => {
      if(isReady && (!showDelayText || textAnimationComplete)) {

        if(!updateExists) {
          Animated.timing(splashAnimation, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }).start(() => setSplashAnimationComplete(true))
        }

      }
    },
    [ isReady, textAnimationComplete, showDelayText ],
  )

  const onImageLoad = useCallback(
    async () => {
      await SplashScreen.hideAsync()

      if(getShowDelayText()) {
        // show first line
        Animated.timing(
          opacityLine1,
          {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          },
        ).start(() => {
          // show second line
          Animated.timing(
            opacityLine2,
            {
              toValue: 1,
              duration: 1500,
              useNativeDriver: true,
            },
          ).start(() => setTextAnimationComplete(true))
        })
      }
    },
    [],
  )

  if(splashAnimationComplete) return null

  return (
    <Animated.View
      style={[
        styles.container,
        themedStyle,
        style,
        {
          opacity: splashAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 0],
          }),
        }
      ]}
    >
      <Animated.Image
        source={require("../../../assets/icons/splash-tablet.png")}
        style={[
          styles.image,
          {
            transform: [
              {
                scale: splashAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 4],
                }),
              },
            ],
          },
        ]}
        onLoadEnd={onImageLoad}
        fadeDuration={0}
      />
      <Animated.Text
        style={[
          styles.loadingLine1,
          {
            opacity: opacityLine1,
          },
        ]}
      >
        {FIRST_LOAD_SPLASH_TEXT_LINE_1}
      </Animated.Text>
      <Animated.Text
        style={[
          styles.loadingLine2,
          {
            opacity: opacityLine2,
          },
        ]}
      >
        {FIRST_LOAD_SPLASH_TEXT_LINE_2}
      </Animated.Text>
    </Animated.View>
  )

}

export default memo(Splash, { name: 'Splash' })
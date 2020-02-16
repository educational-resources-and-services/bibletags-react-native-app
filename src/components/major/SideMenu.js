import React, { useRef } from 'react'
import { Animated, StyleSheet, TouchableWithoutFeedback, Platform, View, I18nManager } from 'react-native'

import useUpdateEffect from "react-use/lib/useUpdateEffect"
import usePrevious from "react-use/lib/usePrevious"
import useUpdate from "react-use/lib/useUpdate"

const styles = StyleSheet.create({
  childrenContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  cover: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, .8)',
    zIndex: 2,
  },
  menu: {
    zIndex: 3,
    position: 'absolute',
    top: 0,
    bottom: 0,
  },
  menuLeft: {
    left: 0,
  },
  menuRight: {
    right: 0,
  },
})

const useNativeDriver = Platform.OS !== 'web'

const SideMenu = ({
  open=false,
  onClose=() => {},
  menu=null,
  children=null,
  
  menuWidth=280,
  menuPosition='left',
  coverBackgroundColor,
  duration=250,
  onOpenAnimationComplete=() => {},
  onCloseAnimationComplete=() => {},
}) => {

  const animated = useRef(new Animated.Value(open ? 1 : 0)).current
  const prevOpen = usePrevious(open)
  const update = useUpdate() 

  useUpdateEffect(
    () => {
      if(open) {
        Animated.timing(
          animated, 
          {
            toValue: 1,
            duration,
            useNativeDriver,
          },
        ).start(onOpenAnimationComplete)

      } else {
        Animated.timing(
          animated, 
          {
            toValue: 0,
            duration,
            useNativeDriver,
          },
        ).start(() => {
          update()
          onCloseAnimationComplete()
        })
      }
    },
    [ open ]
  )

  return (
    <>
      <View style={styles.childrenContainer}>
        {children}
      </View>
      {!!(open || prevOpen) &&
        <TouchableWithoutFeedback
          onPress={open ? onClose : null}
        >
          <Animated.View
            style={[
              styles.cover,
              (!coverBackgroundColor ? null : {
                backgroundColor: coverBackgroundColor,
              }),
              {
                opacity: animated,
              },
            ]}
          />
        </TouchableWithoutFeedback>
      }
      <Animated.View
        style={[
          styles.menu,
          (menuPosition === 'right' ? styles.menuRight : styles.menuLeft),
          {
            width: menuWidth,
            transform: [{
              translateX: animated.interpolate({
                inputRange: [0, 1],
                outputRange: (
                  (menuPosition === 'right') === !I18nManager.isRTL
                    ? [menuWidth, 0]
                    : [menuWidth * -1, 0]
                ),
              }),
            }],
          },
        ]}
      >
        {menu}
      </Animated.View>
    </>
  )

}

export default SideMenu
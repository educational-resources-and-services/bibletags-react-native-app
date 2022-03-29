import React, { useState, useCallback, useMemo } from "react"
import { Text, View, StyleSheet, PanResponder, I18nManager } from "react-native"
// import { bindActionCreators } from "redux"
// import { connect } from "react-redux"

import useThemedStyleSets from '../../hooks/useThemedStyleSets'
import { memo } from '../../utils/toolbox'

const MAXIMUM_SWIPE_UP_AMOUNT = 30
const MINIMUM_SWIPE_DOWN_AMOUNT = 10
const X_TO_Y_CANCEL_PROPORTION = .4
const MINIMUM_CANCEL_AMOUNT = 25
const EXTRA_SELECTED_BOOKMARK_HEIGHT = 12

const styles = StyleSheet.create({
  bookmark: {
    width: 31,
    height: 75 + MAXIMUM_SWIPE_UP_AMOUNT,
    bottom: EXTRA_SELECTED_BOOKMARK_HEIGHT * -1,
    borderWidth: 3,
    borderBottomWidth: 0,
    borderColor: 'white',  // functional, and so not in custom-mapping
    marginRight: 5,
  },
  bookmarkBeingTouched: {
    borderColor: 'rgba(255, 255, 255, .7)',  // functional, and so not in custom-mapping
  },
  bookmarkSelected: {
    bottom: 0,
  },
  bookmarkTextContainer: {
    transform: [
      {
        rotate: '270deg',
      },
      {
        translateX: -26,
      },
      {
        translateY: I18nManager.isRTL ? 17.5 : -17.5,
      },
    ],
    width: 60,
    height: 25,
  },
  bookmarkText: {
    lineHeight: 25,
    textAlign: I18nManager.isRTL ? 'left' : 'right',
    fontSize: 12,
  },
})

const isCancelled = ({ dx, dy }) => (
  Math.abs(dx/dy) > X_TO_Y_CANCEL_PROPORTION
  && Math.abs(dx) >= MINIMUM_CANCEL_AMOUNT
)

const RecentBookmark = ({
  selected,
  text,
  discard,
  select,
  style,
  labelStyle,

  eva: { style: themedStyle={} },
}) => {

  const [ beingTouched, setBeingTouched ] = useState(false)
  const [ dragY, setDragY ] = useState(false)

  const { baseThemedStyle, labelThemedStyle } = useThemedStyleSets(themedStyle)

  const cancelTouchVisual = useCallback(
    () => {
      setBeingTouched(false)
      setDragY(0)
    },
    [],
  )

  const panResponder = useMemo(
    () => PanResponder.create({
      onStartShouldSetPanResponder: (evt, gestureState) => true,
      onStartShouldSetPanResponderCapture: (evt, gestureState) => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => true,
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => true,

      onPanResponderGrant: (evt, gestureState) => setBeingTouched(true),
      onPanResponderMove: (evt, gestureState) => {
        if(isCancelled(gestureState)) {
          cancelTouchVisual()
        } else {
          setBeingTouched(true)
          setDragY(Math.max(
            gestureState.dy - (selected ? EXTRA_SELECTED_BOOKMARK_HEIGHT : 0),
            selected ? EXTRA_SELECTED_BOOKMARK_HEIGHT * -1 : MAXIMUM_SWIPE_UP_AMOUNT * -1,
          ))
        }
      },

      onPanResponderTerminationRequest: (evt, gestureState) => true,
      onPanResponderRelease: (evt, gestureState) => {

        if(isCancelled(gestureState)) {
          console.log('passage change cancelled')

        } else if(gestureState.dy >= MINIMUM_SWIPE_DOWN_AMOUNT) {

          discard()

        } else if(!selected) {

          select()

        }

        cancelTouchVisual()

      },
      onPanResponderTerminate: cancelTouchVisual
    }),
    [ selected, discard, select, cancelTouchVisual ],
  )

  return (
    <View
      {...panResponder.panHandlers}
      style={[
        styles.bookmark,
        baseThemedStyle,
        style,
        (selected ? styles.bookmarkSelected : null),
        (beingTouched ? styles.bookmarkBeingTouched : null),
        (beingTouched
          ? {
            bottom: (dragY * -1) - 12,
          }
          : null
        ),
      ]}
    >
      <View style={styles.bookmarkTextContainer}>
        <Text
          numberOfLines={1}
          style={[
            styles.bookmarkText,
            labelStyle,
            labelThemedStyle,
          ]}>
          {text}
        </Text>
      </View>
    </View>
  )

}

export default memo(RecentBookmark, { name: 'RecentBookmark' })

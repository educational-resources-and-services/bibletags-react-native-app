import React, { useState, useCallback, useMemo } from "react"
import { Text, View, StyleSheet, PanResponder, I18nManager } from "react-native"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"

const MAXIMUM_SWIPE_UP_AMOUNT = 30
const MINIMUM_SWIPE_DOWN_AMOUNT = 10
const X_TO_Y_CANCEL_PROPORTION = .4
const MINIMUM_CANCEL_AMOUNT = 25
const EXTRA_SELECTED_BOOKMARK_HEIGHT = 12

const styles = StyleSheet.create({
  bookmark: {
    width: 25,
    height: 75 + MAXIMUM_SWIPE_UP_AMOUNT,
    bottom: EXTRA_SELECTED_BOOKMARK_HEIGHT * -1,
    marginRight: 10,
  },
  bookmarkBeingTouched: {
    opacity: .7,
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
    color: 'white',
    lineHeight: 25,
    textAlign: I18nManager.isRTL ? 'left' : 'right',
    fontSize: 12,
  },
  lowLight: {
    color: 'black',
  },
  contrast: {
    backgroundColor: '#444444',
  },
  contrastSelected: {
    backgroundColor: 'black',
  },
})

const isCancelled = ({ dx, dy }) => (
  Math.abs(dx/dy) > X_TO_Y_CANCEL_PROPORTION
  && Math.abs(dx) >= MINIMUM_CANCEL_AMOUNT
)

const RecentBookmark = React.memo(({
  selected,
  text,
  style,
  discard,
  select,

  displaySettings,
}) => {

  const [ beingTouched, setBeingTouched ] = useState(false)
  const [ dragY, setDragY ] = useState(false)

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

  const { theme } = displaySettings

  return (
    <View
      {...panResponder.panHandlers}
      style={[
        styles.bookmark,
        style,
        (displaySettings.theme === 'high-contrast' && selected ? styles.contrastSelected : null),
        (displaySettings.theme === 'high-contrast' && !selected ? styles.contrast : null),
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
            (theme === 'low-light' ? styles.lowLight : null ),
          ]}>
          {text}
        </Text>
      </View>
    </View>
  )

})

const mapStateToProps = ({ displaySettings }) => ({
  displaySettings
})

const matchDispatchToProps = (dispatch, x) => bindActionCreators({
}, dispatch)

export default connect(mapStateToProps, matchDispatchToProps)(RecentBookmark)

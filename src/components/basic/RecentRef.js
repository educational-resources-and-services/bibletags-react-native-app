import React from "react"
import { Text, View, StyleSheet, PanResponder } from "react-native"
import { Constants } from "expo"

import { getPassageStr } from "bibletags-ui-helper"

const {
  RECENT_REF_BACKGROUND_COLOR,
  RECENT_REF_SELECTED_BACKGROUND_COLOR,
} = Constants.manifest.extra

const MAXIMUM_SWIPE_UP_AMOUNT = 30
const MINIMUM_SWIPE_DOWN_AMOUNT = 10
const X_TO_Y_CANCEL_PROPORTION = .4
const MINIMUM_CANCEL_AMOUNT = 25

const styles = StyleSheet.create({
  bookmark: {
    width: 25,
    height: 75 + MAXIMUM_SWIPE_UP_AMOUNT,
    bottom: -12,
    marginRight: 10,
    backgroundColor: RECENT_REF_BACKGROUND_COLOR,
  },
  bookmarkBeingTouched: {
    opacity: .6,
  },
  bookmarkSelected: {
    bottom: 0,
    backgroundColor: RECENT_REF_SELECTED_BACKGROUND_COLOR,
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
        translateY: -17.5,
      },
    ],
    width: 60,
    height: 25,
  },
  bookmarkText: {
    color: 'white',
    lineHeight: 25,
    textAlign: 'right',
    fontSize: 12,
  },
})

const isCancelled = ({ dx, dy }) => (
  Math.abs(dx/dy) > X_TO_Y_CANCEL_PROPORTION
  && Math.abs(dx) >= MINIMUM_CANCEL_AMOUNT
)

class RecentRef extends React.PureComponent {

  state = {
    beingTouched: false,
    dragY: 0,
  }

  cancelTouchVisual = () => {
    this.setState({
      beingTouched: false,
      dragY: 0,
    })
  }

  panResponder = PanResponder.create({
    onStartShouldSetPanResponder: (evt, gestureState) => true,
    onStartShouldSetPanResponderCapture: (evt, gestureState) => true,
    onMoveShouldSetPanResponder: (evt, gestureState) => true,
    onMoveShouldSetPanResponderCapture: (evt, gestureState) => true,

    onPanResponderGrant: (evt, gestureState) => {
      this.setState({ beingTouched: true })
    },
    onPanResponderMove: (evt, gestureState) => {
      if(isCancelled(gestureState)) {
        this.cancelTouchVisual()
      } else {
        this.setState({
          beingTouched: true,
          dragY: Math.max(gestureState.dy, MAXIMUM_SWIPE_UP_AMOUNT * -1),
        })
      }
    },
    onPanResponderTerminationRequest: (evt, gestureState) => true,
    onPanResponderRelease: (evt, gestureState) => {

      if(isCancelled(gestureState)) {
        console.log('passage change cancel1')

      } else if(gestureState.dy >= MINIMUM_SWIPE_DOWN_AMOUNT) {
        console.log('passage remove')

      } else {
        console.log('passage change')

      }

      this.cancelTouchVisual()

    },
    onPanResponderTerminate: (evt, gestureState) => {
      console.log('passage change cancel2')
      this.cancelTouchVisual()
    },
  })

  render() {
    const { passageRef, selected } = this.props
    const { beingTouched, dragY } = this.state

    return (
      <View
        {...(selected ? {} : this.panResponder.panHandlers)}
        style={[
          styles.bookmark,
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
            style={styles.bookmarkText}
          >
            {getPassageStr({
              refs: [ passageRef ],
              abbreviated: true,
            })}
          </Text>
        </View>
      </View>
    )
  }
}

export default RecentRef
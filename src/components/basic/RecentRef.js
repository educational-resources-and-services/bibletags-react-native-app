import React from "react"
import { Text, View, StyleSheet, PanResponder } from "react-native"
import { Constants } from "expo"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"

import { getPassageStr } from "bibletags-ui-helper"

import { setRef, removeRecentPassage } from "../../redux/actions.js"

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
      const { setRef, removeRecentPassage, passageRef: ref } = this.props

      if(isCancelled(gestureState)) {
        console.log('passage change cancelled (1)')

      } else if(gestureState.dy >= MINIMUM_SWIPE_DOWN_AMOUNT) {
        removeRecentPassage({ ref })

      } else {
        setRef({ ref })
      }

      this.cancelTouchVisual()

    },
    onPanResponderTerminate: (evt, gestureState) => {
      console.log('passage change cancelled (2)')
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

const mapStateToProps = ({ passage }) => ({
  // passage,
})

const matchDispatchToProps = dispatch => bindActionCreators({
  setRef,
  removeRecentPassage,
}, dispatch)

export default connect(mapStateToProps, matchDispatchToProps)(RecentRef)
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
const EXTRA_SELECTED_BOOKMARK_HEIGHT = 12

const styles = StyleSheet.create({
  bookmark: {
    width: 25,
    height: 75 + MAXIMUM_SWIPE_UP_AMOUNT,
    bottom: EXTRA_SELECTED_BOOKMARK_HEIGHT * -1,
    marginRight: 10,
    backgroundColor: RECENT_REF_BACKGROUND_COLOR,
  },
  bookmarkBeingTouched: {
    opacity: .7,
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

    onPanResponderGrant: (evt, gestureState) => this.setState({ beingTouched: true }),
    onPanResponderMove: (evt, gestureState) => {
      const { selected } = this.props

      if(isCancelled(gestureState)) {
        this.cancelTouchVisual()
      } else {
        this.setState({
          beingTouched: true,
          dragY: Math.max(
            gestureState.dy - (selected ? EXTRA_SELECTED_BOOKMARK_HEIGHT : 0),
            selected ? EXTRA_SELECTED_BOOKMARK_HEIGHT * -1 : MAXIMUM_SWIPE_UP_AMOUNT * -1,
          ),
        })
      }
    },

    onPanResponderTerminationRequest: (evt, gestureState) => true,
    onPanResponderRelease: (evt, gestureState) => {
      const { passageRef: ref, selected, history, recentPassages,
              setRef, removeRecentPassage } = this.props

      if(isCancelled(gestureState)) {
        console.log('passage change cancelled')

      } else if(gestureState.dy >= MINIMUM_SWIPE_DOWN_AMOUNT) {

        if(selected) {

          let ref = {
            bookId: 1,
            chapter: 1,
            scrollY: 0,
          }

          if(recentPassages.length > 1) {
            history.some((passage, index) => {
              if(recentPassages.includes(index)) {
                ref = passage.ref
                return true
              }
            })
          }

          setRef({ ref })
        }

        removeRecentPassage({ ref })

      } else if(!selected) {
        setRef({ ref })
      }

      this.cancelTouchVisual()

    },
    onPanResponderTerminate: this.cancelTouchVisual
  })

  render() {
    const { passageRef, selected } = this.props
    const { beingTouched, dragY } = this.state

    return (
      <View
        {...this.panResponder.panHandlers}
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

const mapStateToProps = ({ history, recentPassages }) => ({
  history,
  recentPassages,
})

const matchDispatchToProps = dispatch => bindActionCreators({
  setRef,
  removeRecentPassage,
}, dispatch)

export default connect(mapStateToProps, matchDispatchToProps)(RecentRef)
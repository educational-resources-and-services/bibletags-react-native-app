import React, { useCallback } from "react"
import { StyleSheet } from "react-native"
import Constants from "expo-constants"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"
import { getPassageStr } from "bibletags-ui-helper"

import { setRef, removeRecentPassage } from "../../redux/actions.js"

import RecentBookmark from "./RecentBookmark"

const {
  RECENT_REF_BACKGROUND_COLOR,
  RECENT_REF_SELECTED_BACKGROUND_COLOR,
} = Constants.manifest.extra

const styles = StyleSheet.create({
  recentRef: {
    backgroundColor: RECENT_REF_BACKGROUND_COLOR,
  },
  recentRefSelected: {
    backgroundColor: RECENT_REF_SELECTED_BACKGROUND_COLOR,
  },
})

const RecentRef = React.memo(({
  passageRef,
  selected,

  history,
  recentPassages,

  setRef,
  removeRecentPassage,
}) => {

  const discard = useCallback(
    () => {
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

      removeRecentPassage({ ref: passageRef })

    },
    [ passageRef, selected, history, recentPassages ],
  )

  const select = useCallback(
    () => setRef({ ref: passageRef }),
    [ passageRef ],
  )

  const text = getPassageStr({
    refs: [ passageRef ],
    abbreviated: true,
  })

  return (
    <RecentBookmark
      selected={selected}
      text={text}
      style={selected ? styles.recentRefSelected : styles.recentRef}
      discard={discard}
      select={select}
    />
  )

})

const mapStateToProps = ({ history, recentPassages }) => ({
  history,
  recentPassages,
})

const matchDispatchToProps = dispatch => bindActionCreators({
  setRef,
  removeRecentPassage,
}, dispatch)

export default connect(mapStateToProps, matchDispatchToProps)(RecentRef)
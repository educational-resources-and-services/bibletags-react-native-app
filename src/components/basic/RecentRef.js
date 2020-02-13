import React, { useCallback } from "react"
import { StyleSheet } from "react-native"
import Constants from "expo-constants"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"

import { getPassageStr } from "bibletags-ui-helper"
import RecentBookmark from "./RecentBookmark"

import { setRef, removeRecentPassage } from "../../redux/actions.js"

const {
  RECENT_REF_BACKGROUND_COLOR,
  RECENT_REF_SELECTED_BACKGROUND_COLOR,
} = Constants.manifest.extra

const styles = StyleSheet.create({
  recentRef: {
    backgroundColor: RECENT_REF_BACKGROUND_COLOR,
  },
  recentRefLowLight: {
    backgroundColor: 'rgba(138, 138, 138, 1)',
  },
  recentRefSelected: {
    backgroundColor: RECENT_REF_SELECTED_BACKGROUND_COLOR,
  },
  recentRefSelectedLowLight: {
    backgroundColor: 'rgba(237, 237, 237, 1)',
  },
})

const RecentRef = React.memo(({
  passageRef,
  selected,

  history,
  recentPassages,
  displaySettings,

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

  const { theme } = displaySettings

  const text = getPassageStr({
    refs: [ passageRef ],
    abbreviated: true,
  })

  return (
    <RecentBookmark
      selected={selected}
      text={text}
      style={
        theme === 'low-light' 
          ?
            (selected ? styles.recentRefSelectedLowLight : styles.recentRefLowLight)
          : 
            (selected ? styles.recentRefSelected : styles.recentRef)
      }
      discard={discard}
      select={select}
    />
  )

})

const mapStateToProps = ({ history, recentPassages, displaySettings }) => ({
  history,
  recentPassages,
  displaySettings,
})

const matchDispatchToProps = dispatch => bindActionCreators({
  setRef,
  removeRecentPassage,
}, dispatch)

export default connect(mapStateToProps, matchDispatchToProps)(RecentRef)
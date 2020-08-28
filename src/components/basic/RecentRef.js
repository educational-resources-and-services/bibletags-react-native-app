import React, { useCallback } from "react"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"
import { getPassageStr } from "bibletags-ui-helper"

import { setRef, removeRecentPassage } from "../../redux/actions"
import { memo } from '../../utils/toolbox'

import RecentBookmark from "./RecentBookmark"

const RecentRef = ({
  passageRef,
  selected,
  style,

  themedStyle,

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
      style={[
        style,
        themedStyle,
      ]}
      discard={discard}
      select={select}
    />
  )

}

const mapStateToProps = ({ history, recentPassages }) => ({
  history,
  recentPassages,
})

const matchDispatchToProps = dispatch => bindActionCreators({
  setRef,
  removeRecentPassage,
}, dispatch)

export default memo(connect(mapStateToProps, matchDispatchToProps)(RecentRef), { name: 'RecentRef' })
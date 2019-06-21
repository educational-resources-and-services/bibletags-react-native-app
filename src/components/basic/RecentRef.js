import React from "react"
import { Constants } from "expo"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"

import { getPassageStr } from "bibletags-ui-helper"
import RecentBookmark from "./RecentBookmark"

import { setRef, removeRecentPassage } from "../../redux/actions.js"

const {
  RECENT_REF_BACKGROUND_COLOR,
  RECENT_REF_SELECTED_BACKGROUND_COLOR,
} = Constants.manifest.extra

class RecentRef extends React.PureComponent {

  discard = () => {
    const { passageRef: ref, selected, history, recentPassages,
            setRef, removeRecentPassage } = this.props

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

  }

  select = () => {
    const { passageRef: ref, setRef } = this.props

    setRef({ ref })
  }

  render() {
    const { passageRef, selected } = this.props

    const text = getPassageStr({
      refs: [ passageRef ],
      abbreviated: true,
    })

    return (
      <RecentBookmark
        selected={selected}
        text={text}
        backgroundColor={selected ? RECENT_REF_SELECTED_BACKGROUND_COLOR : RECENT_REF_BACKGROUND_COLOR}
        discard={this.discard}
        select={this.select}
      />
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
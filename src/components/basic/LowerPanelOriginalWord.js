import React from "react"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"
import { getLocFromRef } from "@bibletags/bibletags-versification"

import OriginalWordInfo from "./OriginalWordInfo"

const LowerPanelOriginalWord = ({
  selectedVerse,
  selectedInfo,
  onSizeChangeFunctions,
  maxHeight,
  hideEditTagIcon,

  passage,
}) => {

  const { morph, strong, lemma } = selectedInfo
  const wordId = selectedInfo[`x-id`]

  const originalLoc = getLocFromRef({ ...passage.ref, verse: selectedVerse })

  return (
    <OriginalWordInfo
      morph={morph}
      strong={strong}
      lemma={lemma}
      wordId={wordId}
      onLayout={onSizeChangeFunctions[0]}
      doIPhoneBuffer={true}
      originalLoc={originalLoc}
      hideEditTagIcon={hideEditTagIcon}
      extendedHeight={maxHeight - 210}
    />
  )

}

const mapStateToProps = ({ passage }) => ({
  passage,
})

const matchDispatchToProps = dispatch => bindActionCreators({
}, dispatch)

export default connect(mapStateToProps, matchDispatchToProps)(LowerPanelOriginalWord)
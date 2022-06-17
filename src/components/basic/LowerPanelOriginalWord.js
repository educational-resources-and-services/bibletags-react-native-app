import React from "react"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"
import { getLocFromRef } from "@bibletags/bibletags-versification"

import useTranslationsOfWordInMyVersions from "../../hooks/useTranslationsOfWordInMyVersions"

import OriginalWordInfo from "./OriginalWordInfo"

const LowerPanelOriginalWord = ({
  selectedVerse,
  selectedInfo,
  onSizeChangeFunctions,
  maxHeight,
  hideEditTagIcon,

  passage,
  myBibleVersions,
}) => {

  const { morph, strong, lemma } = selectedInfo
  const wordId = selectedInfo[`x-id`]

  const originalLoc = getLocFromRef({ ...passage.ref, verse: selectedVerse })

  const translationsOfWordInMyVersions = useTranslationsOfWordInMyVersions({
    wordId,
    originalLoc,
    myBibleVersions,
  })

  return (
    <OriginalWordInfo
      morph={morph}
      strong={strong}
      lemma={lemma}
      onSizeChangeFunctions={onSizeChangeFunctions}
      doIPhoneBuffer={true}
      translationsOfWordInMyVersions={translationsOfWordInMyVersions}
      originalLoc={originalLoc}
      hideEditTagIcon={hideEditTagIcon}
      extendedHeight={maxHeight - 210}
    />
  )

}

const mapStateToProps = ({ passage, myBibleVersions }) => ({
  passage,
  myBibleVersions,
})

const matchDispatchToProps = dispatch => bindActionCreators({
}, dispatch)

export default connect(mapStateToProps, matchDispatchToProps)(LowerPanelOriginalWord)
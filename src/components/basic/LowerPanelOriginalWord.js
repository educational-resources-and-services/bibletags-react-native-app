import React from "react"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"
import { getLocFromRef } from "@bibletags/bibletags-versification"

import useTranslationsOfWordInMyVersions from "../../hooks/useTranslationsOfWordInMyVersions"

import OriginalWordInfo from "./OriginalWordInfo"

const LowerPanelOriginalWord = ({
  selectedInfo,
  onSizeChangeFunctions,

  passage,
  myBibleVersions,
}) => {

  const { morph, strong, lemma } = selectedInfo
  const wordId = selectedInfo[`x-id`]

  const { ref } = passage

  const translationsOfWordInMyVersions = useTranslationsOfWordInMyVersions({
    wordId,
    wordPartNumber,
    originalLoc: getLocFromRef(ref),
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
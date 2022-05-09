import React from "react"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"
import { getLocFromRef } from "@bibletags/bibletags-versification"

import useTranslationsOfWordInMyVersions from "../../hooks/useTranslationsOfWordInMyVersions"

import LowerPanelWord from "./LowerPanelWord"

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
    <LowerPanelWord
      morph={morph}
      strong={strong}
      lemma={lemma}
      onSizeChangeFunctions={onSizeChangeFunctions}
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
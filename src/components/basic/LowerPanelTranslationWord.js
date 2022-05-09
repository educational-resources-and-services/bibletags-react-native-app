import React, { useMemo, useState } from "react"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"
import { getLocFromRef, getCorrespondingRefs } from "@bibletags/bibletags-versification"
import { getWordsHash } from "@bibletags/bibletags-ui-helper"

import useTagSet from "../../hooks/useTagSet"
import useVersePieces from "../../hooks/useVersePieces"
import useMemoObject from "../../hooks/useMemoObject"

import LowerPanelWord from "./LowerPanelWord"

import { getVersionInfo, getOriginalVersionInfo } from "../../utils/toolbox"

const LowerPanelTranslationWord = ({
  selectedInfo,
  selectedVerse,
  selectedVerseUsfm,
  onSizeChangeFunctions,

  passage,
}) => {

  const { wordNumberInVerse } = selectedInfo
  const { ref, versionId } = passage

  const [ selectedWordIdx, setSelectedWordIdx ] = useState(0)

  const { wordDividerRegex } = getVersionInfo(versionId)
  const refWithVerse = useMemoObject({ ...ref, verse: selectedVerse })

  const wordsHash = getWordsHash({ usfm: selectedVerseUsfm, wordDividerRegex })

  const { tagSet } = useTagSet({
    loc: getLocFromRef(refWithVerse),
    versionId,
    wordsHash,
  })

  const originalRefs = useMemo(
    () => (
      getCorrespondingRefs({
        baseVersion: {
          info: getVersionInfo(versionId),
          ref: refWithVerse,
        },
        lookupVersionInfo: getOriginalVersionInfo(refWithVerse.bookId),
      })
    ),
    [ versionId, refWithVerse ],
  )

  const { pieces } = useVersePieces({
    versionId: `original`,
    refs: originalRefs,
  })

  const originalWordsInfo = useMemo(
    () => {
      if(!tagSet) return []
      for(let tag of tagSet.tags) {
        if(tag.t.includes(wordNumberInVerse)) {
          return tag.o.map(wordIdAndPartNumber => {
            const wordId = wordIdAndPartNumber.split('|')[0]
            return {
              ...pieces.find(piece => piece[`x-id`] === wordId),
              status: tagSet.status,
            }
          })
        }
      }
      return []
    },
    [ tagSet, wordNumberInVerse, pieces ],
  )

  const { morph, strong, lemma } = originalWordsInfo[selectedWordIdx] || {}

  return (
    <LowerPanelWord
      morph={morph}
      strong={strong}
      lemma={lemma}
      onSizeChangeFunctions={onSizeChangeFunctions}
      originalWordsInfo={originalWordsInfo}
      selectedWordIdx={selectedWordIdx}
      setSelectedWordIdx={setSelectedWordIdx}
      versionId={versionId}
    />
  )

}

const mapStateToProps = ({ passage, myBibleVersions }) => ({
  passage,
  myBibleVersions,
})

const matchDispatchToProps = dispatch => bindActionCreators({
}, dispatch)

export default connect(mapStateToProps, matchDispatchToProps)(LowerPanelTranslationWord)
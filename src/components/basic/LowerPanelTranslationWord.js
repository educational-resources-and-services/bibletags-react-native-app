import React, { useLayoutEffect, useMemo, useState } from "react"
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
  updateSelectedData,
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
          return (
            tag.o
              .map(wordIdAndPartNumber => {
                const wordId = wordIdAndPartNumber.split('|')[0]
                return pieces.findIndex(piece => piece[`x-id`] === wordId)
              })
              .sort()
              .map(idx => ({
                ...pieces[idx],
                status: tagSet.status,
              }))
          )
        }
      }
      return []
    },
    [ tagSet, wordNumberInVerse, pieces ],
  )

  useLayoutEffect(
    () => {
      if(!tagSet || originalWordsInfo.length === 0) return

      const colorByWordIdAndPartNumber = {}
      if(ref.bookId <= 39) {
        originalWordsInfo.forEach(wordInfo => {
          ;(wordInfo.children || [{}]).forEach(({ color=`black` }, idx) => {
            colorByWordIdAndPartNumber[`${wordInfo[`x-id`]}|${idx+1}`] = color
          })
        })
      }

      const selectedOrigWordIds = originalWordsInfo.map(wordInfo => wordInfo[`x-id`])

      const selectedTagInfoWords = (
        tagSet.tags
          .map(tag => {
            if(tag.o.some(wordIdAndPartNumber => selectedOrigWordIds.includes(wordIdAndPartNumber.split('|')[0]))) {
              const color = (
                tag.o.reduce((currentColor, wordIdAndPartNumber) => {
                  const thisColor = colorByWordIdAndPartNumber[wordIdAndPartNumber] || `black`
                  return (
                    (
                      thisColor === `black`
                      || !currentColor
                    )
                      ? thisColor
                      : currentColor
                  )
                }, ``)
              )
              return tag.t.map(wordNumberInVerse => ({
                wordNumberInVerse,
                color,
              }))
            }
          })
          .filter(Boolean)
          .flat()
      )

      if(selectedTagInfoWords > 1 || (selectedTagInfoWords[0] && selectedTagInfoWords[0].color !== `black`)) {
        updateSelectedData({
          selectedTagInfo: {
            words: selectedTagInfoWords,
          },
        })
      }

    },
    [ originalWordsInfo, tagSet ],
  )

  const adjustedSelectedWordIdx = selectedWordIdx > originalWordsInfo.length - 1 ? 0 : selectedWordIdx
  const { morph, strong, lemma } = originalWordsInfo[adjustedSelectedWordIdx] || {}

  return (
    <LowerPanelWord
      morph={morph}
      strong={strong}
      lemma={lemma}
      onSizeChangeFunctions={onSizeChangeFunctions}
      originalWordsInfo={originalWordsInfo}
      selectedWordIdx={adjustedSelectedWordIdx}
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
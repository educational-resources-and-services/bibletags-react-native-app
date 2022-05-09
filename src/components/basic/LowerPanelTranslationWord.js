import React, { useLayoutEffect, useMemo, useState } from "react"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"
import { getLocFromRef, getCorrespondingRefs } from "@bibletags/bibletags-versification"
import { getWordsHash } from "@bibletags/bibletags-ui-helper"

import useTagSet from "../../hooks/useTagSet"
import useVersePieces from "../../hooks/useVersePieces"
import useMemoObject from "../../hooks/useMemoObject"
import useThemedStyleSets from "../../hooks/useThemedStyleSets"

import LowerPanelWord from "./LowerPanelWord"

import { getVersionInfo, getOriginalVersionInfo, cloneObj, memo } from "../../utils/toolbox"

const LowerPanelTranslationWord = ({
  selectedInfo,
  selectedVerse,
  selectedVerseUsfm,
  updateSelectedData,
  onSizeChangeFunctions,

  eva: { style: themedStyle={} },

  passage,
}) => {

  const { altThemedStyleSets } = useThemedStyleSets(themedStyle)
  const [
    phantomTextStyle={},
  ] = altThemedStyleSets

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
      if(!tagSet || pieces.length === 0) return []
      for(let tag of tagSet.tags) {
        if(tag.t.includes(wordNumberInVerse)) {

          const selectedPieceIdxs = []
          const wordPartNumbersByWordId = {}

          tag.o.forEach(wordIdAndPartNumber => {
            const [ wordId, wordPartNumber ] = wordIdAndPartNumber.split('|')
            wordPartNumbersByWordId[wordId] = wordPartNumbersByWordId[wordId] || []
            wordPartNumbersByWordId[wordId].push(parseInt(wordPartNumber, 10))
            const selectedPieceIdx = pieces.findIndex(piece => piece[`x-id`] === wordId)
            if(!selectedPieceIdxs.includes(selectedPieceIdx)) {
              selectedPieceIdxs.push(selectedPieceIdx)
            }
          })

          selectedPieceIdxs.sort((a,b) => a-b ? 1 : -1)

          return (
            selectedPieceIdxs.map(idx => {
              let piece = pieces[idx]
              if(wordPartNumbersByWordId[piece[`x-id`]].length < (piece.children || []).length) {
                piece = cloneObj(piece)
                piece.children = piece.children.map((word, idx) => (
                  wordPartNumbersByWordId[piece[`x-id`]].includes(idx+1)
                    ? word
                    : {
                      ...word,
                      ...phantomTextStyle,
                      notIncludedInTag: true,
                    }
                ))
              }
              return {
                ...piece,
                status: tagSet.status,
              }
            })
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

      const selectedOrigWordIdAndPartNumbers = (
        originalWordsInfo
          .map(wordInfo => (
            ref.bookId <= 39
              ? (
                wordInfo.children
                  ? (
                    wordInfo.children
                      .map(({ notIncludedInTag }, idx) => !notIncludedInTag ? `${wordInfo[`x-id`]}|${idx+1}` : null)
                      .filter(Boolean)
                  )
                  : `${wordInfo[`x-id`]}|1`
              )
              : wordInfo[`x-id`]
          ))
          .flat()
      )

      const selectedTagInfoWords = (
        tagSet.tags
          .map(tag => {
            if(tag.o.some(wordIdAndPartNumber => selectedOrigWordIdAndPartNumbers.includes(wordIdAndPartNumber))) {
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

      if(selectedTagInfoWords.length > 1 || (selectedTagInfoWords[0] && selectedTagInfoWords[0].color !== `black`)) {
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

export default memo(connect(mapStateToProps, matchDispatchToProps)(LowerPanelTranslationWord), { name: 'LowerPanelTranslationWord' })
import { useMemo, useLayoutEffect, useCallback } from "react"

import { cloneObj } from "../utils/toolbox"

const useSetSelectedTagInfo = ({
  skip,
  tagSet,
  pieces,
  selectedInfo,
  selectedTagInfo,
  selectedVersionId,
  bookId,
  updateSelectedData,
}) => {

  const getOriginalWordsInfoFromWordIdAndPartNumbers = useCallback(
    wordIdAndPartNumbers => {

      const selectedPieceIdxs = []
      const wordPartNumbersByWordId = {}

      wordIdAndPartNumbers.forEach(wordIdAndPartNumber => {
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

    },
    [ pieces, tagSet ],
  )

  const determineAndSetSelectedTagInfo = useCallback(
    ({ originalWordsInfo }) => {

      const colorByWordIdAndPartNumber = {}
      if(bookId <= 39) {
        originalWordsInfo.forEach(wordInfo => {
          ;(wordInfo.children || [{}]).forEach(({ color=`black` }, idx) => {
            colorByWordIdAndPartNumber[`${wordInfo[`x-id`]}|${idx+1}`] = color
          })
        })
      }

      const selectedOrigWordIdAndPartNumbers = (
        originalWordsInfo
          .map(wordInfo => (
            bookId <= 39
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

      updateSelectedData({
        selectedTagInfo: {
          [selectedVersionId]: selectedTagInfoWords,
          original: originalWordsInfo,
        },
      })

    },
    [ tagSet, updateSelectedData ],
  )

  useLayoutEffect(
    () => {
      if(!tagSet || pieces.length === 0 || skip) return
      if(!selectedInfo || selectedTagInfo !== undefined) return

      const { wordNumberInVerse } = selectedInfo
      if(wordNumberInVerse === undefined) return

      let originalWordsInfo = []
      for(let tag of tagSet.tags) {
        if(tag.t.includes(wordNumberInVerse)) {
          originalWordsInfo = getOriginalWordsInfoFromWordIdAndPartNumbers(tag.o)
          break
        }
      }

      determineAndSetSelectedTagInfo({
        originalWordsInfo,
      })

    },
    [ tagSet, pieces, selectedInfo, selectedTagInfo ],
  )

  const onOriginalWordVerseTap = useCallback(
    ({ selectedInfo }) => {

      if(!tagSet || pieces.length === 0) {
        updateSelectedData({
          selectedTagInfo: {
            original: [{
              ...selectedInfo,
              status: `none`,
            }],
          },
        })
        return
      }

      const allWordIdAndPartNumbersInTag = (
        tagSet.tags
          .filter(tag => tag.o.some(wordIdAndPartNumber => wordIdAndPartNumber.split('|')[0] === selectedInfo[`x-id`]))
          .map(tag => tag.o)
          .flat()
      )

      determineAndSetSelectedTagInfo({
        originalWordsInfo: getOriginalWordsInfoFromWordIdAndPartNumbers(allWordIdAndPartNumbersInTag),
      })

    },
    [ tagSet, pieces, updateSelectedData, determineAndSetSelectedTagInfo ],
  )

  const originalWordsInfo = useMemo(() => (selectedTagInfo || {}).original || [], [ selectedTagInfo ])

  const hasNoCoorespondingOriginalWord = (
    originalWordsInfo.length === 0
    && !!tagSet
    && pieces.length > 0
  )

  return {
    originalWordsInfo,
    hasNoCoorespondingOriginalWord,
    onOriginalWordVerseTap: skip ? null : onOriginalWordVerseTap,
  }
}

export default useSetSelectedTagInfo
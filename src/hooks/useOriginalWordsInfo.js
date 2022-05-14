import { useMemo, useLayoutEffect } from "react"

import { cloneObj } from "../utils/toolbox"

const useOriginalWordsInfo = ({
  skip,
  tagSet,
  wordNumberInVerse,
  pieces,
  bookId,
  updateSelectedData,
}) => {

  const originalWordsInfo = useMemo(
    () => {
      if(!tagSet || pieces.length === 0 || skip) return []

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
      if(!tagSet || originalWordsInfo.length === 0 || skip) return

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

  const hasNoCoorespondingOriginalWord = (
    originalWordsInfo.length === 0
    && !!tagSet
    && pieces.length > 0
  )

  return {
    originalWordsInfo,
    hasNoCoorespondingOriginalWord,
  }
}

export default useOriginalWordsInfo
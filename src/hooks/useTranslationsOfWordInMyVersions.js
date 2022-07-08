import { getCorrespondingRefs, getLocFromRef, getRefFromLoc } from "@bibletags/bibletags-versification"
import { splitVerseIntoWords, escapeRegex } from "@bibletags/bibletags-ui-helper"
import { i18n } from "inline-i18n"

import useBibleVersions from "./useBibleVersions"
import useMemoAsync from "./useMemoAsync"
import { getVersionInfo, getOriginalVersionInfo, safelyExecuteSelects, equalObjs, orderedStatusesArray } from "../utils/toolbox"

const useTranslationsOfWordInMyVersions = ({
  wordId,
  originalLoc,
  myBibleVersions,
}) => {

  const { downloadedVersionIds } = useBibleVersions({ myBibleVersions })

  const translationsOfWordsInMyVersions = useMemoAsync(
    async () => {

      const originalRef = getRefFromLoc(originalLoc)
      const originalVersionInfo = getOriginalVersionInfo(originalRef.bookId)
      const refsByVersionId = {}

      downloadedVersionIds.forEach(versionId => {
        refsByVersionId[versionId] = getCorrespondingRefs({
          baseVersion: {
            info: originalVersionInfo,
            ref: originalRef,
          },
          lookupVersionInfo: getVersionInfo(versionId),
        })
      })

      const versesQueries = downloadedVersionIds.map(versionId => ({
        versionId,
        bookId: refsByVersionId[versionId][0].bookId,
        statement: ({ bookId, limit }) => `SELECT *, "${versionId}" AS versionId FROM ${versionId}VersesBook${bookId} WHERE loc IN ? ORDER BY loc`,
        args: [
          refsByVersionId[versionId].map(ref => getLocFromRef(ref).split(':')[0]),
        ],
        forceRemoveCantillation: true,  // since it will show words out of context, remove cantillation no matter what
      }))

      const tagSetsQueries = (
        downloadedVersionIds
          .filter(versionId => versionId !== 'original')
          .map(versionId => (
            refsByVersionId[versionId].map(ref => ({
              database: `versions/${versionId}/tagSets`,
              statement: () => `SELECT * FROM tagSets WHERE id LIKE ?`,
              args: [
                `${getLocFromRef(ref).split(':')[0]}-${versionId}-%`,
              ],
              jsonKeys: [ 'tags' ],
            }))
          ))
          .flat()
      )

      const queryResults = (await safelyExecuteSelects([
        ...versesQueries,
        ...tagSetsQueries,
      ])).flat()

      const resultsByVersionIdAndLoc = {}
      const originalWordByWordId = {}

      queryResults.forEach(result => {

        const versionId = result.versionId || result.id.split('-')[1]
        const loc = result.loc || result.id.split('-')[0]

        if(versionId !== 'original') {
          resultsByVersionIdAndLoc[versionId] = resultsByVersionIdAndLoc[versionId] || {}
          resultsByVersionIdAndLoc[versionId][loc] = resultsByVersionIdAndLoc[versionId][loc] || {
            words: {},
            tagSet: {},
          }
        }

        if(result.usfm) {  // it is a verse

          const { wordDividerRegex } = getVersionInfo(versionId)

          const words = splitVerseIntoWords({
            usfm: `\\c ${getRefFromLoc(loc).chapter}\n${result.usfm}`,
            wordDividerRegex,
            isOriginal: versionId === 'original',
          })

          if(versionId === 'original') {
            words.forEach((word, idx) => {
              originalWordByWordId[word[`x-id`]] = {
                ...word,
                wordNumberInVerse: idx + 1,
              }
            })
          } else {
            resultsByVersionIdAndLoc[versionId][loc].words = words            
          }

        } else {  // it is a tagSet

          resultsByVersionIdAndLoc[versionId][loc].tagSet = result

        }

      })

      const translationsOfWordsInMyVersions = {}

      for(let versionId in resultsByVersionIdAndLoc) {
        for(let tagSetLoc in resultsByVersionIdAndLoc[versionId]) {

          const { words, tagSet } = resultsByVersionIdAndLoc[versionId][tagSetLoc]
          if(!(tagSet || {}).tags) continue

          tagSet.tags.forEach(tag => {

            const sortedOrigWordParts = tag.o.sort(
              (a,b) => {
                let [ aWordId, aWordPartNumber ] = a.split('|')
                aWordPartNumber = parseInt(aWordPartNumber, 10)
                let [ bWordId, bWordPartNumber ] = b.split('|')
                bWordPartNumber = parseInt(bWordPartNumber, 10)

                return (
                  (
                    originalWordByWordId[aWordId].wordNumberInVerse < originalWordByWordId[bWordId].wordNumberInVerse
                    || (
                      originalWordByWordId[aWordId].wordNumberInVerse === originalWordByWordId[bWordId].wordNumberInVerse
                      && aWordPartNumber < bWordPartNumber
                    )
                  )
                    ? -1
                    : 1
                )
              },
            )

            const tagPhrase = (
              sortedOrigWordParts
                .map((wordIdAndPartNumber, idx) => {
                  let [ wordId, wordPartNumber ] = wordIdAndPartNumber.split('|')
                  wordPartNumber = parseInt(wordPartNumber, 10)

                  const phraseWords = [ originalWordByWordId[wordId] ]

                  if((phraseWords[0].children || [])[wordPartNumber - 1]) {
                    phraseWords[0] = phraseWords[0].children[wordPartNumber - 1]
                  }

                  const punctuationColor = `rgba(0,0,0,.2)`

                  // add on front dash, when relevant
                  let [ previousWordId, previousWordPartNumber ] = idx > 0 ? sortedOrigWordParts[idx-1].split('|') : []
                  previousWordPartNumber = parseInt(previousWordPartNumber, 10)
                  if(
                    wordPartNumber > 1
                    && (
                      idx === 0
                      || previousWordId !== wordId
                      || previousWordPartNumber !== wordPartNumber - 1
                    )
                  ) {
                    phraseWords.unshift({
                      text: `–`,
                      color: punctuationColor,
                    })
                  }

                  // add on end dash, when relevant
                  let [ nextWordId, nextWordPartNumber ] = idx < sortedOrigWordParts.length-1 ? sortedOrigWordParts[idx+1].split('|') : []
                  nextWordPartNumber = parseInt(nextWordPartNumber, 10)
                  if(
                    ![ NaN, (originalWordByWordId[wordId].children || [0]).length ].includes(wordPartNumber)
                    && (
                      idx === sortedOrigWordParts.length-1
                      || nextWordId !== wordId
                      || nextWordPartNumber !== wordPartNumber + 1
                    )
                  ) {
                    phraseWords.push({
                      text: `–`,
                      color: punctuationColor,
                    })
                  }

                  // add in ellipsis or space, when relevant
                  if(
                    idx > 0
                    && previousWordId !== wordId
                  ) {
                    phraseWords.unshift({
                      text: (
                        (originalWordByWordId[previousWordId] || {}).wordNumberInVerse + 1 === (originalWordByWordId[wordId] || {}).wordNumberInVerse
                          ? ` `
                          : `…`
                      ),
                      color: punctuationColor,
                    })
                  }

                  return phraseWords
                })
                .flat()
            )

            const ellipsis = i18n("…", "placed between nonconsecutive words")
            const spaceEllipsisSpaceRegex = new RegExp(escapeRegex(`${i18n(" ", "word separator")}${ellipsis}${i18n(" ", "word separator")}`), 'g')
            const tagTranslation = (
              tag.t
                .map((wordNumberInVerse, idx) => {
                  const wordsToAdd = [ words[wordNumberInVerse - 1].text ]

                  if(
                    idx > 0
                    && tag.t[idx-1] + 1 !== wordNumberInVerse
                  ) {
                    wordsToAdd.unshift(ellipsis)
                  }

                  return wordsToAdd
                })
                .flat()
                .join(i18n(" ", "word separator"))
                .replace(spaceEllipsisSpaceRegex, ellipsis)
            )

            sortedOrigWordParts.forEach(wordIdAndPartNumber => {
              const [ wordId ] = wordIdAndPartNumber.split('|')

              translationsOfWordsInMyVersions[wordId] = translationsOfWordsInMyVersions[wordId] || []
              let phraseIdx = translationsOfWordsInMyVersions[wordId].findIndex(({ phrase }) => equalObjs(phrase, tagPhrase))

              if(phraseIdx === -1) {
                translationsOfWordsInMyVersions[wordId].push({
                  phrase: tagPhrase,
                  translations: [],
                })
                phraseIdx = translationsOfWordsInMyVersions[wordId].length - 1
              }

              const { translations } = translationsOfWordsInMyVersions[wordId][phraseIdx]

              const uncapitalizeWords = phrase => (
                phrase
                  .split(new RegExp(`([ –]|${escapeRegex(i18n("…", "placed between nonconsecutive words"))})`, 'g'))
                  .map(wordOrDivider => `${wordOrDivider.slice(0,1).toLocaleLowerCase(getVersionInfo(versionId).languageId)}${wordOrDivider.slice(1)}`)
                  .join('')
              )

              let translationIndex = translations.findIndex(({ translation }) => uncapitalizeWords(translation) === uncapitalizeWords(tagTranslation))

              if(translationIndex === -1) {
                translations.push({
                  translation: tagTranslation,
                  versions: {},
                })
                translationIndex = translations.length - 1
                orderedStatusesArray.forEach(status => {
                  translations[translationIndex].versions[status] = []
                })
              }

              if(!translations[translationIndex].versions[tagSet.status].includes(versionId)) {
                translations[translationIndex].versions[tagSet.status].push(versionId)
              }

            })

          })

        }
      }

      // E.g.
      // {
      //   "01h7N": [
      //     {
      //       phrase: [
      //         {
      //           text: "ו",
      //           color: "red",
      //         },
      //         {
      //           text: "יבדל",
      //         },
      //         {
      //           text: " ... ",
      //         },
      //         {
      //           text: "בין",
      //         },
      //       ],
      //       translations: [
      //         {
      //           translation: "in ... beginning",
      //           versions: {
      //             unconfirmed: [ "esv", "kjv" ],
      //             confirmed: [ "nasb" ],
      //           },
      //         },
      //         {
      //           translation: "at ... beginning",
      //           versions: {
      //             automatch: [ "net" ],
      //           },
      //         },
      //         {
      //           translation: "",
      //           versions: {
      //             unconfirmed: [ "bad" ],
      //           },
      //         },
      //       ],
      //     },
      //   ],
      // }

      return translationsOfWordsInMyVersions

    },
    [ originalLoc, myBibleVersions ],
    {},
  )

  return translationsOfWordsInMyVersions[wordId]

}

export default useTranslationsOfWordInMyVersions

// TODO: uses
  // orig - word tap
  // translation - vsnum tap - word tap
  // two translations in parallel - word tap

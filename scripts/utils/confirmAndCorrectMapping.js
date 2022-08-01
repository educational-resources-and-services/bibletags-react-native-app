const Database = require('better-sqlite3')
const { getBibleBookName, splitVerseIntoWords } = require("@bibletags/bibletags-ui-helper")
const { getCorrespondingRefs, getRefFromLoc, getNextOriginalLoc, getLocFromRef,
        getVerseMappingsByVersionInfo } = require('@bibletags/bibletags-versification')
require('colors')
const inquirer = require('inquirer')

const hideCursor = `\u001B[?25l`
const showCursor = `\u001B[?25h`

let charPressed
process.stdin.on('data', d => {
  charPressed = d.toString()
})

const cloneObj = obj => JSON.parse(JSON.stringify(obj))

const getWordRangesFromWordNums = wordNums => {
  const newWordRanges = []
  let rangeStart
  wordNums.forEach((num, idx) => {
    if(idx === 0) {
      rangeStart = num
    } else if(wordNums[idx] !== wordNums[idx-1] + 1) {
      newWordRanges.push(`${rangeStart}-${wordNums[idx-1]}`)
      rangeStart = num
    }
  })
  newWordRanges.push(`${rangeStart}-${wordNums.slice(-1)[0]}`)
  return newWordRanges
}

const wordsCacheByVersionIdAndLoc = {}

const confirmAndCorrectMapping = async ({ originalLocs, versionInfo, tenant, progress }) => {

  // validate input
  let bookId
  for(let idx=1; idx<originalLocs.length; idx++) {
    if(originalLocs[idx] !== getNextOriginalLoc(originalLocs[idx-1])) {
      throw new Error(`confirmAndCorrectMapping called with inconsecutive originalLocs`)
    }
    const thisBookId = getRefFromLoc(originalLocs[idx]).bookId
    if(bookId && bookId !== thisBookId) {
      throw new Error(`confirmAndCorrectMapping called with originalLocs spanning multiple books`)
    }
    bookId = thisBookId
  }

  let editableItemIdx, currentCallback, debugLog, errorMessage=``, typing={}

  const getDbAndTableName = versionId => {
    const tenantDir = `./tenants/${tenant}`
    const versionsDir = `${tenantDir}/versions`
    const versionDir = `${versionsDir}/${versionId}`
    const dbFilePath = `${versionDir}/verses/${bookId}.db`
    const db = new Database(dbFilePath)
    const tableName = `${versionId}VersesBook${bookId}`
    return { db, tableName }
  }

  const getWords = ({
    loc,
    ref,
    versionId,
  }) => {
    loc = (loc || getLocFromRef(ref)).split(':')[0]

    if(!wordsCacheByVersionIdAndLoc[`${versionId} ${loc}`]) {

      const { db, tableName } = getDbAndTableName(versionId)
      const select = db.prepare(`SELECT * FROM ${tableName} WHERE loc = ?`)
      const { usfm } = select.get(loc) || {}
      
      if(!usfm) {
        const { chapter, verse } = ref || getRefFromLoc(loc)
        throw new Error(`Invalid verse: ${getBibleBookName(bookId)} ${chapter}:${verse} (${versionId})`)
      }

      wordsCacheByVersionIdAndLoc[`${versionId} ${loc}`] = (
        versionId === 'original'
          ? splitVerseIntoWords({ usfm, isOriginal: true }).map(({ text }) => text)
          : splitVerseIntoWords({ usfm, ...versionInfo }).map(({ text }) => text)
      )
    }

    return wordsCacheByVersionIdAndLoc[`${versionId} ${loc}`]
  }

  const getStandardMapping = ({ loc, isOriginalToTranslation }) => {
    const originalFullRange = `1-${getWords({ loc, versionId: 'original' }).length}`
    const translationFullRange = `1-${getWords({ loc, versionId: versionInfo.id }).length}`
    if(isOriginalToTranslation) {
      return { [originalFullRange]: `${loc}:${translationFullRange}` }
    } else {
      return { [translationFullRange]: `${loc}:${originalFullRange}` }
    }
  }

  const getPreviousTranslationLoc = loc => {
    const { db, tableName } = getDbAndTableName(versionInfo.id)
    const select = db.prepare(`SELECT * FROM ${tableName} WHERE loc < ? ORDER BY loc DESC LIMIT 1`)
    return (select.get(loc) || {}).loc
  }

  const getNextTranslationLoc = loc => {
    const { db, tableName } = getDbAndTableName(versionInfo.id)
    const select = db.prepare(`SELECT * FROM ${tableName} WHERE loc > ? ORDER BY loc LIMIT 1`)
    return (select.get(loc) || {}).loc
  }

  const wordsByOriginalLoc = {}
  const wordsByTranslationLoc = {}
  
  const originalLocsToShow = cloneObj(originalLocs)
  const newVersionInfo = cloneObj(versionInfo)
  newVersionInfo.extraVerseMappings = newVersionInfo.extraVerseMappings || {}

  const addToOriginalLocsToShow = originalLoc => {
    const bareOriginalLoc = originalLoc.split(':')[0]
    if(!originalLocsToShow.includes(bareOriginalLoc)) {
      originalLocsToShow.push(bareOriginalLoc)
      originalLocsToShow.sort()
    }
  }

  const updateExtraVerseMappings = (originalLoc, translationLoc) => {
    if(translationLoc === undefined) {
      delete newVersionInfo.extraVerseMappings[originalLoc]
    } else {
      newVersionInfo.extraVerseMappings[originalLoc] = translationLoc
    }
    if(translationLoc) addToOriginalLocsToShow(originalLoc)
  }

  const defaultReportError = () => {
    errorMessage = `All the words for that verse are already paired`
  }
  const insertWithAvailableWordRanges = ({ loc, isOriginal, otherLoc, mapping, reportError=defaultReportError, returnWordRangesOnly }) => {
    let words
    try {
      words = getWords({ loc, versionId: isOriginal ? 'original' : versionInfo.id })
    } catch(err) {
      errorMessage = `Invalid verse reference`
      return false
    }
    let remainingWordNums = Array(words.length).fill().map((x, idx) => idx+1)
    let mappedToLocs = []  // used for error when all words are already mapped
    if(!mapping) {
      const { originalToTranslation, translationToOriginal } = getVerseMappingsByVersionInfo(newVersionInfo)
      mapping = isOriginal ? originalToTranslation : translationToOriginal
    }
    if(mapping[loc] === null) {
      // nothing to do, since we will take all the words for the insert
    } else if(typeof mapping[loc] === 'string' || !mapping[loc]) {
      const showing = originalLocsToShow.includes((isOriginal ? loc : (mapping[loc] || loc)).split(':')[0])
      if(showing || returnWordRangesOnly) {
        remainingWordNums = []
        if(mapping[loc]) {
          mappedToLocs.push(mapping[loc].split(':')[0])
        }
      } else {
        const halfLength = parseInt(remainingWordNums.length / 2)
        const wordNums1 = remainingWordNums.slice(0, halfLength)
        const wordNums2 = remainingWordNums.slice(halfLength)
        const makeNewToBeLowerHalf = loc < originalLocsToShow[0]
        const newHalfVerseLoc = getLocFromRef({
          ...getRefFromLoc(loc),
          wordRanges: getWordRangesFromWordNums(makeNewToBeLowerHalf ? wordNums1 : wordNums2),
        })
        if(isOriginal) {
          updateExtraVerseMappings(newHalfVerseLoc, mapping[loc] || loc)
        } else {
          updateExtraVerseMappings(mapping[loc] || loc, newHalfVerseLoc)
        }
        remainingWordNums = makeNewToBeLowerHalf ? wordNums2 : wordNums1
      }
    } else {
      Object.keys(mapping[loc]).forEach(range => {
        const [ from, to ] = range.split('-').map(n => parseInt(n))
        remainingWordNums = remainingWordNums.filter(n => (n < (from || 1) || n > (to || Infinity)))
        if(mapping[loc][range]) {
          mappedToLocs.push(mapping[loc][range].split(':')[0])
        }
      })
    }
    if(remainingWordNums.length === 0) {
      reportError({ mappedToLocs })
      return false
    }
    const wordRanges = getWordRangesFromWordNums(remainingWordNums)
    if(returnWordRangesOnly) return wordRanges
    const newLoc = getLocFromRef({ ...getRefFromLoc(loc), wordRanges })
    if(isOriginal) {
      updateExtraVerseMappings(newLoc, otherLoc)
    } else {
      updateExtraVerseMappings(otherLoc, newLoc)
    }
    return true
  }

  try {
    console.log(hideCursor)

    let cursorPosition = 0

    await inquirer.prompt([{
      type: 'input',
      name: `-`,
      message: `Match the words of the original to the ${newVersionInfo.abbr} in corresponding pairs`,
      transformer: (input, x, { isFinal }) => {
        if(isFinal) return `✓`.green

        ///// Make edit

        // var hex = (charPressed || ` `).codePointAt(0).toString(16);
        // errorMessage = "\\u" + "0000".substring(0, 4 - hex.length) + hex;
        
        if(typing.key) {
          if(charPressed === `\u001b`) {  // esc
            typing = {}
          } else if(!typing.value && charPressed === `\t`) {
            if(typing.key === 'add-translation') {
              cursorPosition = (cursorPosition + 1) % editableItemIdx
            }
            typing = {}
          } else if(!typing.value && charPressed === `\u001b[Z`) {
            if(typing.key === 'add-translation') {
              cursorPosition = (editableItemIdx + cursorPosition - 1) % editableItemIdx
            }
            typing = {}
          } else if(/[0-9:]/.test(charPressed)) {
            typing.value += charPressed
          } else if([ '\u007f' ].includes(charPressed)) {  // backspace
            typing.value = typing.value.slice(0, -1)
          } else if(charPressed === `\t`) {
            if(typing.key === `add`) {
              const [ chapter, verse ] = typing.value.split(':').map(n => parseInt(n))
              const newOriginalLoc = getLocFromRef({ bookId, chapter, verse })
              try {
                getWords({ loc: newOriginalLoc, versionId: 'original' })  // validates the ref
                if(!originalLocsToShow.includes(newOriginalLoc)) {
                  originalLocsToShow.push(newOriginalLoc)
                  originalLocsToShow.sort()
                } else {
                  insertWithAvailableWordRanges({ loc: newOriginalLoc, isOriginal: true, otherLoc: null })
                }
                if(!errorMessage) {
                  typing = {}
                }
              } catch(err) {
                errorMessage = `Invalid verse reference`
              }
            } else {
              currentCallback(charPressed)
            }
          }
        } else {
          if(charPressed === `\t`) {
            cursorPosition = (cursorPosition + 1) % editableItemIdx
          } else if(charPressed === `\u001b[Z`) { // shift-tab
            cursorPosition = (editableItemIdx + cursorPosition - 1) % editableItemIdx
          } else if(charPressed === `\u001b[A`) { // up arrow
            currentCallback('up')
          } else if(charPressed === `\u001b[B`) { // down arrow
            currentCallback('down')
          } else if(charPressed === `\u001b[C`) { // right arrow
            currentCallback('right')
          } else if(charPressed === `\u001b[D`) { // left arrow
            currentCallback('left')
          } else if(charPressed === `,`) {
            currentCallback('comma')
          } else if(charPressed === `\u007f`) { // delete
            currentCallback('delete')
          } else if(charPressed === `+`) {
            typing = {
              key: `add`,
              value: ``,
            }
          } else if(charPressed === ` `) { // spacebar
            currentCallback('spacebar')
          }
        }

        ///// Display current

        // get text of verses
        originalLocsToShow.forEach(originalLoc => {
          if(!wordsByOriginalLoc[originalLoc]) {
            wordsByOriginalLoc[originalLoc] = getWords({ loc: originalLoc, versionId: 'original' })
          }
          ;(
            getCorrespondingRefs({
              baseVersion: {
                info: {
                  versificationModel: 'original',
                },
                ref: getRefFromLoc(originalLoc),
              },
              lookupVersionInfo: newVersionInfo,
            })
          )
            .map(translationRef => getLocFromRef(translationRef).split(':')[0])
            .forEach(translationLoc => {
              if(!wordsByTranslationLoc[translationLoc]) {
                wordsByTranslationLoc[translationLoc] = getWords({ loc: translationLoc, versionId: versionInfo.id })
              }
            })
        })

        // get text snippet to show for a given row
        const getPartialText = ({ words, ref }) => (
          words
            .map((w, idx) => (
              ref.wordRanges.some(range => {
                const [ from, to ] = range.split('-').map(n => parseInt(n))
                return idx+1 >= from && idx+1 <= to
              })
                ? w
                : `~`
            ))
            .join(' ')
            .replace(/( ?~)+ ?/g, ' ... ')
            .trim()
        )

        // get all mappings
        const { originalToTranslation } = getVerseMappingsByVersionInfo(newVersionInfo)
        const mappings = (
          originalLocsToShow
            .map(originalLoc => {
              const originalFullRange = `1-${wordsByOriginalLoc[originalLoc].length}`
              if(originalToTranslation[originalLoc] === null) {
                return {
                  originalLoc: `${originalLoc}:${originalFullRange}`,
                  loc: null,
                }
              }
              const originalLocToTranslation = (
                typeof originalToTranslation[originalLoc] === 'string'
                  ? { [originalFullRange]: originalToTranslation[originalLoc] }
                  : (
                    originalToTranslation[originalLoc]
                    || getStandardMapping({ loc: originalLoc, isOriginalToTranslation: true })
                  )
              )
              return Object.keys(originalLocToTranslation).map(originalWordRangeStr => {
                let [ loc, translationWordRangeStr ] = (originalLocToTranslation[originalWordRangeStr] || '').split(':')
                if(loc) {
                  const translationFullRange = `1-${wordsByTranslationLoc[loc].length}`
                  if(!translationWordRangeStr) {
                    translationWordRangeStr = translationFullRange
                  } else if(/^[0-9]+-$/.test(translationWordRangeStr)) {
                    translationWordRangeStr += wordsByTranslationLoc[loc].length
                  } else if(/^[0-9]+$/.test(translationWordRangeStr)) {
                    translationWordRangeStr = `${translationWordRangeStr}-${translationWordRangeStr}`
                  }
                  loc = `${loc}:${translationWordRangeStr}`
                }
                if(/^[0-9]+-$/.test(originalWordRangeStr)) {
                  originalWordRangeStr += wordsByOriginalLoc[originalLoc].length
                } else if(/^[0-9]+$/.test(originalWordRangeStr)) {
                  originalWordRangeStr = `${originalWordRangeStr}-${originalWordRangeStr}`
                }
                return {
                  originalLoc: `${originalLoc}:${originalWordRangeStr}`,
                  loc,
                }
              })
            })
            .flat()
        )

        // set up editable spots
        currentCallback = ()=>{}
        editableItemIdx = 0
        const addCursorHighlight = (str, callback) => {
          if(cursorPosition === editableItemIdx++) {
            currentCallback = callback
            return [ 'add' ].includes(typing.key) ? str : str.bgGreen
          }
          return str
        }

        const thisErrorMessage = errorMessage
        errorMessage = ``

        const progressBarLength = 67

        return [
          ``,
          Array(parseInt(progress * progressBarLength)).fill(`—`).join('').green + Array(progressBarLength - parseInt(progress * progressBarLength)).fill(`—`).join('').gray,
          ``,
          `–––––––––––––––––––––––––`.gray,
          mappings.map(({ originalLoc, loc }, mappingIdx) => {
            const numWordsInOriginal = wordsByOriginalLoc[originalLoc.split(':')[0]].length
            const numWordsInTranslation = loc ? wordsByTranslationLoc[loc.split(':')[0]].length : 0

            const originalRef = getRefFromLoc(originalLoc)
            const translationRef = loc ? getRefFromLoc(loc) : { wordRanges: [] }

            const isEntireOriginalStr = (originalRef.wordRanges.length === 1 && originalRef.wordRanges[0] === `1-${numWordsInOriginal}`) ? ` [entire verse]`.yellow : ` [partial verse]`.brightRed
            const isEntireTranslationStr = (translationRef.wordRanges.length === 1 && translationRef.wordRanges[0] === `1-${numWordsInTranslation}`) ? ` [entire verse]`.yellow : ` [partial verse]`.brightRed

            // adjust range
            const adjustRange = isOriginal => (rangeIdx, partIdx) => arrowDirection => {
              if(![ 'up', 'down', 'comma', 'delete' ].includes(arrowDirection)) return

              if(arrowDirection === 'comma') {
                const wordRanges = insertWithAvailableWordRanges({ loc: (isOriginal ? originalLoc : loc).split(':')[0], isOriginal, returnWordRangesOnly: true })
                if(wordRanges) {
                  const ref = isOriginal ? originalRef : translationRef
                  const newLoc = getLocFromRef({
                    ...ref,
                    wordRanges: [
                      ...ref.wordRanges,
                      wordRanges[0],
                    ].sort((a,b) => parseInt(a.split('-')[0]) - parseInt(b.split('-')[0])),
                  })
                  updateExtraVerseMappings(originalLoc)
                  updateExtraVerseMappings(
                    isOriginal ? newLoc : originalLoc,
                    isOriginal ? loc : newLoc,
                  )
                }
                return
              }

              if(arrowDirection === 'delete') {
                const ref = isOriginal ? originalRef : translationRef
                if((ref.wordRanges || []).length < 2) {
                  errorMessage = `You can only use DELETE when there are more than one word ranges in a list`
                } else {
                  ref.wordRanges.splice(rangeIdx, 1)
                  const newLoc = getLocFromRef(ref)
                  updateExtraVerseMappings(originalLoc)
                  updateExtraVerseMappings(
                    isOriginal ? newLoc : originalLoc,
                    isOriginal ? loc : newLoc,
                  )
                }
                return
              }

              const ref = isOriginal ? originalRef : translationRef
              const numWords = isOriginal ? numWordsInOriginal : numWordsInTranslation

              const updateRangePart = ({ ref, rangeIdx, partIdx, mappedLoc, changeAmt=(arrowDirection === `up` ? 1 : -1) }) => {
                const newRef = cloneObj(ref)
                const rangeParts = newRef.wordRanges[rangeIdx].split('-').map(n => parseInt(n))
                rangeParts[partIdx] = Math.max(1, Math.min(numWords, rangeParts[partIdx] + changeAmt))
                if(partIdx === 0) {
                  rangeParts[1] = Math.max(rangeParts[0], rangeParts[1])
                } else {
                  rangeParts[0] = Math.min(rangeParts[0], rangeParts[1])
                }
                newRef.wordRanges[rangeIdx] = rangeParts.join('-')
                if(isOriginal) {
                  updateExtraVerseMappings(getLocFromRef(newRef), mappedLoc || loc)
                } else {
                  updateExtraVerseMappings(mappedLoc || originalLoc, getLocFromRef(newRef))
                }
                return rangeParts
              }

              updateExtraVerseMappings(originalLoc)
              const [ newFrom, newTo ] = updateRangePart({ ref, rangeIdx, partIdx })

              mappings.forEach((otherMapping, mIdx) => {
                if(!otherMapping.loc) return
                const otherLoc = otherMapping[isOriginal ? `originalLoc` : `loc`]
                const mappedLoc = otherMapping[!isOriginal ? `originalLoc` : `loc`]
                if(
                  mIdx !== mappingIdx
                  && otherLoc.split(':')[0] === (isOriginal ? originalLoc : loc).split(':')[0]
                ) {
                  const { wordRanges, ...otherRefParts } = getRefFromLoc(otherLoc)
                  wordRanges.some((range, rIdx) => {
                    let [ from, to ] = range.split('-').map(n => parseInt(n))

                    const removeRange = () => {
                      wordRanges.splice(rIdx, 1)
                      if(wordRanges.length === 0) {
                        if(!isOriginal) {
                          updateExtraVerseMappings(mappedLoc.split(':')[0], null)
                        }
                      } else {
                        const newOtherLoc = getLocFromRef({ ...otherRefParts, wordRanges })
                        if(isOriginal) {
                          updateExtraVerseMappings(newOtherLoc, mappedLoc)
                        } else {
                          updateExtraVerseMappings(mappedLoc, newOtherLoc)
                        }
                      }
                    }

                    const fromChange = (from >= newFrom ? Math.max(from, newTo + 1) : from) - from
                    const toChange = (to <= newTo ? Math.min(to, newFrom - 1) : to) - to
                    if(fromChange || toChange) {
                      updateExtraVerseMappings(otherMapping.originalLoc)
                      if((from + fromChange) > (to + toChange) || !!fromChange === !!toChange) {
                        removeRange()
                      } else {
                        updateRangePart({
                          ref: getRefFromLoc(otherLoc),
                          rangeIdx: rIdx,
                          partIdx: fromChange ? 0 : 1,
                          mappedLoc,
                          changeAmt: fromChange || toChange,
                        })
                      }
                      return true
                    }
                  })
                }
              })

            }

            const originalChVsStr = `${originalRef.chapter}:${originalRef.verse}`
            const originalWordRangeStr = (
              originalRef.wordRanges
                .map((range, rangeIdx) => {
                  const [ from, to ] = range.split('-')
                  return [
                    (rangeIdx === 0 ? `` : `,`),
                    addCursorHighlight(from, adjustRange(true)(rangeIdx, 0)),
                    `-`,
                    addCursorHighlight(to, adjustRange(true)(rangeIdx, 1)),
                  ]
                })
                .flat()
                .join(``)
            )
            const originalLocInfoStr = `${getBibleBookName(bookId)} ${originalChVsStr}, words: ${originalWordRangeStr}${isEntireOriginalStr}`+` (Original)`.gray
            let originalText = getPartialText({ words: wordsByOriginalLoc[originalLoc.split(':')[0]], ref: originalRef })

            let translationLocInfoStr, translationText
            if(loc) {

              const translationChVsStr = addCursorHighlight(
                `${translationRef.chapter}:${translationRef.verse}`,
                arrowDirection => {
                  if(![ 'left', 'right' ].includes(arrowDirection)) return
                  let newTranslationLoc = (arrowDirection === 'left' ? getPreviousTranslationLoc : getNextTranslationLoc)(loc.split(':')[0])
                  const reportError = ({ mappedToLocs }) => {
                    const chVsCombos = [ ...new Set(mappedToLocs) ].map(loc => {
                      const { chapter, verse } = getRefFromLoc(loc)
                      return `${chapter}:${verse}`
                    })
                    errorMessage = `All words in the ${arrowDirection === 'left' ? `previous` : `next`} verse are already paired to ${chVsCombos.join(" and ")} in the original`
                  }
                  insertWithAvailableWordRanges({ loc: newTranslationLoc, otherLoc: originalLoc, reportError })
                },
              )
              const translationWordRangeStr = (
                translationRef.wordRanges
                  .map((range, rangeIdx) => {
                    const [ from, to ] = range.split('-')
                    return [
                      (rangeIdx === 0 ? `` : `,`),
                      addCursorHighlight(from, adjustRange(false)(rangeIdx, 0)),
                      `-`,
                      addCursorHighlight(to, adjustRange(false)(rangeIdx, 1)),
                    ]
                  })
                  .flat()
                  .join(``)
              )
              translationLocInfoStr = `${getBibleBookName(bookId)} ${translationChVsStr}, words: ${translationWordRangeStr}${isEntireTranslationStr}`+` (${newVersionInfo.abbr})`.gray
              translationText = getPartialText({ words: wordsByTranslationLoc[loc.split(':')[0]], ref: translationRef }).white

            } else {

              if(cursorPosition === editableItemIdx) {

                if(!typing.key) {
                  typing = {
                    key: `add-translation`,
                    value: ``,
                  }
                }

                translationLocInfoStr = (
                  getBibleBookName(bookId).brightGreen
                  + ` `
                  + (
                    addCursorHighlight(
                      typing.value || ` `,
                      key => {
                        const [ chapter, verse ] = typing.value.split(':').map(n => parseInt(n))
                        if(!insertWithAvailableWordRanges({ loc: getLocFromRef({ bookId, chapter, verse }), otherLoc: originalLoc })) return
                        typing = {}
                      },
                    )
                  )
                  + ` (${versionInfo.abbr})`.gray
                  + (
                    typing.value
                      ? `  >> Hit TAB when finished or ESC to cancel <<`.white
                      : ``
                  )
                )
                translationText = `—`.gray

              } else {

                translationLocInfoStr = (
                  `Not translated`.cyan
                  + addCursorHighlight(``, key => {})
                  + ` (${versionInfo.abbr})`.gray
                )
                translationText = `—`.gray

              }

            }

            return [
              `\u2068`+originalLocInfoStr,
              (bookId <= 39 ? `\u2067` : `\u2068`)+originalText.white,
              `\u2068`+translationLocInfoStr,
              `\u2068`+translationText,
              `–––––––––––––––––––––––––`.gray,
            ]
          }),
          ...(
            typing.key === `add`
              ? [
                `Type a chapter and verse for the Original (e.g. 12:2) and press `.gray+`TAB`.white+` when complete. Press `.gray+`ESC`.white+` to cancel.`.gray,
                `${getBibleBookName(bookId)} ${typing.value}${` `.bgGray}`.brightGreen+` (Original)`.gray,
              ]
              : []
          ),
          thisErrorMessage.brightRed,
          ``,
          `Use `.gray+`TAB`.white+` to change the selection`.gray,
          `Use `.gray+`↑`.white+` and `.gray+`↓`.white+` to adjust a word number`.gray,
          `Use `.gray+`←`.white+` and `.gray+`→`.white+` to adjust a translation verse`.gray,
          `Use `.gray+`+`.white+` to add a mapping pair to this set`.gray,
          `Use `.gray+`,`.white+` to add another word range and `.gray+`DELETE`.white+` to remove one`.gray,
          // `Use `.gray+`ESC`.white+` to reset the pairs`.gray,
          ``,
          `Press `.gray+`ENTER`.white+` when everything is paired correctly`.gray,
          ...(debugLog ? [ ``, `DEBUG: ${debugLog}`.red ] : []),
        ].flat(2).join(`\n`)
      }
    }])

    console.log(showCursor)
    return newVersionInfo.extraVerseMappings

  } catch(err) {
    console.log(showCursor)
    throw err
  }

}

module.exports = confirmAndCorrectMapping
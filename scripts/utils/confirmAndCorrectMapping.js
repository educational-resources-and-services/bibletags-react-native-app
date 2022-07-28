const Database = require('better-sqlite3')
const { getBibleBookName, splitVerseIntoWords } = require("@bibletags/bibletags-ui-helper")
const { getCorrespondingRefs, getRefFromLoc, getNextOriginalLoc, getLocFromRef,
        getVerseMappingsByVersionInfo } = require('@bibletags/bibletags-versification')
require('colors')
const inquirer = require('inquirer')

const hideCursor = `\u001B[?25l`
const showCursor = `\u001B[?25h`

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

const confirmAndCorrectMapping = async ({ originalLocs, versionInfo, tenant }) => {

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

  try {
    console.log(hideCursor)

    let cursorPosition = 0
    let charPressed
    process.stdin.on('data', d => {
      charPressed = d.toString()
    })
    let editableItemIdx, currentCallback, debugLog, errorMessage=``, typing={}

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
          } else if(/[0-9:]/.test(charPressed)) {
            typing.value += charPressed
          } else if([ '\u007f' ].includes(charPressed)) {  // backspace
            typing.value = typing.value.slice(0, -1)
          } else if(charPressed === `\t`) {
            currentCallback(charPressed)
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
        const { originalToTranslation, translationToOriginal } = getVerseMappingsByVersionInfo(newVersionInfo)
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
                let [ loc, translationWordRangeStr ] = originalLocToTranslation[originalWordRangeStr].split(':')
                const translationFullRange = `1-${wordsByTranslationLoc[loc].length}`
                if(!translationWordRangeStr) {
                  translationWordRangeStr = translationFullRange
                } else if(/^[0-9]+-$/.test(translationWordRangeStr)) {
                  translationWordRangeStr += wordsByTranslationLoc[loc].length
                }
                return {
                  originalLoc: `${originalLoc}:${originalWordRangeStr}`,
                  loc: `${loc}:${translationWordRangeStr}`,
                }
              })
            })
            .flat()
        )

        // get new word range
        const getAvailableWordRanges = ({ loc, isOriginal }) => {
          const words = getWords({ loc, versionId: isOriginal ? 'original' : versionInfo.id })
          let remainingWordNums = Array(words.length).fill().map((x, idx) => idx+1)
          let mappedToOrigLocs = []
          const mapToUse = isOriginal ? originalToTranslation : translationToOriginal
          if(typeof mapToUse[loc] === 'string') {
            remainingWordNums = []
            mappedToOrigLocs.push(mapToUse[loc].split(':')[0])
          } else {
            if(mapToUse[loc]) {
              Object.keys(mapToUse[loc]).forEach(range => {
                const [ from, to ] = range.split('-').map(n => parseInt(n))
                remainingWordNums = remainingWordNums.filter(n => (n < (from || 1) || n > (to || Infinity)))
                mappedToOrigLocs.push(mapToUse[loc][range].split(':')[0])
              })
            } else {
              const halfLength = parseInt(remainingWordNums.length/2)
              const wordNums1 = remainingWordNums.slice(0, halfLength)
              const wordNums2 = remainingWordNums.slice(halfLength)
              const makeNewToBeLowerHalf = loc < originalLocsToShow[0]
              const newHalfVerseLoc = getLocFromRef({
                ...getRefFromLoc(loc),
                wordRanges: getWordRangesFromWordNums(makeNewToBeLowerHalf ? wordNums1 : wordNums2),
              })
              if(isOriginal) {
                updateExtraVerseMappings(newHalfVerseLoc, loc)
              } else {
                updateExtraVerseMappings(loc, newHalfVerseLoc)
              }
              remainingWordNums = makeNewToBeLowerHalf ? wordNums2 : wordNums1
            }
          }
          if(remainingWordNums.length === 0) return { mappedToOrigLocs }
          return { newWordRanges: getWordRangesFromWordNums(remainingWordNums) }
        }

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

        return [
          ``,
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
              if(![ 'up', 'down' ].includes(arrowDirection)) return

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
                return rangeParts[partIdx]
              }

              updateExtraVerseMappings(originalLoc)
              const newRangeNum = updateRangePart({ ref, rangeIdx, partIdx })

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

                    if(partIdx === 1 && from === newRangeNum) {
                      updateExtraVerseMappings(otherMapping.originalLoc)
                      if(from === to) {
                        removeRange()
                      } else {
                        updateRangePart({
                          ref: getRefFromLoc(otherLoc),
                          rangeIdx: rIdx,
                          partIdx: 0,
                          mappedLoc,
                          changeAmt: 1,
                        })
                      }
                      return true
                    }
                    if(partIdx === 0 && to === newRangeNum) {
                      updateExtraVerseMappings(otherMapping.originalLoc)
                      if(from === to) {
                        removeRange()
                      } else {
                        updateRangePart({
                          ref: getRefFromLoc(otherLoc),
                          rangeIdx: rIdx,
                          partIdx: 1,
                          mappedLoc,
                          changeAmt: -1,
                        })
                      }
                      return true
                    }
                  })
                }
              })
              // EITHER
                // first num: remove line before OR adjust line before
                // second num: remove line after OR adjust line after

            }

            const originalChVsStr = `${originalRef.chapter}:${originalRef.verse}`
            const originalWordRangeStr = (
              originalRef.wordRanges
                .map((range, rangeIdx) => {
                  const [ from, to ] = range.split('-')
                  return [
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
            if(bookId <= 39) {
              originalText = `\u2067${originalText}\u2066`
            }

            let translationLocInfoStr, translationText
            if(loc) {

              const translationChVsStr = addCursorHighlight(
                `${translationRef.chapter}:${translationRef.verse}`,
                arrowDirection => {
                  if(![ 'left', 'right' ].includes(arrowDirection)) return
                  const oldExtraVerseMappings = cloneObj(newVersionInfo.extraVerseMappings)
                  updateExtraVerseMappings(
                    originalLoc,
                    (arrowDirection === 'left' ? getPreviousTranslationLoc : getNextTranslationLoc)(loc.split(':')[0]),
                  )
                  const newTranslationLoc = newVersionInfo.extraVerseMappings[originalLoc]
                  if(translationToOriginal[newTranslationLoc]) {
                    const { newWordRanges, mappedToOrigLocs } = getAvailableWordRanges({ loc: newTranslationLoc })
                    if(!newWordRanges) {
                      newVersionInfo.extraVerseMappings = oldExtraVerseMappings
                      const chVsCombos = [ ...new Set(mappedToOrigLocs) ].map(loc => {
                        const { chapter, verse } = getRefFromLoc(loc)
                        return `${chapter}:${verse}`
                      })
                      errorMessage = `All words in the ${arrowDirection === 'left' ? `previous` : `next`} verse are already paired to ${chVsCombos.join(" and ")} in the original`
                      return
                    }
                    updateExtraVerseMappings(originalLoc, `${newTranslationLoc}:${newWordRanges.join(',')}`)
                  }
                },
              )
              const translationWordRangeStr = (
                translationRef.wordRanges
                  .map((range, rangeIdx) => {
                    const [ from, to ] = range.split('-')
                    return [
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
                        let wordRanges
                        try {
                          wordRanges = getAvailableWordRanges({ loc: getLocFromRef({ bookId, chapter, verse }) }).newWordRanges
                        } catch(err) {
                          errorMessage = `Invalid verse reference`
                          return
                        }
                        if(!wordRanges) {
                          errorMessage = `All the words for that verse are already paired`
                          return
                        }
                        updateExtraVerseMappings(originalLoc, getLocFromRef({ bookId, chapter, verse, wordRanges }))
                        typing = {}
                      },
                    )
                  )
                  + ` (${versionInfo.abbr})`.gray
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
              originalLocInfoStr,
              originalText.white,
              translationLocInfoStr,
              translationText,
              `–––––––––––––––––––––––––`.gray,
            ]
          }),
          ...(
            typing.key === `add`
              ? [
                `Type a chapter and verse for the Original (e.g. 12:2) and press `.gray+`TAB`.white+` when complete. Press `.gray+`ESC`.white+` to cancel.`.gray,
                `${getBibleBookName(bookId)} ${typing.value}${` `.bgGray}`.brightGreen,
              ]
              : []
          ),
          thisErrorMessage.brightRed,
          ``,
          `Use `.gray+`TAB`.white+` to change the selection`.gray,
          `Use `.gray+`↑`.white+` and `.gray+`↓`.white+` to adjust a word number`.gray,
          `Use `.gray+`←`.white+` and `.gray+`→`.white+` to adjust a translation verse`.gray,
          `Use `.gray+`+`.white+` to add a mapping pair to this set`.gray,
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
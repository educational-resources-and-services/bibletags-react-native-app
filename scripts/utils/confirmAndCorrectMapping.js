const Database = require('better-sqlite3')
const { getBibleBookName, splitVerseIntoWords, getLanguageInfo } = require("@bibletags/bibletags-ui-helper")
const { getCorrespondingRefs, getRefFromLoc, getNextOriginalLoc, getLocFromRef,
        getVerseMappingsByVersionInfo } = require('@bibletags/bibletags-versification')
require('colors')
const inquirer = require('inquirer')
const { Translate } = require('@google-cloud/translate').v2
const translate = new Translate({ projectId: 'bible-tags' })

const hideCursor = `\u001B[?25l`
const showCursor = `\u001B[?25h`

const googleTranslatedWords = {}

let charPressed
process.stdin.on('data', d => {
  charPressed = d.toString()
})

const cloneObj = obj => JSON.parse(JSON.stringify(obj))
const equalObjsIgnoreKeyOrdering = (obj1, obj2) => {
  const isObject = obj => (obj != null && typeof obj === 'object')
  if(!isObject(obj1) || !isObject(obj2)) return obj1 === obj2
  const props1 = Object.getOwnPropertyNames(obj1)
  const props2 = Object.getOwnPropertyNames(obj2)
  if(props1.length !== props2.length) return false
  for(var i = 0; i < props1.length; i++) {
    let val1 = obj1[props1[i]]
    let val2 = obj2[props1[i]]
    let isObjects = isObject(val1) && isObject(val2)
    if((isObjects && !equalObjsIgnoreKeyOrdering(val1, val2)) || (!isObjects && val1 !== val2)) {
      return false
    }
  }
  return true
}

const wordRangeSort =(a,b) => parseInt(a.split('-')[0]) - parseInt(b.split('-')[0])

const getStartAndEndWordNumsFromRangeStr = (rangeStr, num) => {
  const fullRange = `1-${num}`
  let [ start, end ] = (rangeStr || fullRange).split('-').map(n => parseInt(n))
  end = end || (/-$/.test(rangeStr) ? num : start)
  return [ start, end ]
}

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

const confirmAndCorrectMapping = async ({ originalLocs, versionInfo, tenantDir, progress }) => {

  const languageCodeTwoDigit = getLanguageInfo(versionInfo.languageId).iso6391 || versionInfo.id

  // validate input
  let bookId
  for(let idx=0; idx<originalLocs.length; idx++) {
    if(idx > 0 && originalLocs[idx] !== getNextOriginalLoc(originalLocs[idx-1])) {
      throw new Error(`confirmAndCorrectMapping called with inconsecutive originalLocs`)
    }
    const thisBookId = getRefFromLoc(originalLocs[idx]).bookId
    if(bookId && bookId !== thisBookId) {
      throw new Error(`confirmAndCorrectMapping called with originalLocs spanning multiple books`)
    }
    bookId = thisBookId
  }

  let editableItemIdx, currentCallback, debugLog, errorMessage=``, typing={}, locked=true, showTranslation=false

  const oldVerseMappingsByVersionInfo = getVerseMappingsByVersionInfo(versionInfo)
  delete oldVerseMappingsByVersionInfo.createdAt

  const getDbAndTableName = (versionId, bookId) => {
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
    failGracefully,
  }) => {
    loc = (loc || getLocFromRef(ref)).split(':')[0]
    
    if(!wordsCacheByVersionIdAndLoc[`${versionId} ${loc}`]) {

      const { bookId, chapter, verse } = ref || getRefFromLoc(loc)
      const { db, tableName } = getDbAndTableName(versionId, bookId)
      const select = db.prepare(`SELECT * FROM ${tableName} WHERE loc = ?`)
      const { usfm } = select.get(loc) || {}
      
      if(!usfm) {
        if(failGracefully) return []
        throw new Error(`Invalid verse: ${getBibleBookName(bookId)} ${chapter}:${verse} (${versionId})`)
      }

      wordsCacheByVersionIdAndLoc[`${versionId} ${loc}`] = (
        versionId === 'original'
          ? splitVerseIntoWords({ usfm, isOriginal: true }).map(({ text }) => text)
          : splitVerseIntoWords({ usfm, ...versionInfo }).map(({ text }) => text)
      )

      if(versionInfo.languageId !== 'eng' && versionId !== 'original') {
        const newWordsToTranslate = []
        wordsCacheByVersionIdAndLoc[`${versionId} ${loc}`].forEach(translationWord => {
          if(googleTranslatedWords[translationWord] === undefined) {
            googleTranslatedWords[translationWord] = null  // indicates that it should be fetched
            newWordsToTranslate.push(translationWord)
          }
        })
        if(newWordsToTranslate.length > 0) {
          const segmentSize = 10
          for(let i=0; i<newWordsToTranslate.length; i+=segmentSize) {
            const wordsToTranslateSegment = newWordsToTranslate.slice(i, i + segmentSize)
            translate.translate(wordsToTranslateSegment, { to: 'en', from: languageCodeTwoDigit })
              .then(translations => {
                wordsToTranslateSegment.forEach((translationWord, idx) => {
                  googleTranslatedWords[translationWord] = translations[0][idx]
                })
              })
              .catch(err => {})
          }
        }
      }

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
    const { db, tableName } = getDbAndTableName(versionInfo.id, getRefFromLoc(loc).bookId)
    const select = db.prepare(`SELECT * FROM ${tableName} WHERE loc < ? ORDER BY loc DESC LIMIT 1`)
    return (select.get(loc) || {}).loc
  }

  const getNextTranslationLoc = loc => {
    const { db, tableName } = getDbAndTableName(versionInfo.id, getRefFromLoc(loc).bookId)
    const select = db.prepare(`SELECT * FROM ${tableName} WHERE loc > ? ORDER BY loc LIMIT 1`)
    return (select.get(loc) || {}).loc
  }

  const wordsByOriginalLoc = {}
  const wordsByTranslationLoc = {}
  
  const originalLocsToShow = []
  const newVersionInfo = cloneObj(versionInfo)
  newVersionInfo.extraVerseMappings = newVersionInfo.extraVerseMappings || {}

  const makeExtraVerseMappingKeysExplicit = () => {
    const makeMappingExplicit = ({ mapping, isOriginal }) => {
      if(!mapping) return mapping  // as it may legitimately be null
      const numWords = getWords({ loc: mapping.split(':')[0], versionId: isOriginal ? 'original' : versionInfo.id, failGracefully: !isOriginal }).length
      if(numWords === 0) return null
      let [ loc, wordRangeStr=`1-${numWords}` ] = mapping.split(':')
      return (
        `${loc}:`
        + (
          wordRangeStr
            .split(',')
            .sort(wordRangeSort)
            .map(rangeStr => {
              let [ start, end ] = getStartAndEndWordNumsFromRangeStr(rangeStr, numWords)
              return `${start}-${end}`
            })
            .join(',')
        )
      )
    }
    for(let key in newVersionInfo.extraVerseMappings) {
      newVersionInfo.extraVerseMappings[key] = makeMappingExplicit({ mapping: newVersionInfo.extraVerseMappings[key] })
      const explicitKey = makeMappingExplicit({ mapping: key, isOriginal: true })
      if(explicitKey !== key) {
        newVersionInfo.extraVerseMappings[explicitKey] = newVersionInfo.extraVerseMappings[key]
        delete newVersionInfo.extraVerseMappings[key]
      }
    }
  }

  const getNormalizedExtraVerseMappings = extraVerseMappings => {
    extraVerseMappings = cloneObj(extraVerseMappings)
    const normalizeMapping = ({ mapping, isOriginal }) => {
      if(!mapping) return mapping  // as it may legitimately be null
      const numWords = getWords({ loc: mapping.split(':')[0], versionId: isOriginal ? 'original' : versionInfo.id }).length
      let [ loc, wordRangeStr=`1-${numWords}` ] = mapping.split(':')
      if(wordRangeStr === `1-${numWords}`) return loc
      return (
        `${loc}:`
        + (
          wordRangeStr
            .split(',')
            .sort(wordRangeSort)
            .reduce((ranges, thisRange) => {
              if(ranges.length === 0) return [ thisRange ]

              const partsOfPreviousRange = getStartAndEndWordNumsFromRangeStr(ranges[ranges.length - 1], numWords)
              const partsOfNewRange = getStartAndEndWordNumsFromRangeStr(thisRange, numWords)

              if(partsOfPreviousRange[1] + 1 === partsOfNewRange[0]) {
                ranges[ranges.length - 1] = `${partsOfPreviousRange[0]}-${partsOfNewRange[1]}`
              } else {
                ranges.push(thisRange)
              }

              return ranges
            }, [])  
            .map(rangeStr => {
              let [ start, end ] = getStartAndEndWordNumsFromRangeStr(rangeStr, numWords)
              if(end === numWords) return `${start}-`
              if(start === end) return start
              return `${start}-${end}`
            })
            .join(',')
        )
      )
    }
    for(let key in extraVerseMappings) {
      extraVerseMappings[key] = normalizeMapping({ mapping: extraVerseMappings[key] })
      const explicitKey = normalizeMapping({ mapping: key, isOriginal: true })
      if(explicitKey !== key) {
        extraVerseMappings[explicitKey] = extraVerseMappings[key]
        delete extraVerseMappings[key]
      }
    }

    // sort the keys
    extraVerseMappings = Object.keys(extraVerseMappings).sort().reduce(
      (obj, key) => { 
        obj[key] = extraVerseMappings[key]
        return obj
      }, 
      {}
    )

    // get rid of unnecessary mappings
    for(let key in extraVerseMappings) {
      if(/^[0-9]{8}$/.test(key) && key === extraVerseMappings[key] && oldVerseMappingsByVersionInfo.originalToTranslation[key] === undefined) {
        delete extraVerseMappings[key]
      }
    }

    return extraVerseMappings
  }

  const hasChange = newVerInfo => {
    const newVerseMappingsByVersionInfo = getVerseMappingsByVersionInfo(newVerInfo)
    delete newVerseMappingsByVersionInfo.createdAt
    return !equalObjsIgnoreKeyOrdering(oldVerseMappingsByVersionInfo, newVerseMappingsByVersionInfo)
  }

  const addToOriginalLocsToShow = originalLoc => {
    const { originalToTranslation, translationToOriginal } = getVerseMappingsByVersionInfo(newVersionInfo)

    const goAddToOriginalLocsToShow = originalLocWithWordRangeStr => {
      const bareOriginalLoc = originalLocWithWordRangeStr.split(':')[0]

      if(!originalLocsToShow.includes(bareOriginalLoc)) {

        originalLocsToShow.push(bareOriginalLoc)

        // add this originalLoc to newVersionInfo.extraVerseMappings
        const translationLocs = []

        if(originalToTranslation[bareOriginalLoc] === null) {
          newVersionInfo.extraVerseMappings[bareOriginalLoc] = originalToTranslation[bareOriginalLoc]
        } else if(typeof originalToTranslation[bareOriginalLoc] === 'string') {
          newVersionInfo.extraVerseMappings[bareOriginalLoc] = originalToTranslation[bareOriginalLoc]
          translationLocs.push(originalToTranslation[bareOriginalLoc])
        } else if(originalToTranslation[bareOriginalLoc]) {
          for(let wordRangeStr in originalToTranslation[bareOriginalLoc]) {
            newVersionInfo.extraVerseMappings[`${bareOriginalLoc}:${wordRangeStr}`] = originalToTranslation[bareOriginalLoc][wordRangeStr]
            translationLocs.push(originalToTranslation[bareOriginalLoc][wordRangeStr])
          }
        }

        translationLocs.forEach(translationLoc => {
          if(!translationLoc) return
          let moreOriginalLocs = translationToOriginal[translationLoc.split(':')[0]] || []
          if(typeof moreOriginalLocs === 'string') {
            moreOriginalLocs = { '': moreOriginalLocs }
          }
          Object.values(moreOriginalLocs).forEach(goAddToOriginalLocsToShow)
        })

      }
    }

    goAddToOriginalLocsToShow(originalLoc)
    originalLocsToShow.sort()
    makeExtraVerseMappingKeysExplicit()
  }

  originalLocs.forEach(addToOriginalLocsToShow)

  const updateExtraVerseMappings = (originalLoc, translationLoc) => {

    const bareOriginalLoc = originalLoc.split(':')[0]
    const oWords = getWords({ loc: originalLoc, versionId: 'original' })
    const explicitOriginalLoc = [ `${bareOriginalLoc}:1-`, bareOriginalLoc ].includes(originalLoc) ? `${bareOriginalLoc}:1-${oWords.length}` : originalLoc

    delete newVersionInfo.extraVerseMappings[explicitOriginalLoc]

    if(translationLoc === null) {

      newVersionInfo.extraVerseMappings[explicitOriginalLoc] = null

    } else if(translationLoc) {

      newVersionInfo.extraVerseMappings[explicitOriginalLoc] = translationLoc
      makeExtraVerseMappingKeysExplicit()
      addToOriginalLocsToShow(bareOriginalLoc)

    }
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
    if(
      mapping[loc] === null
      || (
        !isOriginal
        && (
          !getCorrespondingRefs({
            baseVersion: {
              info: newVersionInfo,
              ref: getRefFromLoc(loc),
            },
            lookupVersionInfo: {
              versificationModel: 'original',
            },
          })
        )
      )
    ) {
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
        range.split(',').forEach(rangeStr => {
          const [ from, to ] = getStartAndEndWordNumsFromRangeStr(rangeStr, words.length)
          remainingWordNums = remainingWordNums.filter(n => (n < from || n > to))
        })
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

    let cursorPosition = 4

    const message = `Match the words of the original to the ${newVersionInfo.abbr} in corresponding pairs`
    await inquirer.prompt([{
      type: 'input',
      name: `-`,
      message,
      transformer: (input, x, { isFinal }) => {
        if(isFinal) return `✓`.green

        debugLog = []

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
                  addToOriginalLocsToShow(newOriginalLoc)
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
            locked = !locked
          } else if(charPressed === `t`) {
            showTranslation = !showTranslation
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
                const [ from, to ] = getStartAndEndWordNumsFromRangeStr(range, words.length)
                return idx+1 >= from && idx+1 <= to
              })
                ? w
                : `~`
            ))
            .join(' ')
            .replace(/( ?~)+ ?/g, ' ... ')
            .trim()
        )

        const unmarkedOriginalWordsByLoc = cloneObj(wordsByOriginalLoc)
        const unmarkedTranslationWordsByLoc = cloneObj(wordsByTranslationLoc)

        // get all mappings
        const { originalToTranslation } = getVerseMappingsByVersionInfo(newVersionInfo)
        const mappings = (
          originalLocsToShow
            .map(originalLoc => {
              const numOriginalWords = wordsByOriginalLoc[originalLoc].length
              const originalFullRange = `1-${numOriginalWords}`
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
              return Object.keys(originalLocToTranslation).sort(wordRangeSort).map(originalWordRangeStr => {
                let [ loc, translationWordRangeStr ] = (originalLocToTranslation[originalWordRangeStr] || '').split(':')
                loc = loc || null

                originalWordRangeStr = (
                  originalWordRangeStr
                    .split(',')
                    .map(rangeStr => {
                      let [ start, end ] = getStartAndEndWordNumsFromRangeStr(rangeStr, numOriginalWords)
                      return `${start}-${end}`
                    })
                    .sort(wordRangeSort)
                    .join(',')
                )

                if(loc) {
                  const numTranslationWords = wordsByTranslationLoc[loc].length
                  const translationFullRange = `1-${numTranslationWords}`
                  translationWordRangeStr = (
                    (translationWordRangeStr || translationFullRange)
                      .split(',')
                      .map(rangeStr => {
                        let [ start, end ] = getStartAndEndWordNumsFromRangeStr(rangeStr, numTranslationWords)

                        for(let wNum=start; wNum<=end; wNum++) {
                          unmarkedTranslationWordsByLoc[loc][wNum-1] = null
                        }  

                        if(start > numTranslationWords) {
                          return null
                        } else if(end > numTranslationWords) {
                          return `${start}-${numTranslationWords}`
                        } else {
                          return `${start}-${end}`
                        }
                      })
                      .filter(Boolean)
                      .sort(wordRangeSort)
                      .join(',')
                  )

                  const markOrigWords = () => {
                    originalWordRangeStr
                      .split(',')
                      .forEach(rangeStr => {
                        let [ start, end ] = getStartAndEndWordNumsFromRangeStr(rangeStr, numOriginalWords)
                        for(let wNum=start; wNum<=end; wNum++) {
                          unmarkedOriginalWordsByLoc[originalLoc][wNum-1] = null
                        }
                      })
                  }

                  if(translationWordRangeStr) {
                    markOrigWords()
                    loc = `${loc}:${translationWordRangeStr}`
                  } else {
                    // see if there is a translation loc that corresponds to the original, that isn't mapped at present
                    const words = getWords({ loc: originalLoc, versionId: versionInfo.id, failGracefully: true })
                    if(
                      words.length > 0
                      && (
                        !getCorrespondingRefs({
                          baseVersion: {
                            info: newVersionInfo,
                            ref: getRefFromLoc(originalLoc),
                          },
                          lookupVersionInfo: {
                            versificationModel: 'original',
                          },
                        })
                      )
                    ) {
                      markOrigWords()
                      loc = `${originalLoc}:1-${words.length}`
                      wordsByTranslationLoc[originalLoc] = words
                    } else {
                      loc = null
                    }
                  }

                  newVersionInfo.extraVerseMappings[`${originalLoc}:${originalWordRangeStr}`] = loc  // in case it has been adjusted

                }
                return {
                  originalLoc: `${originalLoc}:${originalWordRangeStr}`,
                  loc,
                }
              })
            })
            .flat()
            .filter(Boolean)
        )

        const unmarkedOriginalWords = Object.values(unmarkedOriginalWordsByLoc).flat().filter(Boolean)
        const unmarkedTranslationWords = Object.values(unmarkedTranslationWordsByLoc).flat().filter(Boolean)

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

        const progressBarLength = message.length + 2
        const containsChange = hasChange({ ...newVersionInfo, extraVerseMappings: getNormalizedExtraVerseMappings(newVersionInfo.extraVerseMappings) })

        return [
          ``,
          Array(parseInt(progress * progressBarLength)).fill(`—`).join('').green + Array(progressBarLength - parseInt(progress * progressBarLength)).fill(`—`).join('').gray,
          ``,
          `STATUS: `.gray+(containsChange ? `CONTAINS CHANGES`.green : `UNCHANGED`.white),
          `––––––––`.gray,
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
                    ].sort(wordRangeSort),
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
                  if(isOriginal) {
                    errorMessage = `You cannot DELETE a lone original language word range`
                  } else {
                    updateExtraVerseMappings(originalLoc, null)
                  }
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
                const newLoc = getLocFromRef(newRef)
                if(isOriginal) {
                  updateExtraVerseMappings(newLoc, mappedLoc === undefined ? loc : mappedLoc)
                } else {
                  updateExtraVerseMappings(mappedLoc || originalLoc, newLoc)
                }
                return { rangeParts, newLoc }
              }

              updateExtraVerseMappings(originalLoc)
              const { rangeParts: [ newFrom, newTo ], newLoc } = updateRangePart({ ref, rangeIdx, partIdx })

              mappings.forEach((otherMapping, mIdx) => {
                if(!isOriginal && !otherMapping.loc) return
                if(mIdx === mappingIdx && isOriginal) {
                  otherMapping.originalLoc = newLoc
                }
                const otherLoc = otherMapping[isOriginal ? `originalLoc` : `loc`]
                const mappedLoc = otherMapping[!isOriginal ? `originalLoc` : `loc`]
                if(otherLoc.split(':')[0] === (isOriginal ? originalLoc : loc).split(':')[0]) {
                  const { wordRanges, ...otherRefParts } = getRefFromLoc(otherLoc)
                  wordRanges.some((range, rIdx) => {
                    if(mIdx === mappingIdx && rangeIdx === rIdx) return
                    let [ from, to ] = range.split('-').map(n => parseInt(n))

                    const removeRange = () => {
                      wordRanges.splice(rIdx, 1)
                      if(wordRanges.length === 0) {
                        if(!isOriginal) {
                          updateExtraVerseMappings(mappedLoc, null)
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
                    } else if(locked && (from - newTo === 2 || newFrom - to === 2)) {
                      updateExtraVerseMappings(otherMapping.originalLoc)
                      updateRangePart({
                        ref: getRefFromLoc(otherLoc),
                        rangeIdx: rIdx,
                        partIdx: from - newTo === 2 ? 0 : 1,
                        mappedLoc,
                        changeAmt: from - newTo === 2 ? -1 : 1,
                      })
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
              translationText = getPartialText({ words: wordsByTranslationLoc[loc.split(':')[0]], ref: translationRef })

              if(showTranslation) {
                translationText = (
                  translationText
                    .split(' ')
                    .map(translationWord => (
                      googleTranslatedWords[translationWord]
                        ? [
                          translationWord.white,
                          `[${googleTranslatedWords[translationWord]}]`.magenta,
                        ].join('')
                        : translationWord.white
                    ))
                    .flat()
                    .join(' ')
                )
              } else {
                translationText = translationText.white
              }
      
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
              originalLocInfoStr,
              bookId <= 39 ? `׳`.black + originalText.white : originalText.white,
              translationLocInfoStr,
              translationText,
              `––––––––`.gray,
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
          (thisErrorMessage ? [ ``, thisErrorMessage.brightRed ] : []),
          (
            (unmarkedOriginalWords.length + unmarkedTranslationWords.length === 0)
              ? []
              : [
                ``,
                ...(
                  unmarkedOriginalWords.length > 0
                    ? [`Words marked as untranslated: `.cyan+unmarkedOriginalWords.join(` `)]
                    : []
                ),
                ...(
                  unmarkedTranslationWords.length > 0
                    ? [`Words marked as NOT translated from the original: `.magenta+unmarkedTranslationWords.join(` `)]
                    : []
                ),
                `*** In most all circumstances, you should fix this and match all words ***`.gray,
              ]
          ),
          ``,
          `Use `.gray+`TAB`.white+` to change the selection`.gray,
          `Use `.gray+`↑`.white+` and `.gray+`↓`.white+` to adjust a word number`.gray,
          `Use `.gray+`←`.white+` and `.gray+`→`.white+` to adjust a translation verse`.gray,
          `Use `.gray+`+`.white+` to add a mapping pair to this set`.gray,
          `Use `.gray+`,`.white+` to add another word range and `.gray+`DELETE`.white+` to remove one`.gray,
          // `Use `.gray+`ESC`.white+` to reset the pairs`.gray,
          ``,
          (locked ? `  LOCKED  `.bgYellow : ` UNLOCKED `.bgGray)+` Use `.gray+`SPACEBAR`.white+` to lock/unlock adjacent words`.gray,
          ...(versionInfo.languageId === 'eng' ? [] : [
            (showTranslation ? `  TRANSLATE ON  `.bgMagenta : `  TRANSLATE OFF `.bgGray)+` Use `.gray+`T`.white+` to turn English translation (from Google) on and off`.gray,
          ]),
          ``,
          `Press `.gray+`ENTER`.white+` when everything is paired correctly`.gray,
          ...(debugLog.map(line => `DEBUG: ${JSON.stringify(line)}`.red)),
        ].flat(2).join(`\n`)
      }
    }])

    console.log(showCursor)

    newVersionInfo.extraVerseMappings = getNormalizedExtraVerseMappings(newVersionInfo.extraVerseMappings)

    return (
      hasChange(newVersionInfo)
        ? newVersionInfo.extraVerseMappings
        : versionInfo.extraVerseMappings
    )

  } catch(err) {
    console.log(showCursor)
    throw err
  }

}

confirmAndCorrectMapping.equalObjsIgnoreKeyOrdering = equalObjsIgnoreKeyOrdering
module.exports = confirmAndCorrectMapping
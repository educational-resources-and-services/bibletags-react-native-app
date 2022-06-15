import React, { useState, useLayoutEffect, useCallback, useMemo } from "react"
import { StyleSheet, View, Text, ScrollView, Vibration, TouchableWithoutFeedback, I18nManager } from "react-native"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"
import Constants from "expo-constants"
import { getPiecesFromUSFM, getWordsHash, getWordHashes, splitVerseIntoWords, getPassageStr } from "@bibletags/bibletags-ui-helper"
import { i18n } from "inline-i18n"
import { getCorrespondingRefs, getLocFromRef } from "@bibletags/bibletags-versification"
import { Button } from "@ui-kitten/components"
import { useDimensions } from "@react-native-community/hooks"

import { getVersionInfo, memo, getOriginalVersionInfo, getToolbarHeight,
         executeSql, toggleArrayValue, cloneObj, readHeaderMarginTop,
         getWordIdAndPartNumber, equalObjs } from "../../utils/toolbox"
import useInstanceValue from "../../hooks/useInstanceValue"
import useThemedStyleSets from "../../hooks/useThemedStyleSets"
import useTagSet from "../../hooks/useTagSet"
import useTagAnotherVerse from "../../hooks/useTagAnotherVerse"

import Icon from "../basic/Icon"
import Verse from "../basic/Verse"
import TaggerVerse from "../basic/TaggerVerse"
import CoverAndSpin from "../basic/CoverAndSpin"
import ConfirmTagSubmissionButton from "../major/ConfirmTagSubmissionButton"

const {
  HEBREW_CANTILLATION_MODE,
} = Constants.manifest.extra

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    maxWidth: 600,
    alignSelf: 'center',
  },
  confirmButtonContainer: {
    paddingTop: 26,
    paddingBottom: 20,
  },
  extraButtonContainer: {
    marginTop: -10,
    paddingBottom: 20,
  },
  passageAndVersionContainer: {
  },
  passageAndVersion: {
    paddingTop: 5,
    paddingBottom: 18,
    marginHorizontal: -20,
    paddingHorizontal: 20,
    alignSelf: 'center',
  },
  passage: {
    textAlign: 'left',
    fontSize: 16,
    fontWeight: '700',
  },
  version: {
    textAlign: 'left',
    writingDirection: 'ltr',
    fontSize: 13,
  },
})

const displaySettingsOverride = {
  textSize: 1,
  lineSpacing: 1.7,
}

const tagSetsInProgress = {}

const VerseTaggerContent = ({
  passage,
  selectionMethod,
  instructionsCover,
  viewOnly=false,
  incrementExampleIndex,
  lowerPanelWordId,
  setSelectedData,
  style,

  eva: { style: themedStyle={} },

  myBibleVersions,
}) => {

  const { baseThemedStyle, altThemedStyleSets } = useThemedStyleSets(themedStyle)
  const [
    translationThemedStyle={},
    unselectedWordThemedStyle={},
    selectedWordThemedStyle={},
    confirmedIconThemedStyle={},
  ] = altThemedStyleSets

  const { ref, versionId } = passage
  const inProgressKey = JSON.stringify({ ref, versionId })
  const alignmentType = "without-suggestion"  // TODO (if I ever present existing tagSets to new taggers of that verse; other options: affirmation, correction)

  const { height: windowHeight } = useDimensions().window
  const paddingBottom = windowHeight - readHeaderMarginTop - getToolbarHeight() - 200

  const { tagNextOrAnotherVerse } = useTagAnotherVerse({ myBibleVersions, currentPassage: passage, selectionMethod })

  const [ pieces, setPieces ] = useState()
  const [ originalPieces, setOriginalPieces ] = useState()
  const [ { wordsHash, wordHashes }, setHashes ] = useState({})

  const { tagSet, myTagSet } = useTagSet({
    loc: getLocFromRef(ref),
    versionId,
    wordsHash,
    wordHashes,
    skip: !wordsHash,
  })

  const [ selectedWordIdAndPartNumbers, setSelectedWordIdAndPartNumbers ] = useState([])
  const [ translationWordInfoByWordIdAndPartNumbers, setTranslationWordInfoByWordIdAndPartNumbers ] = useState({})
  const clearTranslationWordInfoByWordIdAndPartNumbers = useCallback(() => setTranslationWordInfoByWordIdAndPartNumbers({}), [])
  const getSelectedWordIdAndPartNumbers = useInstanceValue(selectedWordIdAndPartNumbers)
  const getTranslationWordInfoByWordIdAndPartNumbers = useInstanceValue(translationWordInfoByWordIdAndPartNumbers)
  const getLowerPanelWordId = useInstanceValue(lowerPanelWordId)

  const usedWordNumbers = useMemo(
    () => (
      Object.values(translationWordInfoByWordIdAndPartNumbers)
        .flat()
        .map(({ wordNumberInVerse }) => wordNumberInVerse)
    ),
    [ translationWordInfoByWordIdAndPartNumbers ],
  )
  const getUsedWordNumbers = useInstanceValue(usedWordNumbers)

  const selectedWordNumbers = useMemo(
    () => (
      (translationWordInfoByWordIdAndPartNumbers[JSON.stringify(selectedWordIdAndPartNumbers)] || [])
        .map(({ wordNumberInVerse }) => wordNumberInVerse)
    ),
    [ translationWordInfoByWordIdAndPartNumbers, selectedWordIdAndPartNumbers ],
  )

  const { abbr, languageId } = getVersionInfo(versionId)

  const passageStr = useMemo(() => getPassageStr({ refs: [ passage.ref ] }), [ passage.ref ])
  const versionStr = `${I18nManager.isRTL ? `\u2067` : `\u2066`}${abbr}`

  const clearSelectedWordIdAndPartNumbers = useCallback(
    () => {
      setSelectedWordIdAndPartNumbers([])
      setSelectedData({})
    },
    [],
  )

  const onOriginalPress = useCallback(
    ({ selectedInfo }) => {

      const lowerPanelWordId = getLowerPanelWordId()
      const selectedWordIdAndPartNumbers = getSelectedWordIdAndPartNumbers()
      const newSelectedWordIdAndPartNumber = getWordIdAndPartNumber({ ...selectedInfo, bookId: ref.bookId })
      const translationWordInfoByWordIdAndPartNumbers = getTranslationWordInfoByWordIdAndPartNumbers()

      // if it is already selected, toggle open the lower panel
      if(selectedWordIdAndPartNumbers.includes(newSelectedWordIdAndPartNumber)) {
        if(selectedInfo[`x-id`] === lowerPanelWordId) {
          setSelectedData({})
        } else {
          setSelectedData({
            selectedSection: 'tagger',
            selectedInfo,
          })
        }
        return
      }

      setSelectedData({})

      // first try to select an existing group
      if(
        Object.keys(translationWordInfoByWordIdAndPartNumbers).some(wordIdAndPartNumbersJSON => {
          const wordIdAndPartNumbers = JSON.parse(wordIdAndPartNumbersJSON)
          if(wordIdAndPartNumbers.includes(newSelectedWordIdAndPartNumber)) {
            setSelectedWordIdAndPartNumbers(wordIdAndPartNumbers)
            return true
          }
        })
      ) return

      // otherwise select this single word
      setSelectedWordIdAndPartNumbers([ newSelectedWordIdAndPartNumber ])

    },
    [],
  )

  const onOriginalLongPress = useCallback(
    ({ selectedInfo: { id, wordPartNumber }}) => {

      if(viewOnly) return

      Vibration.vibrate(100)

      // update group selection
      const newSelectedWordIdAndPartNumber = getWordIdAndPartNumber({ id, wordPartNumber, bookId: ref.bookId })
      const newSelectedWordIdAndPartNumbers = [ ...getSelectedWordIdAndPartNumbers() ]
      toggleArrayValue(newSelectedWordIdAndPartNumbers, newSelectedWordIdAndPartNumber)
      newSelectedWordIdAndPartNumbers.sort()

      // unselect translation words connected to any of the words
      const newTranslationWordInfoByWordIdAndPartNumbers = cloneObj(getTranslationWordInfoByWordIdAndPartNumbers())
      for(let wordIdAndPartNumbersJSON in newTranslationWordInfoByWordIdAndPartNumbers) {
        const wordIdAndPartNumbers = JSON.parse(wordIdAndPartNumbersJSON)
        if(newSelectedWordIdAndPartNumbers.some(newSelectedWordIdAndPartNumber => wordIdAndPartNumbers.includes(newSelectedWordIdAndPartNumber))) {
          delete newTranslationWordInfoByWordIdAndPartNumbers[wordIdAndPartNumbersJSON]
        }
      }

      setSelectedWordIdAndPartNumbers(newSelectedWordIdAndPartNumbers)
      setTranslationWordInfoByWordIdAndPartNumbers(newTranslationWordInfoByWordIdAndPartNumbers)
      tagSetsInProgress[inProgressKey] = newTranslationWordInfoByWordIdAndPartNumbers

    },
    [ viewOnly ],
  )

  const onPress = useCallback(
    ({ selectedInfo: { text, wordNumberInVerse, hasUnknownCapitalization=false }}) => {

      setSelectedData({})

      if(viewOnly) return

      const selectedWordIdAndPartNumbers = getSelectedWordIdAndPartNumbers()
      if(selectedWordIdAndPartNumbers.length === 0) return

      const key = JSON.stringify(selectedWordIdAndPartNumbers)
      const newTranslationWordInfoByWordIdAndPartNumbers = cloneObj(getTranslationWordInfoByWordIdAndPartNumbers())
      newTranslationWordInfoByWordIdAndPartNumbers[key] = newTranslationWordInfoByWordIdAndPartNumbers[key] || []

      // see if this translation word is already connected to an orig word group
      const index = newTranslationWordInfoByWordIdAndPartNumbers[key].findIndex(wordInfo => wordInfo.wordNumberInVerse === wordNumberInVerse)
      if(index === -1) {

        // disconnect this translation word from other orig word groups
        for(let wordIdAndPartNumbers in newTranslationWordInfoByWordIdAndPartNumbers) {
          if(wordIdAndPartNumbers === key) continue
          newTranslationWordInfoByWordIdAndPartNumbers[wordIdAndPartNumbers] = newTranslationWordInfoByWordIdAndPartNumbers[wordIdAndPartNumbers].filter(wordInfo => wordInfo.wordNumberInVerse !== wordNumberInVerse)
          if(newTranslationWordInfoByWordIdAndPartNumbers[wordIdAndPartNumbers].length === 0) {
            delete newTranslationWordInfoByWordIdAndPartNumbers[wordIdAndPartNumbers]
          }
        }

        // add this translation word to the current orig word group
        newTranslationWordInfoByWordIdAndPartNumbers[key].push({
          wordNumberInVerse,
          word: text,
          hasUnknownCapitalization,
        })
        newTranslationWordInfoByWordIdAndPartNumbers[key].sort((a,b) => a.wordNumberInVerse > b.wordNumberInVerse ? 1 : -1)

      } else {
        // remove this translation word to the current orig word group
        newTranslationWordInfoByWordIdAndPartNumbers[key].splice(index, 1)
        if(newTranslationWordInfoByWordIdAndPartNumbers[key].length === 0) {
          delete newTranslationWordInfoByWordIdAndPartNumbers[key]
        }
      }

      setTranslationWordInfoByWordIdAndPartNumbers(newTranslationWordInfoByWordIdAndPartNumbers)
      tagSetsInProgress[inProgressKey] = newTranslationWordInfoByWordIdAndPartNumbers

    },
    [ viewOnly ],
  )

  const undoClear = useCallback(() => setTranslationWordInfoByWordIdAndPartNumbers(tagSetsInProgress[inProgressKey]), [ inProgressKey ])

  useLayoutEffect(
    () => {

      const version = getVersionInfo(versionId)
      const originalVersionInfo = getOriginalVersionInfo(ref.bookId)
      const originalRefs = getCorrespondingRefs({
        baseVersion: {
          info: version,
          ref,
        },
        lookupVersionInfo: originalVersionInfo,
      })

      const getPieces = async ({ versionId, refs, wordDividerRegex, set }) => {

        const { rows: { _array: [ verse ] } } = await executeSql({
          versionId,
          bookId: ref.bookId,
          statement: ({ bookId, limit }) => `SELECT * FROM ${versionId}VersesBook${bookId} WHERE loc IN ? ORDER BY loc LIMIT ${limit}`,
          args: [
            refs.map(ref => getLocFromRef(ref)),
          ],
          limit: 1,
          removeCantillation: HEBREW_CANTILLATION_MODE === 'remove',
        })
 
        const preppedUsfm = verse.usfm
          .replace(/\\m(?:t[0-9]?|te[0-9]?|s[0-9]?|r) .*\n?/g, '')  // get rid of book headings
          .replace(/\\c ([0-9]+)\n?/g, '')  // get rid of chapter marker, since it is put in below

        set(
          getPiecesFromUSFM({
            usfm: `\\c ${refs[0].chapter}\n${preppedUsfm}`,
            inlineMarkersOnly: true,
            wordDividerRegex,
            splitIntoWords: versionId !== 'original',
          })
        )

        if(versionId !== 'original') {
          setHashes({
            wordsHash: getWordsHash({ usfm: preppedUsfm, wordDividerRegex }),
            wordHashes: getWordHashes({ usfm: preppedUsfm, wordDividerRegex }),
          })
        }

      }

      getPieces({
        versionId: 'original',
        refs: originalRefs,
        wordDividerRegex: originalVersionInfo.wordDividerRegex,
        set: setOriginalPieces,
      })

      getPieces({
        versionId,
        refs: [ ref ],
        wordDividerRegex: version.wordDividerRegex,
        set: setPieces,
      })

    },
    [ JSON.stringify(ref), versionId ],
  )

  useLayoutEffect(
    () => {
      if(tagSetsInProgress[inProgressKey] && !viewOnly) {
        setTranslationWordInfoByWordIdAndPartNumbers(tagSetsInProgress[inProgressKey])

      } else if(
        tagSet
        && pieces
        && equalObjs(selectedWordIdAndPartNumbers, [])
        && (
          myTagSet
          || tagSet.status === 'automatch'
          || viewOnly
        )
      ) {

        const words = splitVerseIntoWords({ pieces }).map(({ text }) => text)
        const newTranslationWordInfoByWordIdAndPartNumbers = {}
        ;(viewOnly ? tagSet : (myTagSet || tagSet)).tags.forEach(tag => {
          if(tag.o.length > 0 && tag.t.length > 0) {
            newTranslationWordInfoByWordIdAndPartNumbers[JSON.stringify(tag.o)] = tag.t.map(wordNumberInVerse => {
              const word = words[wordNumberInVerse - 1]
              return {
                wordNumberInVerse,
                word,
                hasUnknownCapitalization: (
                  word.slice(0,1) !== word.slice(0,1).toLowerCase()  // first char is capitalized
                  && word.slice(1) === word.slice(1).toLowerCase()  // remaining chars are not capitalized
                ),
              }
            })
          }
        })
        setTranslationWordInfoByWordIdAndPartNumbers(newTranslationWordInfoByWordIdAndPartNumbers)
        tagSetsInProgress[inProgressKey] = newTranslationWordInfoByWordIdAndPartNumbers

      }
    },
    [ !!(tagSet && pieces) ],
  )

  const ready = !!(pieces && originalPieces && tagSet)
  const showUndo = Object.values(translationWordInfoByWordIdAndPartNumbers).length === 0 && Object.values(tagSetsInProgress).length !== 0

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.contentContainer,
        baseThemedStyle,
        style,
      ]}
    >

      {!ready && <CoverAndSpin />}

      {ready &&
        <TouchableWithoutFeedback
          onPress={clearSelectedWordIdAndPartNumbers}
        >
          <View style={{ paddingBottom }}>

            {viewOnly &&
              <Text style={styles.passageAndVersion}>
                <Text style={styles.passage}>
                  {passageStr}
                </Text>
                {`  `}
                <Text
                  style={[
                    styles.version,
                    baseThemedStyle,
                    style,
                  ]}
                >
                  {versionStr}
                </Text>
                {`  `}
                <Icon
                  style={[
                    styles.icon,
                    confirmedIconThemedStyle,
                  ]}
                  pack="materialCommunity"
                  name="check-all"
                />
              </Text>
            }

            <TaggerVerse
              bookId={ref.bookId}
              pieces={originalPieces}
              translationWordInfoByWordIdAndPartNumbers={translationWordInfoByWordIdAndPartNumbers}
              selectedWordIdAndPartNumbers={selectedWordIdAndPartNumbers}
              displaySettingsOverride={displaySettingsOverride}
              translationLanguageId={languageId}
              onPress={onOriginalPress}
              onLongPress={onOriginalLongPress}
            />

            <Verse
              passageRef={ref}
              versionId={versionId}
              pieces={pieces}
              usedWordNumbers={usedWordNumbers}
              selectedWordNumbers={selectedWordNumbers}
              displaySettingsOverride={displaySettingsOverride}
              style={translationThemedStyle}
              onVerseTap={onPress}
              hideSuperscripts={true}
              selectedWordStyle={selectedWordThemedStyle}
              unselectedWordStyle={unselectedWordThemedStyle}
              wrapWordsInNbsp={true}
            />

            {viewOnly && !!incrementExampleIndex &&
              <View style={styles.confirmButtonContainer}>
                <View>
                  <Button
                    onPress={incrementExampleIndex}
                  >
                    {i18n("View another example")}
                  </Button>
                </View>
              </View>
            }

            {!viewOnly &&
              <>

                <View style={styles.confirmButtonContainer}>
                  <ConfirmTagSubmissionButton
                    alignmentType={alignmentType}
                    getUsedWordNumbers={getUsedWordNumbers}
                    getTranslationWordInfoByWordIdAndPartNumbers={getTranslationWordInfoByWordIdAndPartNumbers}
                    originalPieces={originalPieces}
                    pieces={pieces}
                    passage={passage}
                    wordsHash={wordsHash}
                    tagNextOrAnotherVerse={tagNextOrAnotherVerse}
                    selectionMethod={selectionMethod}
                  />
                </View>

                <View style={styles.extraButtonContainer}>

                  {!!tagNextOrAnotherVerse &&
                    <View>
                      <Button
                        onPress={tagNextOrAnotherVerse}
                        appearance='ghost'
                      >
                        {selectionMethod === `next-verse` ? i18n("Skip and tag the next verse") : i18n("Skip and tag another verse")}
                      </Button>
                    </View>
                  }

                  <Button
                    onPress={showUndo ? undoClear : clearTranslationWordInfoByWordIdAndPartNumbers}
                    appearance='ghost'
                    status='basic'
                  >
                    {showUndo ? i18n("Undo clear") : i18n("Clear tags")}
                  </Button>

                </View>

              </>
            }

          </View>
        </TouchableWithoutFeedback>

      }

      {ready && instructionsCover}

    </ScrollView>
  )

}

const mapStateToProps = ({ myBibleVersions }) => ({
  myBibleVersions,
})

const matchDispatchToProps = dispatch => bindActionCreators({
}, dispatch)

export default memo(connect(mapStateToProps, matchDispatchToProps)(VerseTaggerContent), { name: 'VerseTaggerContent' })
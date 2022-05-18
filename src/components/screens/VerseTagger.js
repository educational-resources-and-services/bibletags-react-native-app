import React, { useState, useLayoutEffect, useCallback, useMemo } from "react"
import { StyleSheet, View, ScrollView, Vibration } from "react-native"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"
import Constants from "expo-constants"
import { getPassageStr, getPiecesFromUSFM, getWordsHash, getWordHashes } from "@bibletags/bibletags-ui-helper"
import { i18n } from "inline-i18n"
import { getCorrespondingRefs, getLocFromRef } from "@bibletags/bibletags-versification"
import { Button } from "@ui-kitten/components"

import { getVersionInfo, memo, getOriginalVersionInfo, executeSql, toggleArrayValue, cloneObj, getWordIdAndPartNumber, equalObjs } from "../../utils/toolbox"
import useRouterState from "../../hooks/useRouterState"
import useInstanceValue from "../../hooks/useInstanceValue"
import useThemedStyleSets from "../../hooks/useThemedStyleSets"
import useTagSet from "../../hooks/useTagSet"
import useTaggingInstructions from "../../hooks/useTaggingInstructions"
import useTagAnotherVerse from "../../hooks/useTagAnotherVerse"

import SafeLayout from "../basic/SafeLayout"
import Verse from "../basic/Verse"
import TaggerVerse from "../basic/TaggerVerse"
import BasicHeader from "../major/BasicHeader"
import CoverAndSpin from "../basic/CoverAndSpin"
import ConfirmTagSubmissionButton from "../major/ConfirmTagSubmissionButton"
import HeaderIconButton from "../basic/HeaderIconButton"

const {
  HEBREW_CANTILLATION_MODE,
} = Constants.manifest.extra

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    minHeight: 400,
  },
  confirmButtonContainer: {
    paddingTop: 26,
    paddingBottom: 20,
  },
  skipButtonContainer: {
    marginTop: -10,
    paddingBottom: 20,
  },
})

const displaySettingsOverride = {
  textSize: 1,
  lineSpacing: 1.5,
}

const tagSetsInProgress = {}

const VerseTagger = ({
  style,

  eva: { style: themedStyle={} },

  myBibleVersions,
}) => {

  const { baseThemedStyle, altThemedStyleSets } = useThemedStyleSets(themedStyle)
  const [
    translationThemedStyle={},
  ] = altThemedStyleSets

  const { routerState } = useRouterState()
  const { passage } = routerState
  const { ref, versionId } = passage
  const inProgressKey = JSON.stringify({ ref, versionId })
  const alignmentType = "without-suggestion"  // TODO (if I ever present existing tagSets to new taggers of that verse; other options: affirmation, correction)

  const { tagAnotherVerse } = useTagAnotherVerse({ myBibleVersions, currentPassage: passage })

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

  const { instructionsCover, openInstructions } = useTaggingInstructions()

  const [ selectedWordIdAndPartNumbers, setSelectedWordIdAndPartNumbers ] = useState([])
  const [ translationWordInfoByWordIdAndPartNumbers, setTranslationWordInfoByWordIdAndPartNumbers ] = useState({})
  const getSelectedWordIdAndPartNumbers = useInstanceValue(selectedWordIdAndPartNumbers)
  const getTranslationWordInfoByWordIdAndPartNumbers = useInstanceValue(translationWordInfoByWordIdAndPartNumbers)

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

  const onOriginalPress = useCallback(
    ({ selectedInfo: { id, wordPartNumber }}) => {

      const newSelectedWordIdAndPartNumber = getWordIdAndPartNumber({ id, wordPartNumber, bookId: ref.bookId })
      const translationWordInfoByWordIdAndPartNumbers = getTranslationWordInfoByWordIdAndPartNumbers()

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
    [],
  )

  const onPress = useCallback(
    ({ selectedInfo: { text, wordNumberInVerse, hasUnknownCapitalization=false }}) => {

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
    [],
  )

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
            splitIntoWords: true,
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
      if(tagSetsInProgress[inProgressKey]) {
        setTranslationWordInfoByWordIdAndPartNumbers(tagSetsInProgress[inProgressKey])

      } else if(
        tagSet
        && pieces
        && equalObjs(selectedWordIdAndPartNumbers, [])
        && (
          myTagSet
          || tagSet.status === 'automatch'
        )
      ) {

        const wordByWordNumberInVerse = {}
        pieces
          .map(({ children }) => children)
          .filter(Boolean)
          .flat()
          .forEach(({ wordNumberInVerse, text }) => {
            if(wordNumberInVerse) {
              wordByWordNumberInVerse[wordNumberInVerse] = text
            }
          })

        const newTranslationWordInfoByWordIdAndPartNumbers = {}
        ;(myTagSet || tagSet).tags.forEach(tag => {
          newTranslationWordInfoByWordIdAndPartNumbers[JSON.stringify(tag.o)] = tag.t.map(wordNumberInVerse => ({
            wordNumberInVerse,
            word: wordByWordNumberInVerse[wordNumberInVerse],
            hasUnknownCapitalization: false,
          }))
        })
        setTranslationWordInfoByWordIdAndPartNumbers(newTranslationWordInfoByWordIdAndPartNumbers)
        tagSetsInProgress[inProgressKey] = newTranslationWordInfoByWordIdAndPartNumbers

      }
    },
    [ !!(tagSet && pieces) ],
  )

  const extraButtons = useMemo(
    () => [
      <HeaderIconButton
        key="help"
        name="md-information-circle-outline"
        onPress={openInstructions}
        uiStatus="unselected"
      />,
    ],
    [ openInstructions ],
  )

  const ready = !!(pieces && originalPieces && tagSet)

  return (
    <SafeLayout>

      <BasicHeader
        title={i18n("Tag the {{version_abbr}} of {{passage}}", {
          version_abbr: abbr,
          passage: getPassageStr({
            refs: [ ref ],
          })
        })}
        extraButtons={extraButtons}
      />

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
          <>

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
            />

            <View style={styles.confirmButtonContainer}>
              <ConfirmTagSubmissionButton
                alignmentType={alignmentType}
                getUsedWordNumbers={getUsedWordNumbers}
                getTranslationWordInfoByWordIdAndPartNumbers={getTranslationWordInfoByWordIdAndPartNumbers}
                originalPieces={originalPieces}
                pieces={pieces}
                passage={passage}
                wordsHash={wordsHash}
                tagAnotherVerse={tagAnotherVerse}
              />
            </View>

            {!!tagAnotherVerse &&
              <View style={styles.skipButtonContainer}>
                <Button
                  onPress={tagAnotherVerse}
                  appearance='ghost'
                >
                  {i18n("Skip and tag a different verse")}
                </Button>
              </View>
            }

            {instructionsCover}

          </>
        }

      </ScrollView>

    </SafeLayout>
  )

}

const mapStateToProps = ({ myBibleVersions }) => ({
  myBibleVersions,
})

const matchDispatchToProps = dispatch => bindActionCreators({
}, dispatch)

export default memo(connect(mapStateToProps, matchDispatchToProps)(VerseTagger), { name: 'VerseTagger' })
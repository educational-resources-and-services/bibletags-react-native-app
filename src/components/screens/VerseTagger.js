import React, { useState, useEffect, useCallback, useMemo } from "react"
import { StyleSheet, View, ScrollView } from "react-native"
import Constants from "expo-constants"
import { getPassageStr, getPiecesFromUSFM } from "@bibletags/bibletags-ui-helper"
import { i18n } from "inline-i18n"
import { getCorrespondingRefs, getLocFromRef } from "@bibletags/bibletags-versification"

import { getVersionInfo, memo, getOriginalVersionInfo, executeSql, toggleArrayValue, cloneObj, getWordIdAndPartNumber } from "../../utils/toolbox"
import useRouterState from "../../hooks/useRouterState"
import useInstanceValue from "../../hooks/useInstanceValue"
import useThemedStyleSets from "../../hooks/useThemedStyleSets"

import SafeLayout from "../basic/SafeLayout"
import Verse from "../basic/Verse"
import TaggerVerse from "../basic/TaggerVerse"
import BasicHeader from "../major/BasicHeader"
import CoverAndSpin from "../basic/CoverAndSpin"
import ConfirmTagSubmissionButton from "../major/ConfirmTagSubmissionButton"

const {
  HEBREW_CANTILLATION_MODE,
} = Constants.manifest.extra

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flex: 1,
  },
  buttonContainer: {
    paddingTop: 26,
    paddingBottom: 20,
  },
})

const displaySettingsOverride = {
  textSize: 1,
  lineSpacing: 1.3,
}

const VerseTagger = ({
  style,

  eva: { style: themedStyle={} },
}) => {

  const { baseThemedStyle, altThemedStyleSets } = useThemedStyleSets(themedStyle)
  const [
    translationThemedStyle={},
  ] = altThemedStyleSets

  const { routerState } = useRouterState()
  const { passage } = routerState
  const { ref, versionId } = passage
  const alignmentType = "without-suggestion"  // TODO

  const [ pieces, setPieces ] = useState()
  const [ originalPieces, setOriginalPieces ] = useState()

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

    },
    [],
  )

  useEffect(
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

  return (
    <SafeLayout>

      <BasicHeader
        title={i18n("Tag the {{version_abbr}} of {{passage}}", {
          version_abbr: abbr,
          passage: getPassageStr({
            refs: [ ref ],
          })
        })}
      />

      <ScrollView
        contentContainerStyle={[
          styles.container,
          baseThemedStyle,
          style,
        ]}
      >

        {!(pieces && originalPieces) && <CoverAndSpin />}

        {!!(pieces && originalPieces) &&
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

            <View style={styles.buttonContainer}>
              <ConfirmTagSubmissionButton
                alignmentType={alignmentType}
                getUsedWordNumbers={getUsedWordNumbers}
                getTranslationWordInfoByWordIdAndPartNumbers={getTranslationWordInfoByWordIdAndPartNumbers}
                originalPieces={originalPieces}
                pieces={pieces}
                bookId={ref.bookId}
              />
            </View>

          </>
        }

      </ScrollView>

    </SafeLayout>
  )

}

export default memo(VerseTagger, { name: 'VerseTagger' })

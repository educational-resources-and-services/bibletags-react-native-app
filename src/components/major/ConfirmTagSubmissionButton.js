import React, { useCallback, useState, useMemo } from "react"
import { StyleSheet, View, Text, Alert, TouchableOpacity } from "react-native"
import { Button, Divider } from "@ui-kitten/components"
import { i18n } from "inline-i18n"
import { getLocFromRef } from "@bibletags/bibletags-versification"
import { containsHebrewChars, containsGreekChars, splitVerseIntoWords } from "@bibletags/bibletags-ui-helper"
import Constants from "expo-constants"

import { memo, getWordIdAndPartNumber, cloneObj, getDeviceId } from '../../utils/toolbox'
import useRouterState from "../../hooks/useRouterState"
import useThemedStyleSets from "../../hooks/useThemedStyleSets"
import { recordAndSubmitTagSet } from "../../utils/submitTagSet"

import Icon from "../basic/Icon"
import Dialog from "./Dialog"

const {
  EMBEDDING_APP_ID,
} = Constants.manifest.extra

const styles = StyleSheet.create({
  firstLine: {
  },
  mainLine: {
    marginVertical: 15,
  },
  question: {
    fontStyle: 'italic',
  },
  info: {
    height: 16,
  },
  extraBlock: {
    marginBottom: 15,
    borderLeftWidth: 1,
    borderColor: 'rgba(0, 0, 0, .15)',
    marginLeft: 5,
    paddingLeft: 10,
  },
  line: {
    marginTop: 15,
  },
  bold: {
    fontWeight: '700',
  },
  untaggedWords: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 15,
    marginBottom: -6,
    marginHorizontal: -3,
  },
  untaggedWord: {
    marginHorizontal: 3,
    marginBottom: 6,
    paddingHorizontal: 5,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, .15)',
    borderRadius: 3,
  },
  capitalizationOptions: {
  },
  capitalizationOptionSet: {
    flexDirection: "row",
    marginHorizontal: -3,
    marginVertical: 5,
  },
  capitalizationOption: {
    marginHorizontal: 3,
  },
  divider: {
  },
  greek: {
    fontFamily: `original-grk`,
  },
  hebrew: {
    fontFamily: `original-heb`,
  },
})

let initialShowExtraNonTaggedWordsInfo = true  // will force show once every session
let initialShowExtraCapitalizationInfo = true  // will force show once every session

const ConfirmTagSubmissionButton = ({
  alignmentType,
  getUsedWordNumbers,
  getTranslationWordInfoByWordIdAndPartNumbers,
  originalPieces,
  pieces,
  passage,
  wordsHash,
  tagAnotherVerse,

  eva: { style: themedStyle={} },
}) => {

  const { altThemedStyleSets } = useThemedStyleSets(themedStyle)
  const [
    untaggedWordThemedStyle={},
  ] = altThemedStyleSets

  const { historyGoBack, historyPush } = useRouterState()

  const [ showExtraNonTaggedWordsInfo, setShowExtraNonTaggedWordsInfo ] = useState(initialShowExtraNonTaggedWordsInfo)
  const toggleShowExtraNonTaggedWordsInfo = useCallback(
    () => {
      setShowExtraNonTaggedWordsInfo(!showExtraNonTaggedWordsInfo)
      initialShowExtraNonTaggedWordsInfo = !showExtraNonTaggedWordsInfo
    },
    [ showExtraNonTaggedWordsInfo ],
  )
  const [ showExtraCapitalizationInfo, setShowExtraCapitalizationInfo ] = useState(initialShowExtraCapitalizationInfo)
  const toggleShowExtraCapitalizationInfo = useCallback(
    () => {
      setShowExtraCapitalizationInfo(!showExtraCapitalizationInfo)
      initialShowExtraCapitalizationInfo = !showExtraCapitalizationInfo
    },
    [ showExtraCapitalizationInfo ],
  )
  const [ submitting, setSubmitting ] = useState(false)
  const [ dialogInfo, setDialogInfo ] = useState({ visible: false })
  const {
    untaggedWords=[],
    tagSetSubmission=[],
    wordCapitalizationOptionsByWordNumber={}
  } = dialogInfo.vars || {}

  const { bookId } = passage.ref

  const tagSetSubmissionWithCapitalizationChoices = useMemo(
    () => {
      const tagSetSubmissionWithCapitalizationChoices = cloneObj(tagSetSubmission)
      tagSetSubmissionWithCapitalizationChoices.forEach(({ translationWordsInfo=[] }) => {
        translationWordsInfo.forEach(translationWordInfo => {
          const wordCapitalizationOptions = wordCapitalizationOptionsByWordNumber[translationWordInfo.wordNumberInVerse]
          if(wordCapitalizationOptions) {
            translationWordInfo.word = wordCapitalizationOptions.choice 
          }
        })
      })
      return tagSetSubmissionWithCapitalizationChoices
    },
    [ tagSetSubmission, wordCapitalizationOptionsByWordNumber ],
  )

  const goSubmitTags = useCallback(
    () => {

      // get untagged orig words
      const translationWordInfoByWordIdAndPartNumbers = getTranslationWordInfoByWordIdAndPartNumbers()
      const taggedWordIdAndPartNumbers = (
        Object.keys(translationWordInfoByWordIdAndPartNumbers)
          .map(wordIdAndPartNumbersJSON => JSON.parse(wordIdAndPartNumbersJSON))
          .flat()
      )
      const untaggedWordIdAndPartNumbers = []
      const untaggedOrigWords = []
      let numOrigWords = 0
      originalPieces.filter(word => word[`x-id`]).forEach(word => {
        ;(word.children || [ word ]).forEach((wordPiece, idx) => {
          numOrigWords++
          const wordIdAndPartNumber = getWordIdAndPartNumber({ id: word[`x-id`], wordPartNumber: idx+1, bookId })
          if(!taggedWordIdAndPartNumbers.includes(wordIdAndPartNumber)) {
            untaggedOrigWords.push(wordPiece.text)
            untaggedWordIdAndPartNumbers.push(JSON.stringify([ wordIdAndPartNumber ]))
          }
        })
      })

      // get untagged translation words
      const usedWordNumbers = getUsedWordNumbers()
      const untaggedTranslationWords = []

      const translationWords = splitVerseIntoWords({ pieces })
      translationWords.forEach(({ text, wordNumberInVerse }) => {
        if(!usedWordNumbers.includes(wordNumberInVerse)) {
          untaggedTranslationWords.push({
            word: text,
            wordNumberInVerse,
          })
        }
      })

      // check that an average of at least 50% of words are tagged between the original and translation
      if(
        (((untaggedOrigWords.length / numOrigWords) + (untaggedTranslationWords.length / translationWords.length)) / 2) > (1 - .5)
      ) {
        setDialogInfo({
          visible: true,
          title: i18n("Finish Tagging"),
          message: [
            i18n("You must tag the entire verse before submitting."),
          ],
          buttons: [{}],
          children: null,
        })
        return
      }

      // form the submission
      const wordCapitalizationOptionsByWordNumber = {}
      const tagSetSubmission = [
        ...[ ...Object.keys(translationWordInfoByWordIdAndPartNumbers), ...untaggedWordIdAndPartNumbers ].map(wordIdAndPartNumbersJSON => ({
          origWordsInfo: JSON.parse(wordIdAndPartNumbersJSON).map(wordIdAndPartNumber => {
            let [ wordId, wordPartNumber ] = wordIdAndPartNumber.split('|')
            wordPartNumber = parseInt(wordPartNumber, 10)
            return {
              [`${bookId <= 39 ? `uhb` : `ugnt`}WordId`]: wordId,
              ...(wordPartNumber ? { wordPartNumber } : {}),
            }
          }),
          translationWordsInfo: (translationWordInfoByWordIdAndPartNumbers[wordIdAndPartNumbersJSON] || []).map(({ wordNumberInVerse, word, hasUnknownCapitalization }) => {
            if(hasUnknownCapitalization) {
              wordCapitalizationOptionsByWordNumber[wordNumberInVerse] = {
                options: [ word, word.toLowerCase() ],
              }
            }
            return {
              wordNumberInVerse,
              ...(!hasUnknownCapitalization ? { word } : {}),
            }
          }),
          alignmentType,
        })),
        ...untaggedTranslationWords.map(wordInfo => ({
          origWordsInfo: [],
          translationWordsInfo: [ wordInfo ],
          alignmentType,
        }))
      ]

      // confirm
      setDialogInfo({
        visible: true,
        vars: {
          untaggedWords: [ ...untaggedOrigWords, ...untaggedTranslationWords.map(({ word }) => word) ],
          tagSetSubmission,
          wordCapitalizationOptionsByWordNumber,
        },
      })

    },
    [ getUsedWordNumbers, getTranslationWordInfoByWordIdAndPartNumbers, alignmentType, originalPieces, pieces, bookId ],
  )

  const goHideDialog = useCallback(
    () => {
      setDialogInfo({
        ...dialogInfo,
        visible: false,
      })
    },
    [ dialogInfo ],
  )

  const goConfirmSubmitTags = useCallback(
    async () => {

      setSubmitting(true)

      const { success, error } = await recordAndSubmitTagSet({
        input: {
          loc: getLocFromRef(passage.ref),
          versionId: passage.versionId,
          wordsHash,
          deviceId: getDeviceId(),
          embeddingAppId: EMBEDDING_APP_ID,
          tagSubmissions: tagSetSubmissionWithCapitalizationChoices,
        },
        historyPush,
      })

      setSubmitting(false)

      if(error) {
        historyPush("/ErrorMessage", {
          message: error,
        })

      } else {
        initialShowExtraNonTaggedWordsInfo = initialShowExtraCapitalizationInfo = false
        Alert.alert(
          i18n("Thanks!"),
          (
            success
              ? i18n("Tags submitted successfully.")
              : i18n("Tags will be submitted next time you are online.")
          ),
          [
            {
              text: i18n("Back to reading"),
              onPress: () => {
                historyGoBack()  // TODO: needs to scroll
              },
            },
            {
              text: i18n("Retag this verse"),
              onPress: goHideDialog,
            },
            ...(!tagAnotherVerse ? [] : [{
              text: i18n("Tag another verse"),
              onPress: tagAnotherVerse,
              style: 'cancel',
            }]),
          ]
        )
      }

    },
    [ tagSetSubmissionWithCapitalizationChoices, passage, wordsHash, dialogInfo ],
  )

  return (
    <>

      <Button
        onPress={goSubmitTags}
      >
        {i18n("Submit tags")}
      </Button>

      <Dialog
        title={i18n("Confirm Tag Submission")}
        children={(
          <>

            {/* ask about untagged words */}
            {untaggedWords.length > 0 &&
              <>

                <Text style={styles.firstLine}>
                  {i18n("The following words have NOT been tagged:")}
                </Text>

                <View style={styles.untaggedWords}>
                  {untaggedWords.map((word, idx) => (
                    <Text
                      key={idx}
                      style={[
                        styles.untaggedWord,
                        untaggedWordThemedStyle,
                        (containsHebrewChars(word) ? styles.hebrew : null),
                        (containsGreekChars(word) ? styles.greek : null),
                      ]}
                    >
                      {word}
                    </Text>
                  ))}
                </View>

                <TouchableOpacity
                  onPress={toggleShowExtraNonTaggedWordsInfo}
                >
                  <Text style={styles.mainLine}>
                    <Text style={styles.question}>
                      {i18n("Does that look right?")}
                    </Text>
                    {`   `}
                    <Icon
                      name={showExtraNonTaggedWordsInfo ? `md-information-circle` : `md-information-circle-outline`}
                      style={styles.info}
                    />
                  </Text>
                </TouchableOpacity>

                {showExtraNonTaggedWordsInfo &&
                  <View style={styles.extraBlock}>
                    <Text style={styles.firstLine}>
                      {i18n("You should only leave words untagged when an original word is left untranslated, or a translation word is supplied without an original word counterpart. Please double-check this is the case before confirming.")}
                    </Text>
                    <Text style={[ styles.line, styles.bold ]}>
                      {i18n("If words have been left untagged simply because you do not know the proper tagging, please do NOT submit this tag set.")}
                    </Text>
                  </View>
                }


              </>
            }

            {untaggedWords.length > 0 && Object.values(wordCapitalizationOptionsByWordNumber).length > 0 && <Divider style={styles.divider} />}

            {/* ask about any with hasUnknownCapitalization */}
            {Object.values(wordCapitalizationOptionsByWordNumber).length > 0 &&
              <>
                  <TouchableOpacity
                    onPress={toggleShowExtraCapitalizationInfo}
                  >
                  <Text style={styles.mainLine}>
                    <Text>
                      {i18n("Indicate how each of these words would appear in a dictionary entry—capitalized or not.")}
                    </Text>
                    {`   `}
                    <Icon
                      name={showExtraCapitalizationInfo ? `md-information-circle` : `md-information-circle-outline`}
                      style={styles.info}
                    />
                  </Text>
                </TouchableOpacity>

                {showExtraCapitalizationInfo &&
                  <View style={styles.extraBlock}>
                    <Text style={styles.firstLine}>
                      {i18n("Eg. “I” and “Paul” should be capitalized whereas “then” and “so” should not.")}
                    </Text>
                  </View>
                }

                <View style={styles.capitalizationOptions}>
                  {Object.keys(wordCapitalizationOptionsByWordNumber).map(wordNumberInVerse => {
                    const { options, choice } = wordCapitalizationOptionsByWordNumber[wordNumberInVerse]
                    const [ uWord, lWord ] = options
                    const setChoice = choice => {
                      const newDialogInfo = cloneObj(dialogInfo)
                      newDialogInfo.vars.wordCapitalizationOptionsByWordNumber[wordNumberInVerse] = {
                        options,
                        choice,
                      }
                      setDialogInfo(newDialogInfo)
                    }
                    return (
                      <View
                        key={wordNumberInVerse}
                        style={styles.capitalizationOptionSet}
                      >
                        <Button
                          style={styles.capitalizationOption}
                          size="tiny"
                          status={uWord === choice ? "success" : "basic"}
                          onPress={() => setChoice(uWord)}
                        >
                          {uWord}
                        </Button>
                        <Button
                          style={styles.capitalizationOption}
                          size="tiny"
                          status={lWord === choice ? "success" : "basic"}
                          onPress={() => setChoice(lWord)}
                        >
                          {lWord}
                        </Button>
                      </View>
                    )
                  })}
                </View>
              </>
            }

            {untaggedWords.length === 0 && Object.values(wordCapitalizationOptionsByWordNumber).length === 0 &&
              <Text style={styles.areYouSure}>
                {i18n("Are you sure?")}
              </Text>
            }

          </>
        )}
        buttons={[
          {
            onPress: goHideDialog,
            label: i18n("Go back"),
            status: "basic",
          },
          {
            disabled: tagSetSubmissionWithCapitalizationChoices.some(({ translationWordsInfo=[] }) => translationWordsInfo.some(({ word }) => !word)),
            onPress: goConfirmSubmitTags,
            label: i18n("Confirm"),
          },
        ]}
        goHide={goHideDialog}
        submitting={submitting}
        {...dialogInfo}
      />

    </>
  )

}

export default memo(ConfirmTagSubmissionButton, { name: 'ConfirmTagSubmissionButton' })

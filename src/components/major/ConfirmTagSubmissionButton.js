import React, { useCallback, useState, useMemo } from "react"
import { StyleSheet, View, Text } from "react-native"
import { Button, Divider } from "@ui-kitten/components"
import { i18n } from "inline-i18n"

import { memo, getWordIdAndPartNumber, cloneObj } from '../../utils/toolbox'

import Dialog from "./Dialog"


const styles = StyleSheet.create({
  firstLine: {
    marginTop: 5,
  },
  line: {
    marginTop: 15,
  },
  boldLine: {
    fontWeight: '600',
    marginTop: 15,
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
    marginTop: 15,
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
    marginVertical: 15,
  },
})

const ConfirmTagSubmissionButton = ({
  alignmentType,
  getUsedWordNumbers,
  getTranslationWordInfoByWordIdAndPartNumbers,
  originalPieces,
  pieces,
  bookId,
}) => {

  const [ dialogInfo, setDialogInfo ] = useState({ visible: false })
  const {
    untaggedWords=[],
    tagSetSubmission=[],
    wordCapitalizationOptionsByWordNumber={}
  } = dialogInfo.vars || {}

  const tagSetSubmissionWithCapitalizationChoices = useMemo(
    () => {
      const tagSetSubmissionWithCapitalizationChoices = cloneObj(tagSetSubmission)
      tagSetSubmissionWithCapitalizationChoices.forEach(({ translationWordsInfo }) => {
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
      const untaggedOrigWords = []
      let numOrigWords = 0
      originalPieces.filter(word => word[`x-id`]).forEach(word => {
        ;(word.children || [ word ]).forEach((wordPiece, idx) => {
          numOrigWords++
          const wordIdAndPartNumber = getWordIdAndPartNumber({ id: word[`x-id`], wordPartNumber: idx+1, bookId })
          if(!taggedWordIdAndPartNumbers.includes(wordIdAndPartNumber)) {
            untaggedOrigWords.push(wordPiece.text)
          }
        })
      })

      // get untagged translation words
      const usedWordNumbers = getUsedWordNumbers()
      const untaggedTranslationWords = []
      pieces.filter(({ children }) => children).forEach(({ children }) => {
        children.filter(({ type }) => type === 'word').forEach(({ text, wordNumberInVerse }) => {
          if(!usedWordNumbers.includes(wordNumberInVerse)) {
            untaggedTranslationWords.push(text)
          }
        })
      })

      // check that at least 70% of orig words are tagged
      if(untaggedOrigWords.length / numOrigWords > .4) {
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
      const tagSetSubmission = Object.keys(translationWordInfoByWordIdAndPartNumbers).map(wordIdAndPartNumbersJSON => ({
        origWordsInfo: JSON.parse(wordIdAndPartNumbersJSON).map(wordIdAndPartNumber => {
          const [ uhbWordId, wordPartNumber ] = wordIdAndPartNumber.split('|')
          return {
            uhbWordId,
            ...(wordPartNumber ? { wordPartNumber } : {}),
          }
        }),
        translationWordsInfo: translationWordInfoByWordIdAndPartNumbers[wordIdAndPartNumbersJSON].map(({ wordNumberInVerse, word, hasUnknownCapitalization }) => {
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
      }))

      // confirm
      setDialogInfo({
        visible: true,
        vars: {
          untaggedWords: [ ...untaggedOrigWords, ...untaggedTranslationWords ],
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
    () => {
      // do the submit online, unless offline in which I need to queue it up
      // keep track of my submissions? Perhaps only when in the queue with the queue essentially editable
      // (don't ask the person to confirm if they are the only submitter as it will not confirm!)

      // go back

    },
    [],
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
                    <Text key={idx} style={styles.untaggedWord}>
                      {word}
                    </Text>
                  ))}
                </View>

                <Text style={styles.line}>
                  {i18n("You should only leave words untagged when an original word is left untranslated, or a translation word is supplied without an original word counterpart. Please double-check this is the case before confirming.")}
                </Text>
                <Text style={styles.boldLine}>
                  {i18n("If words have been left untagged simply because you do not know the proper tagging, please do NOT submit this tag set.")}
                </Text>

              </>
            }

            {untaggedWords.length > 0 && Object.values(wordCapitalizationOptionsByWordNumber).length > 0 && <Divider style={styles.divider} />}

            {/* ask about any with hasUnknownCapitalization */}
            {Object.values(wordCapitalizationOptionsByWordNumber).length > 0 &&
              <>
                <Text style={styles.capitalizationInstructions}>
                  {i18n("Choose the proper capitalization for the following translation word(s) when they do NOT begin a sentence or clause:")}
                </Text>
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

          </>
        )}
        buttons={[
          {
            disabled: tagSetSubmissionWithCapitalizationChoices.some(({ translationWordsInfo }) => translationWordsInfo.some(({ word }) => !word)),
            onPress: goConfirmSubmitTags,
          },
        ]}
        goHide={goHideDialog}
        {...dialogInfo}
      />

    </>
  )

}

export default memo(ConfirmTagSubmissionButton, { name: 'ConfirmTagSubmissionButton' })

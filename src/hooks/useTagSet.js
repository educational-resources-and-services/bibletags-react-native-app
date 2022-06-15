import { useState } from "react"
import Constants from "expo-constants"

import { safelyExecuteSelects } from "../utils/toolbox"
import useEffectAsync from "./useEffectAsync"
import { recordAndSubmitWordHashesSet } from "../utils/submitWordHashesSet"

const {
  EMBEDDING_APP_ID,
} = Constants.manifest.extra

const useTagSet = ({
  loc,
  versionId,
  wordsHash,
  wordHashes,
  skip,
}) => {

  const [ tagSetInfo, setTagSetInfo ] = useState({})

  useEffectAsync(
    async () => {
      setTagSetInfo({})

      if(skip) return

      const tagSetSelectObj = {
        database: `versions/${versionId}/tagSets`,
        statement: () => `SELECT * FROM tagSets WHERE id=?`,
        args: [
          `${loc}-${versionId}-${wordsHash}`,
        ],
        jsonKeys: [ 'tags' ],
      }

      let [ [ tagSet ], [ submittedTagSet ] ] = await safelyExecuteSelects([
        tagSetSelectObj,
        {
          database: `submittedTagSets`,
          statement: () => `SELECT * FROM submittedTagSets WHERE id=?`,
          args: [
            `${loc}-${versionId}-${wordsHash}`,
          ],
          jsonKeys: [ 'input' ],
        },
      ])

      if(!tagSet && !submittedTagSet && wordHashes) {

        // might need wordHashesSet (though probably not)
        await recordAndSubmitWordHashesSet({
          input: {
            loc,
            versionId,
            wordsHash,
            embeddingAppId: EMBEDDING_APP_ID,
            wordHashes,
          },
        })

        tagSet = (await safelyExecuteSelects([ tagSetSelectObj ]))[0][0]

      }

      let myTagSet

      if(submittedTagSet) {

        myTagSet = {
          id: `${loc}-${versionId}-${wordsHash}`,
          tags: submittedTagSet.input.tagSubmissions.map(({ origWordsInfo, translationWordsInfo }) => ({
            o: origWordsInfo.map(({ uhbWordId, wordPartNumber, ugntWordId }) => ugntWordId || `${uhbWordId}|${wordPartNumber}`),
            t: translationWordsInfo.map(({ wordNumberInVerse }) => wordNumberInVerse),
          })),
          status: `unconfirmed`,
        }

        if(!submittedTagSet.submitted) {
          // assume their tagging will supersede the existing tagSet
          tagSet = myTagSet
        }

      }

      setTagSetInfo({
        tagSet,
        myTagSet,
        iHaveSubmittedATagSet: !!submittedTagSet,
      })

    },
    [ loc, versionId, wordsHash, skip ],
  )

  return tagSetInfo
}

export default useTagSet

// TODO: uses
  // translation - vsnum tap
  // translation - word tap **
  // orig - vsnum tap
  // parallel - word tap (this and the other version)
  // tagging

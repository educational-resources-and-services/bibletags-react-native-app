import { useState } from "react"

import { safelyExecuteSelects } from "../utils/toolbox"
import useEffectAsync from "./useEffectAsync"

const useTagSet = ({
  loc,
  versionId,
  wordsHash,
}) => {

  const [ tagSetInfo, setTagSetInfo ] = useState({})

  useEffectAsync(
    async () => {

      setTagSetInfo({})

      let [ [ tagSet ], [ submittedTagSet ] ] = await safelyExecuteSelects([
        {
          database: `versions/${versionId}/tagSets`,
          statement: () => `SELECT * FROM tagSets WHERE id=?`,
          args: [
            `${loc}-${versionId}-${wordsHash}`,
          ],
          jsonKeys: [ 'tags' ],
        },
        {
          database: `submittedTagSets`,
          statement: () => `SELECT * FROM submittedTagSets WHERE id=?`,
          args: [
            `${loc}-${versionId}-${wordsHash}`,
          ],
          jsonKeys: [ 'input' ],
        },
      ])

      if(submittedTagSet && !submittedTagSet.submitted) {
        // assume their tagging with superceded the existing tagSet
        tagSet = {
          id: `${loc}-${versionId}-${wordsHash}`,
          tags: submittedTagSet.input.map(({ origWordsInfo, translationWordsInfo }) => ({
            o: origWordsInfo.map(({ uhbWordId, wordPartNumber }) => `${uhbWordId}${wordPartNumber ? `|${wordPartNumber}` : ``}`),
            t: origWordsInfo.map(({ wordNumberInVerse }) => wordNumberInVerse),
          })),
          status: `unconfirmed`,
        }
      }

      setTagSetInfo({
        tagSet,
        iHaveSubmittedATagSet: !!submittedTagSet,
      })

    },
    [ loc, versionId, wordsHash ],
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

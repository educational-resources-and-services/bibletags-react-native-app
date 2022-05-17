import { useState } from "react"

import { safelyExecuteSelects } from "../utils/toolbox"
import useEffectAsync from "./useEffectAsync"

const useTagSet = ({
  loc,
  versionId,
  wordsHash,
  skip,
}) => {

  const [ tagSetInfo, setTagSetInfo ] = useState({})

  useEffectAsync(
    async () => {
      setTagSetInfo({})

      if(skip) return

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

      let myTagSet

      if(submittedTagSet) {

        myTagSet = {
          id: `${loc}-${versionId}-${wordsHash}`,
          tags: submittedTagSet.input.tagSubmissions.map(({ origWordsInfo, translationWordsInfo }) => ({
            o: origWordsInfo.map(({ uhbWordId, wordPartNumber }) => `${uhbWordId}${wordPartNumber ? `|${wordPartNumber}` : ``}`),
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

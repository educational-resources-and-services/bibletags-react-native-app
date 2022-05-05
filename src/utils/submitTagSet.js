import { i18n } from "inline-i18n"

import { executeSql, doGraphql, sentry } from './toolbox'

const noop = () => {}

export const getTagSubmissionId = async ({ loc, versionId, wordsHash }) => `${loc} ${versionId} ${wordsHash}`

export const recordAndSubmitTagSet = async ({ input, historyPush }) => {

  // record in db
  await executeSql({
    database: `submittedTagSets`,
    statement: () => `REPLACE INTO submittedTagSets (id, input, submitted) VALUES ?`,
    args: [
      [
        getTagSubmissionId(input),
        JSON.stringify(input),
        0,
      ],
    ],
  })

  return submitTagSet({ input, historyPush })
}

const submitTagSet = async ({ input, historyPush=noop }) => {
  try {

    const { submitTagSet: tagSet } = await doGraphql({
      mutation: `
        submitTagSet() {
          id
          tags
          status
        }
      `,
      params: {
        input,
      },
    })

    // update tag set submission in db
    await executeSql({
      database: `submittedTagSets`,
      statement: () => `UPDATE submittedTagSets SET submitted=1 WHERE id=?`,
      args: [
        getTagSubmissionId(input),
      ],
    })

    // update tagSet in db
    const tableName = `tagSets`
    const database = `versions/${input.versionId}/${tableName}`
    const keys = [
      "id",
      "tags",
      "status",
    ]
    await executeSql({
      database,
      statement: () => `REPLACE INTO ${tableName} (${keys.join(', ')}) VALUES ?`,
      args: [
        keys.map(key => (
          [ 'tags' ].includes(key)
            ? JSON.stringify(tagSet[key])
            : tagSet[key]
        ))
      ],
    })

    return true

  } catch(error) {

    if(![ `Network request failed` ].includes(error.message)) {

      sentry({ error })
      historyPush("/ErrorMessage", {
        message: i18n("Unable to submit tag set. Contact us if this problem persists."),
      })

    }

    return false

  }
}

export default submitTagSet
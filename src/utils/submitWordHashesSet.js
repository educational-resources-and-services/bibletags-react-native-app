import { executeSql, doGraphql, sentry } from './toolbox'

export const getWordHashesSetSubmissionId = ({ loc, versionId, wordsHash }) => `${loc} ${versionId} ${wordsHash}`

export const recordAndSubmitWordHashesSet = async ({ input }) => {

  console.log(`Record and submit word hash set for ${input.loc} ${input.versionId}...`)

  // record in db
  await executeSql({
    database: `submittedWordHashesSets`,
    statement: () => `REPLACE INTO submittedWordHashesSets (id, input) VALUES ?`,
    args: [
      [
        getWordHashesSetSubmissionId(input),
        JSON.stringify(input),
      ],
    ],
  })

  return submitWordHashesSet({ input })
}

const submitWordHashesSet = async ({ input }) => {
  try {

    const { submitWordHashesSet: tagSet } = await doGraphql({
      mutation: `
        submitWordHashesSet() {
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
      database: `submittedWordHashesSets`,
      statement: () => `DELETE FROM submittedWordHashesSets WHERE id=?`,
      args: [
        getWordHashesSetSubmissionId(input),
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
    }

    return false

  }
}

export default submitWordHashesSet
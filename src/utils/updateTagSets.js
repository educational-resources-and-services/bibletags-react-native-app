import { executeSql, doGraphql, setAsyncStorage, getAsyncStorage } from "./toolbox"

const attrs = {
  id: "TEXT PRIMARY KEY",
  tags: "TEXT",
  status: "TEXT",
}
const keys = Object.keys(attrs)

export const tagSetUpdateFields = `
  tagSets {
    ${keys.join('\n')}
  }
  hasMore
  newUpdatedFrom
`

export const updateDBWithTagSets = async ({ updatedTagSets, versionId, updatedFrom }) => {
  const { tagSets, hasMore, newUpdatedFrom } = updatedTagSets

  if(
    newUpdatedFrom <= updatedFrom
    || (
      hasMore
      && tagSets.length === 0
    )
  ) throw new Error(`Bad response to updatedTagSets`)

  const tableName = `tagSets`
  const database = `versions/${versionId}/${tableName}`
  const updatedFromKey = `${database}-updatedFrom`

  await executeSql({
    database,
    statements: tagSets.map(tagSet => ({
      statement: () => `REPLACE INTO ${tableName} (${keys.join(', ')}) VALUES ?`,
      args: [
        keys.map(key => (
          [ 'tags' ].includes(key)
            ? JSON.stringify(tagSet[key])
            : tagSet[key]
        ))
      ],
    })),
  })

  await setAsyncStorage(updatedFromKey, newUpdatedFrom)
}

const updateTagSets = async ({ versionId }) => {

  console.log(`Update tag sets (${versionId})...`)

  const tableName = `tagSets`
  const database = `versions/${versionId}/${tableName}`
  let numUpdates = 0

  await executeSql({
    database,
    statement: () => `
      CREATE TABLE IF NOT EXISTS ${tableName} (
        ${keys.map(key => `${key} ${attrs[key]}`).join(', ')}
      );
      CREATE INDEX IF NOT EXISTS status_idx ON ${tableName} (status)
    `,
  })

  const fetchGroup = async () => {

    const updatedFromKey = `${database}-updatedFrom`
    const updatedFrom = await getAsyncStorage(updatedFromKey, 0)
    console.log(`Get tag sets for ${versionId} from ms timestamp of ${updatedFrom}...`)

    const { updatedTagSets } = await doGraphql({
      query: `
        updatedTagSets() {
          ${tagSetUpdateFields}
        }
      `,
      params: {
        versionId,
        updatedFrom,
      },
    })

    await updateDBWithTagSets({ updatedTagSets, versionId, updatedFrom })

    numUpdates += updatedTagSets.tagSets.length

    if(updatedTagSets.hasMore) {
      await fetchGroup()
    }

  }

  await fetchGroup()

  console.log(`${numUpdates} tag sets updated for ${versionId}.`)

}

export default updateTagSets
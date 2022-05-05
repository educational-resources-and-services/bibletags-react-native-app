import * as FileSystem from "expo-file-system"

import { executeSql, doGraphql, setAsyncStorage, getAsyncStorage } from "./toolbox"

const sqliteDir = `${FileSystem.documentDirectory}SQLite`

const updateLanguageSpecificDefinitions = async ({ languageId }) => {

  console.log(`Update language specific definitions (${languageId})...`)

  const tableName = `languageSpecificDefinitions`
  const database = `${languageId}/${tableName}`
  let numUpdates = 0

  const attrs = {
    id: "TEXT PRIMARY KEY",
    gloss: "TEXT",
    syn: "TEXT",
    rel: "TEXT",
    lexEntry: "TEXT",
    editorId: "TEXT",
  }
  const keys = Object.keys(attrs)

  await FileSystem.makeDirectoryAsync(`${sqliteDir}/${languageId}`, { intermediates: true })
  await executeSql({
    database,
    statement: () => `
      CREATE TABLE IF NOT EXISTS ${tableName} (
        ${keys.map(key => `${key} ${attrs[key]}`).join(', ')}
      );
      CREATE INDEX IF NOT EXISTS editorId_idx ON ${tableName} (editorId)
    `,
  })

  const fetchGroup = async () => {

    const updatedFromKey = `${database}-updatedFrom`
    const updatedFrom = await getAsyncStorage(updatedFromKey, 0)
    console.log(`Get language specific definitions for ${languageId} from ms timestamp of ${updatedFrom}...`)

    const { updatedLanguageSpecificDefinitions: { languageSpecificDefinitions, hasMore, newUpdatedFrom } } = await doGraphql({
      query: `
        updatedLanguageSpecificDefinitions() {
          languageSpecificDefinitions {
            ${keys.join('\n')}
          }
          hasMore
          newUpdatedFrom
        }
      `,
      params: {
        languageId,
        updatedFrom,
      },
    })

    if(
      newUpdatedFrom <= updatedFrom
      || (
        hasMore
        && languageSpecificDefinitions.length === 0
      )
    ) throw new Error(`Bad response to updatedLanguageSpecificDefinitions`)

    await executeSql({
      database,
      statements: languageSpecificDefinitions.map(languageSpecificDefinition => ({
        statement: () => `REPLACE INTO ${tableName} (${keys.join(', ')}) VALUES ?`,
        args: [
          keys.map(key => (
            [ 'syn', 'rel' ].includes(key)
              ? JSON.stringify(languageSpecificDefinition[key])
              : languageSpecificDefinition[key]
          ))
        ],
      })),
    })

    await setAsyncStorage(updatedFromKey, newUpdatedFrom)
    numUpdates += languageSpecificDefinitions.length

    if(hasMore) {
      await fetchGroup()
    }

  }

  await fetchGroup()

  console.log(`${numUpdates} language specific definitions updated for ${languageId}.`)

}

export default updateLanguageSpecificDefinitions
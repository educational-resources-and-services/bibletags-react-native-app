import { executeSql, doGraphql } from "./toolbox"

const updateLanguages = async ({ languageIdsNeedingUpdate }) => {

  console.log(`Update languages (${languageIdsNeedingUpdate.join(', ')})...`)

  const tableName = `languages`
  const database = tableName

  const keys = [
    "id",
    "name",
    "englishName",
    "definitionPreferencesForVerbs",
    "standardWordDivider",
  ]

  const { languages } = await doGraphql({
    query: `
      languages() {
        ${keys.join('\n')}
      }
    `,
    params: {
      languageIds: languageIdsNeedingUpdate,
    },
  })

  await executeSql({
    database,
    statements: languages.map(language => ({
      statement: () => `REPLACE INTO ${tableName} (${keys.join(', ')}) VALUES ?`,
      args: [
        keys.map(key => (
          [ 'definitionPreferencesForVerbs' ].includes(key)
            ? JSON.stringify(language[key])
            : language[key]
        ))
      ],
    })),
  })

  const updatedLanguageIds = languages.map(({ id }) => id)

  console.log(`Languages updated from server: ${updatedLanguageIds.join(', ')}`)

}

export default updateLanguages
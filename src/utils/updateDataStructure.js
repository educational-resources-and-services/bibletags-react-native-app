import { getAsyncStorage, setAsyncStorage, executeSql } from "./toolbox"

// When a data structure change requires conversion to existing data, add on the update function here.
// IMPORTANT: Never remove an update function which has been made live. If it turns out to be buggy,
// instead add a new update function to reverse it.

const dataStructureUpdateFunctions = [
  async () => {

    console.log("Set up data structure for languages and submittedTagSets...")
    // IMPORTANT: never remove a data update function like this that has previously gone live!!

    { // languages
      const tableName = `languages`
      const database = tableName

      const attrs = {
        id: "TEXT PRIMARY KEY",
        name: "TEXT",
        englishName: "TEXT",
        definitionPreferencesForVerbs: "TEXT",
        standardWordDivider: "TEXT",
      }
      const keys = Object.keys(attrs)

      await executeSql({
        database,
        statement: () => `
          CREATE TABLE IF NOT EXISTS ${tableName} (
            ${keys.map(key => `${key} ${attrs[key]}`).join(', ')}
          );
          CREATE INDEX IF NOT EXISTS name_idx ON ${tableName} (name)
        `,
      })
    }

    { // submittedWordHashesSets
      const tableName = `submittedWordHashesSets`
      const database = tableName

      const attrs = {
        id: "TEXT PRIMARY KEY",
        input: "TEXT",
      }
      const keys = Object.keys(attrs)

      await executeSql({
        database,
        statement: () => `
          CREATE TABLE IF NOT EXISTS ${tableName} (
            ${keys.map(key => `${key} ${attrs[key]}`).join(', ')}
          )
        `,
      })
    }

    { // submittedTagSets
      const tableName = `submittedTagSets`
      const database = tableName

      const attrs = {
        id: "TEXT PRIMARY KEY",
        input: "TEXT",
        submitted: "INTEGER",  // boolean, really
      }
      const keys = Object.keys(attrs)

      await executeSql({
        database,
        statement: () => `
          CREATE TABLE IF NOT EXISTS ${tableName} (
            ${keys.map(key => `${key} ${attrs[key]}`).join(', ')}
          );
          CREATE INDEX IF NOT EXISTS submitted_idx ON ${tableName} (submitted)
        `,
      })
    }

  },
  // async () => {
  //   // Add a data structure update in here
  //   console.log("This is what this data structure update does...")
  //   // IMPORTANT: never remove a data update function like this that has previously gone live!!
  // },
  // async () => {
  //   // Add a data structure update in here
  //   console.log("This is what this data structure update does...")
  //   // IMPORTANT: never remove a data update function like this that has previously gone live!!
  // },
  // async () => {
  //   // Add a data structure update in here
  //   console.log("This is what this data structure update does...")
  //   // IMPORTANT: never remove a data update function like this that has previously gone live!!
  // },
]

const updateDataStructure = async () => {

  console.log(`Check data structure...`)
  
  const currentDataStructureVersionIndex = await getAsyncStorage('dataStructureVersionIndex', 0)

  for(let i = currentDataStructureVersionIndex; i < dataStructureUpdateFunctions.length; i++) {
    console.log(`Executing data structure update ${i+1}...`)
    await dataStructureUpdateFunctions[i]()
    await setAsyncStorage('dataStructureVersionIndex', i + 1)
    console.log(`Data structure update ${i+1} executed successfully.`)
  }

  console.log(`Data structure up-to-date (${dataStructureUpdateFunctions.length} updates to date).`)

}    
        
export default updateDataStructure
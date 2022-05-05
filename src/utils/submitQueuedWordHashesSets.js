import { executeSql } from "./toolbox"
import submitWordHashesSet from "./submitWordHashesSet"

const submitQueuedWordHashesSets = async () => {

  // get unsubmitted tag sets
  const { rows: { _array: wordHashesSets } } = await executeSql({
    database: `submittedWordHashesSets`,
    statement: () => `SELECT * FROM submittedWordHashesSets`,
    jsonKeys: [ 'input' ],
  })

  if(wordHashesSets.length === 0) {
    console.log(`No queued word hashes sets to submit.`)
    return
  }

  console.log(`Will attempt to submit ${wordHashesSets.length} queued word hashes sets...`)

  let numSubmittedSuccessfully = 0

  // submit them one at a time
  for(let wordHashesSet of wordHashesSets) {
    if(
      await submitWordHashesSet({
        input: wordHashesSet.input,
      })
    ) numSubmittedSuccessfully++
  }

  console.log(`${numSubmittedSuccessfully}/${wordHashesSets.length} word hashes sets submitted successfully.`)

}

export default submitQueuedWordHashesSets
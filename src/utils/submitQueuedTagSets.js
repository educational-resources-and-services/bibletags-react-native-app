import { executeSql } from "./toolbox"
import submitTagSet from "./submitTagSet"

const submitQueuedTagSets = async () => {

  // get unsubmitted tag sets
  const { rows: { _array: tagSets } } = await executeSql({
    database: `submittedTagSets`,
    statement: () => `SELECT * FROM submittedTagSets WHERE submitted=0`,
    jsonKeys: [ 'input' ],
  })

  if(tagSets.length === 0) {
    console.log(`No queued tag sets to submit.`)
    return
  }

  console.log(`Will attempt to submit ${tagSets.length} queued tag sets...`)

  let numSubmittedSuccessfully = 0

  // submit them one at a time
  for(let tagSet of tagSets) {
    if(
      (await submitTagSet({
        input: tagSet.input,
      })).success
    ) numSubmittedSuccessfully++
  }

  console.log(`${numSubmittedSuccessfully}/${tagSets.length} tag sets submitted successfully.`)

}

export default submitQueuedTagSets
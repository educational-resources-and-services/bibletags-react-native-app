import { useMemo } from "react"
import { getNumberOfChapters, getBookIdListWithCorrectOrdering } from "bibletags-versification/src/versification"
import { getVersionInfo } from "../utils/toolbox"

const useAdjacentRefs = ({ ref, versionId }) => {

  const adjacentRefs = useMemo(
    () => {
      const versionInfo = getVersionInfo(versionId)
      const { bookId } = ref
      const bookIdsWithCorrectOrdering = getBookIdListWithCorrectOrdering({ versionInfo })

      const numChapters = getNumberOfChapters({
        versionInfo,
        bookId,
      }) || 0

      let previous = {
        ...ref,
        chapter: ref.chapter - 1,
      }

      let next = {
        ...ref,
        chapter: ref.chapter + 1,
      }

      if(ref.chapter <= 1) {
        const previousBookId = bookIdsWithCorrectOrdering[ bookIdsWithCorrectOrdering.indexOf(bookId) - 1 ]
        const numChaptersPreviousBook = getNumberOfChapters({
          versionInfo,
          bookId: previousBookId,
        }) || 0

        previous = {
          ...previous,
          chapter: numChaptersPreviousBook,
          bookId: previousBookId,
        }
      }

      if(ref.chapter >= numChapters) {
        const nextBookId = bookIdsWithCorrectOrdering[ bookIdsWithCorrectOrdering.indexOf(bookId) + 1 ]

        next = {
          ...next,
          chapter: 1,
          bookId: nextBookId,
        }
      }

      return {
        previous,
        next,
      }
    },
    [ ref, versionId ],
  )
  
  return adjacentRefs
}

export default useAdjacentRefs

import { useMemo } from "react"
import { isValidBibleSearch, isOriginalLanguageSearch } from "@bibletags/bibletags-ui-helper"

import useBibleVersions from "./useBibleVersions"
import useMemoAsync from "./useMemoAsync"
import { getVersionInfo } from "../utils/toolbox"
import getBibleSearchResults from "../utils/getBibleSearchResults"

const limit = 10
const MAX_NUM_VERSIONS_TO_SEARCH_AT_ONCE = 5

const cachedPromises = {}

const useBibleSearchResults = ({
  searchText,
  myBibleVersions,
  skip,
  index=0,
}) => {

  const { downloadedNonOriginalVersionIds } = useBibleVersions({ myBibleVersions })

  skip = skip || !searchText || downloadedNonOriginalVersionIds.length === 0

  const { bibleSearchText, includeVersionIds } = useMemo(
    () => {
      if(skip) return {}

      const versionIdsBySafeVersionAbbr = {}
      downloadedNonOriginalVersionIds.forEach(versionId => {
        versionIdsBySafeVersionAbbr[getVersionInfo(versionId).abbr] = versionId
      })
      const firstTranslationVersionId = downloadedNonOriginalVersionIds[0]
      let bibleSearchText = searchText
      let includeVersionIds = []

      if(isOriginalLanguageSearch(searchText)) {
        if(/(?:^| )include:none(?: |$)/i.test(bibleSearchText)) {
          bibleSearchText = bibleSearchText.replace(/(?:^| )include:none(?= |$)/gi, '')
        } else if(/(?:^| )include:[A-Z0-9]{2,9}(?:,[A-Z0-9]{2,9})*(?: |$)/i.test(bibleSearchText)) {
          bibleSearchText = (
            bibleSearchText
              .replace(/((?:^| )include:[A-Z0-9]{2,9}(?:,[A-Z0-9]{2,9})*(?= |$))/gi, match => {
                const lowerCaseMatch = match.toLowerCase()
                includeVersionIds.push(...lowerCaseMatch.split(':')[1].split(','))
                return lowerCaseMatch
              })
          )
        } else if(firstTranslationVersionId) {
          bibleSearchText = `${bibleSearchText} include:${firstTranslationVersionId}`
          includeVersionIds.push(firstTranslationVersionId)
        }
      } else {
        let hasVersionId = false
        bibleSearchText = bibleSearchText.replace(/((?:^| )in:[A-Z0-9]{2,9}(?:,[A-Z0-9]{2,9})*(?= |$))/gi, match => (
          match
            .split(/(in:|,| )/g)
            .map(inItem => {
              if(versionIdsBySafeVersionAbbr[inItem]) {
                hasVersionId = true
                return versionIdsBySafeVersionAbbr[inItem]
              } else {
                return inItem
              }
            })
            .join('')
          )
        )
        if(!hasVersionId) {
          const versionIdsToUse = (
            /(?:^| )same:(?:phrase|sentence|paragraph)(?: |$)/i.test(bibleSearchText)
              ? downloadedNonOriginalVersionIds.slice(0,1)
              : downloadedNonOriginalVersionIds.slice(0,MAX_NUM_VERSIONS_TO_SEARCH_AT_ONCE)
          )
          bibleSearchText = `${bibleSearchText} in:${versionIdsToUse.join(',')}`
        }
      }

      return {
        bibleSearchText,
        includeVersionIds,
      }
    },
    [ searchText, downloadedNonOriginalVersionIds ],
  )

  skip = skip || !isValidBibleSearch({ query: bibleSearchText })
  const offset = parseInt(index / limit, 10) * limit

  const bibleSearchResults = useMemoAsync(
    async () => {
      if(skip) return

      const cachedPromisesKey = JSON.stringify({
        downloadedNonOriginalVersionIds,
        bibleSearchText,
        offset,
        limit,
      })

      cachedPromises[cachedPromisesKey] = (
        cachedPromises[cachedPromisesKey]
        || (
          getBibleSearchResults({
            downloadedNonOriginalVersionIds,
            args: {
              query: bibleSearchText,
              hebrewOrdering: false,
              offset,
              limit,
            },
          })
        )
      )

      return await cachedPromises[cachedPromisesKey]
    },
    [ skip, downloadedNonOriginalVersionIds, bibleSearchText, offset, limit ],
  )

  const bibleSearchResult = useMemo(
    () => ((bibleSearchResults || {}).results || [])[index % limit],
    [ bibleSearchResults, index ],
  )

  return {
    bibleSearchResults,
    bibleSearchResult,
    includeVersionIds,
  }
}

export default useBibleSearchResults
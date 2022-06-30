import { useMemo } from "react"
import { findAutoCompleteSuggestions, getRefsFromPassageStr, isOriginalLanguageSearch } from "@bibletags/bibletags-ui-helper"
import { getLocFromRef } from "@bibletags/bibletags-versification"

import useVersePieces from "./useVersePieces"
import useEqualObjsMemo from "./useEqualObjsMemo"
import useBibleSearchResults from "./useBibleSearchResults"
// import useIsLoggedIn from "./useIsLoggedIn"
import useBibleVersions from "./useBibleVersions"

// import highlightsQuery from '../graphql/queries/highlights'

const useSearchResults = ({ searchText, myBibleVersions, openPassage }) => {

  const { downloadedVersionIds } = useBibleVersions({ myBibleVersions })

  const menuItemsForSearch = [] //useMemo(() => GET_MENU_ITEMS_FOR_SEARCH(), [])
  const settingsForSearch = [] //useMemo(() => GET_SETTINGS_FOR_SEARCH(), [])
  const helpForSearch = [] //useMemo(() => GET_HELP_FOR_SEARCH(), [])

  const isLoggedIn = false //useIsLoggedIn()

  const isOrigLanguageSearch = isOriginalLanguageSearch(searchText)

  //////////////////////////////
  // BEGIN COLLECTING RESULTS //
  //////////////////////////////

  // 1. Passage look-ups
  
  let { refs=[], versionId } = (searchText && !isOrigLanguageSearch && getRefsFromPassageStr(searchText)) || {}
  const foundPassageRef = refs.length !== 0
  if(foundPassageRef) {
    openPassage({
      ref: refs[0],
      versionId,
    })
  }
  const passageInfoSets = []
  // const searchWasForEntireChapter = foundPassageRef && refs[0].verse === undefined

  // if(searchWasForEntireChapter) {
  //   refs = Array(3).fill().map((x, idx) => ({ ...refs[0], verse: idx+1 }))
  // }

  // const getExtraInfo = idx => (
  //   ((versionId && idx > 0) || !foundPassageRef)
  //     ? {}
  //     : {
  //       versionId: !versionId && downloadedVersionIds[idx],
  //       bookId: refs[0].bookId,
  //       ...(
  //         searchWasForEntireChapter
  //           ? {
  //             fromLoc: getLocFromRef(refs[0]).slice(0, -3),
  //           }
  //           : {
  //             fromLoc: getLocFromRef(refs[0]),
  //             toLoc: getLocFromRef(refs.slice(-1)[0]),
  //           }
  //       ),
  //       startChapter: refs[0].chapter,
  //     }
  // )

  // const getUseVersesPiecesParams = (idx, vId) => ({
  //   refs,
  //   versionId: vId || downloadedVersionIds[idx],
  //   skip: !searchText || !foundPassageRef || ((!!versionId || !downloadedVersionIds[idx] || (refs.length > 1 && idx > 3)) && !vId),
  // })

  // let passageInfoSets = [
  //   {
  //     ...getExtraInfo(0),
  //     versionId: foundPassageRef && (versionId || downloadedVersionIds[0]),
  //     ...useVersePieces(getUseVersesPiecesParams(0, versionId)),
  //   },
  //   {
  //     ...getExtraInfo(1),
  //     ...useVersePieces(getUseVersesPiecesParams(1)),
  //   },
  //   {
  //     ...getExtraInfo(2),
  //     ...useVersePieces(getUseVersesPiecesParams(2)),
  //   },
  //   {
  //     ...getExtraInfo(3),
  //     ...useVersePieces(getUseVersesPiecesParams(3)),
  //   },
  //   {
  //     ...getExtraInfo(4),
  //     ...useVersePieces(getUseVersesPiecesParams(4)),
  //   },
  //   {
  //     ...getExtraInfo(5),
  //     ...useVersePieces(getUseVersesPiecesParams(5)),
  //   },
  //   {
  //     ...getExtraInfo(6),
  //     ...useVersePieces(getUseVersesPiecesParams(6)),
  //   },
  //   {
  //     ...getExtraInfo(7),
  //     ...useVersePieces(getUseVersesPiecesParams(7)),
  //   },
  //   {
  //     ...getExtraInfo(8),
  //     ...useVersePieces(getUseVersesPiecesParams(8)),
  //   },
  //   {
  //     ...getExtraInfo(9),
  //     ...useVersePieces(getUseVersesPiecesParams(9)),
  //   },
  // ]

  // let passageInfoLoading = false
  // passageInfoSets.forEach(set => {
  //   set.pieces = set.piecesAndLoading[0]
  //   passageInfoLoading = passageInfoLoading || set.piecesAndLoading[1]
  //   delete set.piecesAndLoading
  // })

  // 2. Bible search

  const { bibleSearchResults, includeVersionIds } = useBibleSearchResults({ searchText, myBibleVersions, skip: !searchText || foundPassageRef })

  // 3. Projects

  // const { projects: projectsAndCount } = useDataQuery({
  //   projectsQuery,
  //   variables: {
  //     query: searchText,
  //     limit: 3,
  //   },
  //   skip: !searchText || isOrigLanguageSearch || !isLoggedIn,
  // })

  // 4. Highlights

  const highlightsAndCount = { highlights: [], count: 0 }
  // const { highlights: highlightsAndCount } = useDataQuery({
  //   highlightsQuery,
  //   variables: {
  //     query: fromLoc,
  //     limit: 3,
  //   },
  //   skip: !searchText || isOrigLanguageSearch,
  // })

  // 5. Alerts

    // use alertsItems query (or what is already stored locally?)

  // 6. Online Courses

  // 7. Bible versions

  const versions = []
  // const { versions } = useBibleVersions({
  //   searchText,
  //   limit: 2,
  //   skip: !searchText || isOrigLanguageSearch,
  // })

  // 8. App items (menu, settings)

  const appItems = (
    searchText 
      ? (
        findAutoCompleteSuggestions({
          str: searchText,
          suggestionOptions: (
            isOrigLanguageSearch
              ? []
              : [
                ...menuItemsForSearch,
                ...settingsForSearch,
              ]
          ),
          max: 3,
        })
      )
      : []
  )

  // 9. Help items

  const helpItems = (
    searchText
      ? (
        findAutoCompleteSuggestions({
          str: searchText,
          suggestionOptions: (
            isOrigLanguageSearch
              ? []
              : helpForSearch
          ),
          max: 3,
        })
      )
      : []
  )

  // 10. Shared with me
  // 11. BSB
  // 12. EQUIP blog posts

    // use searchShared query

  // passageInfoSets = useEqualObjsMemo(passageInfoSets.filter(({ versionId, pieces }) => versionId && (pieces || []).length > 0))

  return {
    foundPassageRef,
    // passageInfoLoading,
    passageInfoSets,
    bibleSearchResults,
    includeVersionIds,
    // projectsAndCount,
    highlightsAndCount,
    versions,
    appItems,
    helpItems,
  }
}

export default useSearchResults
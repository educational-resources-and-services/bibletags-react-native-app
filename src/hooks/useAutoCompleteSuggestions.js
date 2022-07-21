import { useMemo } from "react"
import { findAutoCompleteSuggestions, isValidBibleSearch, getFlagSuggestions,
         getBibleBookName, getRefsFromPassageStr, getPassageStr, isOriginalLanguageSearch,
         completeQueryGroupings, getGrammarDetailsForAutoCompletionSuggestions } from "@bibletags/bibletags-ui-helper"

import { addOriginalWordsForSearch, getVersionInfo } from '../utils/toolbox'
import useEqualObjsMemo from "./useEqualObjsMemo"
import useBibleVersions from "./useBibleVersions"
import useDataQueryAutoCompleteSuggestions from "./useDataQueryAutoCompleteSuggestions"

const completeGroupingsAndValidate = suggestions => (
  suggestions
    .map(suggestion => {
      const updatedSuggestion = {
        ...suggestion,
        suggestedQuery: completeQueryGroupings(suggestion.suggestedQuery),
      }
      return (
        isValidBibleSearch({ query: updatedSuggestion.suggestedQuery })
          ? updatedSuggestion
          : null
      )
    })
    .filter(Boolean)
)

const useAutoCompleteSuggestions = ({ searchTextInComposition, myBibleVersions }) => {

  const { downloadedNonOriginalVersionIds, downloadedVersionIds } = useBibleVersions({ myBibleVersions, restrictToTestamentSearchText: searchTextInComposition })

  const menuItemsForSearch = [] //useMemo(() => GET_MENU_ITEMS_FOR_SEARCH(), [])

  let autoCompleteSuggestions = []

  let normalizedSearchText = (
    searchTextInComposition
      .replace(/  +/g, ' ')
      .replace(/^ /g, '')
  )
  const searchTextWords = normalizedSearchText.split(/( +|[()"])/g)
  const currentWord = searchTextWords.pop()
  const searchTextWithoutCurrentWord = searchTextWords.join('')
  normalizedSearchText = normalizedSearchText.trim()
  const [ x, searchTextWithoutCurrentDetail, currentDetail ] = normalizedSearchText.match(/^(.*?)([#=][^#= ]*)?$/)

  const isOrigLanguageSearch = isOriginalLanguageSearch(normalizedSearchText)

  let incompleteQuery = normalizedSearchText
  if(/#[HG][0-9]{5}/.test(currentWord)) {
    incompleteQuery = incompleteQuery.replace(/#l(?:e|em|emm|emma)$/, '#lemma:')
    incompleteQuery = incompleteQuery.replace(/#f(?:o|or|orm)$/, '#form:')
  }

  const { autoCompleteSuggestions: autoCompleteSuggestionsFromDataQuery } = useDataQueryAutoCompleteSuggestions({
    incompleteQuery,
    skip: !incompleteQuery,
  })

  // useMemo instead of useEffect to get this run before the suggestions are rendered
  useMemo(
    () => {
      ;(autoCompleteSuggestionsFromDataQuery || []).forEach(({ originalWords }) => {
        addOriginalWordsForSearch(originalWords)
      })
    },
    [ autoCompleteSuggestionsFromDataQuery ]
  )

  //////////////////////////////////
  // BEGIN COLLECTING SUGGESTIONS //
  //////////////////////////////////

  // 1. as-is search

  let asIsSuggestedQuery = normalizedSearchText

  // completed groupings and phrases
  asIsSuggestedQuery = completeQueryGroupings(asIsSuggestedQuery)

  // returning nothing if invalid
  if(!isValidBibleSearch({ query: asIsSuggestedQuery })) {
    asIsSuggestedQuery = ``
  }

  if(asIsSuggestedQuery) {
    const asIsSuggestion = {
      suggestedQuery: asIsSuggestedQuery,
    }
    autoCompleteSuggestions.push(asIsSuggestion)
  }

  // 2. flags

  if(
    /^(?:in|same):/i.test(currentWord)  // only if full flag is present
    && !isOrigLanguageSearch
    && isValidBibleSearch({ query: searchTextWithoutCurrentWord })  // validate without this flag
  ) {
    autoCompleteSuggestions.push(
      ...getFlagSuggestions({
        searchTextInComposition,
        versionAbbrsForIn: downloadedNonOriginalVersionIds.map(versionId => getVersionInfo(versionId).abbr),
      })
    )
  }

  // 3. `project-search-history`

  autoCompleteSuggestions.push(
    ...(autoCompleteSuggestionsFromDataQuery || []).filter(({ from }) => from === `project-search-history`)
  )

  // 4. recent searches, passages (top 3)  TODO
    // use recentSearches
    // use findAutoCompleteSuggestions
    // also, show recent searches when no text entered yet

  // 5. recent projects by name - only if no # or = present  TODO
    // get data via single graphql query with polling and invalidation (10 most recent?)
    // use findAutoCompleteSuggestions
    // mark this as a "recent project" so folks know why their other projects don't show up in suggestions

  // 6. `common-query`

  autoCompleteSuggestions.push(
    ...(autoCompleteSuggestionsFromDataQuery || []).filter(({ from }) => from === `common-query`)
  )

  // 7. key menu items

  if(normalizedSearchText && !isOrigLanguageSearch) {
    autoCompleteSuggestions.push(
      ...findAutoCompleteSuggestions({
        str: normalizedSearchText,
        suggestionOptions: menuItemsForSearch,
        max: 2,
      })
    )
  }

  // 8. courses - only if no # or = present
    // get data via single graphql query or API request
    // use findAutoCompleteSuggestions

  // 9. bible book
  // 10. passage

  if(normalizedSearchText && !isOrigLanguageSearch) {
    let refsAndVersionId = getRefsFromPassageStr(normalizedSearchText)
    let isBookOnly = false
    if(!refsAndVersionId) {
      const [ x, beforePossibleVersion='', possibleVersion='' ] = normalizedSearchText.match(/^(.*?) ([a-z0-9]{2,9}) *$/) || []
      refsAndVersionId = (
        getRefsFromPassageStr(`${normalizedSearchText} 1`)
        || getRefsFromPassageStr(`${beforePossibleVersion} 1 ${possibleVersion}`)
      )
      isBookOnly = !!refsAndVersionId
    }
    if(refsAndVersionId) {
      let { refs, versionId } = refsAndVersionId
      if(versionId && !downloadedVersionIds.includes(versionId)) {
        versionId = downloadedVersionIds.find(vId => vId.indexOf(versionId) === 0) || versionId
      }
      if(refs.length === 1 && (!versionId || downloadedVersionIds.includes(versionId))) {
        const { bookId, chapter } = refs[0]
        if(isBookOnly) {
          // TODO: I may want to allow this search once projects are involved
          // autoCompleteSuggestions.push({
          //   from: "bible-book",
          //   suggestedQuery: getBibleBookName(bookId),
          // })
        }
        autoCompleteSuggestions.push({
          from: "passage",
          suggestedQuery: `${getPassageStr(refsAndVersionId)}${versionId ? ` ${versionId.toUpperCase()}` : ``}`,
          refs: [{
            bookId,
            chapter,
          }],
          versionId,
          action: "read",
        })
      }
    }
  }

  // 11. `translation-look-up` + `look-up`

  if(currentWord) {
    autoCompleteSuggestions.push(
      ...completeGroupingsAndValidate(
        (autoCompleteSuggestionsFromDataQuery || []).filter(({ from }) => [ `translation-look-up`, `look-up` ].includes(from))
      )
    )
  }

  // 12. orig language grammar detail or flag
  if(
    currentWord
    && isOrigLanguageSearch
    && (
      isValidBibleSearch({ query: completeQueryGroupings(searchTextWithoutCurrentDetail) })  // validate without this present detail and groupings/phrases completed
      || completeQueryGroupings(searchTextWithoutCurrentDetail) === ``
    )
  ) {

    let suggestions = []

    if(currentDetail) {

      suggestions.push(
        ...findAutoCompleteSuggestions({
          str: normalizedSearchText,
          suggestionOptions: (
            getGrammarDetailsForAutoCompletionSuggestions({ currentWord, normalizedSearchText }).map(detail => ({
              from: "grammar",
              // originalWords,  // TODO: get this
              suggestedQuery: `${searchTextWithoutCurrentDetail}#${detail}`,
            }))
          ),
          max: 2,
        })
      )

      // TODO: version e.g. =love[ESV]

    }

    if(/^(?:i|in|inc|incl|inclu|includ|include|include:|in:|s|sa|sam|same|same:)/.test(currentWord)) {
      suggestions.push(
        ...getFlagSuggestions({
          searchTextInComposition,
          versionAbbrsForIn: [ 'UHB', 'UGNT', 'LXX' ],
          versionAbbrsForInclude: downloadedNonOriginalVersionIds.map(versionId => getVersionInfo(versionId).abbr),
        })
      )
    }

    // completed groupings and phrases, and validate
    suggestions = completeGroupingsAndValidate(suggestions)

    autoCompleteSuggestions.push(...suggestions)

  }

  // 13. tags - only if # is first char
    // get data via single graphql query with polling and invalidation
    // use findAutoCompleteSuggestions

  // 14. versions
    // first look in selectedVersionInfos and offer to change to reading that version
    // second look in other versions and bring them to where they can add that version


  //////////////////
  // FINAL DETALS //
  //////////////////

  // dedup suggestions
  const suggestionsBySuggestedQuery = {}
  autoCompleteSuggestions = (
    autoCompleteSuggestions
      .map(suggestion => {
        const { suggestedQuery, action } = suggestion
        if(suggestionsBySuggestedQuery[suggestedQuery] && action === suggestionsBySuggestedQuery[suggestedQuery].action) {
          for(let key in suggestion) {
            suggestionsBySuggestedQuery[suggestedQuery][key] = suggestionsBySuggestedQuery[suggestedQuery][key] || suggestion[key]
          }
          return null
        } else {
          suggestionsBySuggestedQuery[suggestedQuery] = { ...suggestion }  // make it a new object because those from graphql are readonly
          return suggestionsBySuggestedQuery[suggestedQuery]
        }
      })
      .filter(Boolean)
  )

  // get tabAddition
  const firstSuggestion = autoCompleteSuggestions[0] || {}
  const firstSuggestedQuery = firstSuggestion.suggestedQuery || ``
  const tabAddition = (
    firstSuggestedQuery.indexOf(normalizedSearchText) === 0
      ? firstSuggestedQuery.slice(normalizedSearchText.length)
      : ``
  )

  autoCompleteSuggestions = useEqualObjsMemo(autoCompleteSuggestions)

  return { autoCompleteSuggestions, tabAddition }
}

export default useAutoCompleteSuggestions

/*

CONCLUSIONS
  - If current text is incomplete, top option will show first completed version
    - also show completion in shadow input in light gray
    ** even in this case arrowing away from the top option and back always yields a restoration of what was in the text field
  - Unless current text is incomplete, then it is the top option
  - Enter executes the search
  - Up and down go through the options (cycling around), changing the input to that option with cursor at the end, except for the first option which shows what was there before the arrow keys
    - highlighting and left/right arrow don't change the options; only editing the text does
  - Match hits off the starts of words
  - Show mini-orig language search helps when blank or just '#' or '=', no orig helps when something else
  - Show link to view advanced search helps always

> c
] c
  charity {Search History} {{ x to remove }}
  Understanding Calvary {Recent Project} {OPEN}
  All Courses {OPEN in new tab}
  The Person of Christ {A Biblearc EQUIP course} {OPEN in new tab}
  Colossians
  Colossians 1 {ESV} {READ}

> co
] co
  All Courses {OPEN in new tab}
  Colossians
  Colossians 1 {ESV} {READ}

> co in:
] co in:
  co in:ESV
  co in:NASB

> col
] col
  Colossians
  Colossians 1 {ESV} {READ}

> col 2
] col 2
  Colossians 2
  Colossians 2 {ESV} {READ}

> col 2:
] col 2:
  Colossians 2:1 {ESV} {READ}

> col 2:3
] Colossians 2:3
  Colossians 2 {ESV} {READ}

> #H99283
] #H99280{1}
  #H09283{2}

> 

> #HUFDS

> #

> #*

> #HUFDS#h>

> #HUFDS #h>

> hel
] hel
  hello
  help

> #s[ingular]
] #singular
  #sh{ש}
  #H12345{שלום}

> #sh{ש}
] #sh{ש}
  #H12345{שלום}

> #sha{שלום}
] #H12345{שלום}
  #H02345{שם}

> #H43[000]{1}
] #H43000{1}
  #H04300{2}

> #H01200 #b#H43[000]{1}
] #H01200 #b#H43000{1}
  #H01200 #b#H04300{2}

> #λογ{1}
] #H22222{1}
  #H33333{2}

> λογ
] λογ
  #H22222{1}
  #H33333{2}

> =tes[t]
] =test
  =testing

> =test
] =test
  =testing

> #lemma:βαρ[a]
] #lemma:βαρa
  #lemma:βαρb

> #G00140#lemma:[a]
] #G00140#lemma:a
  #G00140#lemma:b

> #G00140#lemma:a
] #G00140#lemma:a
  #G00140#lemma:aa

> #noun#masculine#plural i[nclude:variants]
] #noun#masculine#plural include:variants
  #noun#masculine#plural in:ESV

> (#H72250 / #not:H1254[1)]{1}
] (#H72250 / #not:H12541){1}
  (#H72250 / #not:H12542){2}


EXAMPLE VALUES:

  const autoCompleteSuggestions = [
    {
      from: "search-history",
      resultCount: 3,
      suggestedQuery: "charity",
    },
    {
      from: "recent-projects",
      suggestedQuery: "Understanding Calvary",
      path: "/project/123",
      action: "open",
    },
    {
      from: "menu-item",
      suggestedQuery: "All Courses",
      url: "https://equip.biblearc.com/blah",
      action: "open-new-tab",
    },
    {
      from: "equip-course",
      suggestedQuery: "The Person of Christ",
      logo: "EQUIP",
      url: "https://equip.biblearc.com/blah2",
      action: "open-new-tab",
    },
    {
      from: "bible-book",
      suggestedQuery: "Colossians",
    },
    {
      from: "passage",
      suggestedQuery: "Colossians 1 ESV",
      refs: [{
        bookId: 1,
        chapter: 1,
      }],
      versionId: 'esv',
      action: "read",
    },
    {
      from: "look-up",
      originalWords: {
        H43000: {
          gloss: "an iron bar",
          lex: "מְטִיל",
        },
      },
      resultCount: 1,
      suggestedQuery: "#H43000",
    },
    {
      from: "tags",
      suggestedQuery: "#calvary",
      path: "/projects#...",
      action: "open",
    },
  ]

*/
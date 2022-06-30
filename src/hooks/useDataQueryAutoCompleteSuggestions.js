import { useState } from "react"
import { getLocale } from "inline-i18n"
import { getNakedWord } from "@bibletags/bibletags-ui-helper"

import useEffectAsync from "./useEffectAsync"
import useInstanceValue from "./useInstanceValue"
import getAutoCompleteSuggestions from "../utils/getAutoCompleteSuggestions"

const SUGGESTIONS_LIMIT = 6

const useDataQueryAutoCompleteSuggestions = ({
  incompleteQuery,
  skip,
}) => {

  const [ autoCompleteSuggestions, setAutoCompleteSuggestion ] = useState()
  const getIncompleteQuery = useInstanceValue(incompleteQuery)

  useEffectAsync(
    async () => {
      if(skip) return

      const suggestions = []

      // 1. look-up in Bible tables

      const [ translationSuggestions, origLangSuggestions ] = await Promise.all([

        (async () => {

          if(!/[#=]/.test(incompleteQuery)) {  // if NOT restricted to orig language search suggestions (designated by #, =)

            // look-up from words in the designated languages
            let [ x, queryStrProceedingThisWord, lastWord ] = incompleteQuery.match(/^(.*?)([^+~*()"\/. ]*)$/i)
            const lastNakedWord = getNakedWord({ word: lastWord })

            if(lastNakedWord) {

              // TODO: create words table from all _unitWords, like populateWords in biblearc-data (however, make it so I can add or remove versions as the user does so)
              // const words = await models.word.findAll({
              //   where: {
              //     nakedWord: {
              //       [Op.like]: `${lastNakedWord}%`
              //     },
              //     languageId: languageIds,
              //   },
              //   order: [ [ 'numUsagesInAllTexts', 'DESC' ] ],
              //   limit: SUGGESTIONS_LIMIT - suggestions.length,
              // })

              // return words.map(({ nakedWord }) => ({
              //   from: `translation-look-up`,
              //   suggestedQuery: `${queryStrProceedingThisWord}${nakedWord}`,
              //   originalWords: {},
              // }))

            }
          }

          return []

        })(),

        (async () => {

          if(
            /(?:^ )=[^#+~*=[\]\/(). ]+$/i.test(incompleteQuery)  // translated to
            || /#(not:)?lemma:[^#+~*=[\]\/(). ]*$/i.test(incompleteQuery)  // lemma
            || /#(not:)?form:[^#+~*=[\]\/(). ]*$/i.test(incompleteQuery)  // form
            || /#(not:)?[0-9a-z\u0590-\u05FF\u0370-\u03FF\u1F00-\u1FFF]+$|^[\u0590-\u05FF\u0370-\u03FF\u1F00-\u1FFF]+$/i.test(incompleteQuery)  // strongs
          ) {
            return getAutoCompleteSuggestions({ incompleteQuery, languageId: 'eng', SUGGESTIONS_LIMIT })
            // TODO: get languageId from getLocale? (3 -> 2 character codes in session-sync-auth-site/src/iso6393To1)
          }

          return []

        })(),

      ])

      // put them together, returning top hits

      const furtherSuggestions = [
        ...translationSuggestions,
        ...origLangSuggestions,
      ]

      furtherSuggestions.forEach(s => {
        if(!suggestions.some(({ suggestedQuery }) => suggestedQuery === s)) {
          suggestions.push(s)
        }
      })

      if(getIncompleteQuery() === incompleteQuery) {
        setAutoCompleteSuggestion(suggestions.slice(0, SUGGESTIONS_LIMIT))
      }

    },
    [ incompleteQuery, skip ],
  )



  return { autoCompleteSuggestions }
}

export default useDataQueryAutoCompleteSuggestions
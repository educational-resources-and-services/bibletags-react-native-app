// NOTE: There is a similar file (with same name) in bibletags-data

import { containsHebrewChars, stripGreekAccents, stripHebrewVowelsEtc, stripVocalOfAccents } from '@bibletags/bibletags-ui-helper'

import { safelyExecuteSelects, executeSql } from "./toolbox"

const safeifyForLike = str => str.replace(/_/g, ' ').replace(/%/g, '').replace(/"/g, '\\"')

const getStrongsFromQueryStr = str => (str.match(/#[GH][0-9]{5}/g) || []).map(s => s.replace(/^#/, ''))

const getOriginalWordsFromStrongs = async ({ includeHits, strongs, where, languageId, limit }) => {

  const originalWords = {}

  const [ definitions ] = await safelyExecuteSelects([{
    database: `versions/original/ready/definitions`,
    statement: () => (
      strongs
        ? `SELECT * FROM definitions WHERE id IN ?`
        : `SELECT * FROM definitions WHERE ${where} LIMIT ${limit}`
    ),
    args: [
      strongs,
    ],
    jsonKeys: [ 'lxx', 'lemmas', 'forms', 'pos' ],
  }])

  const [ languageSpecificDefinitions ] = await safelyExecuteSelects([{
    database: `${languageId}/languageSpecificDefinitions`,
    statement: () => `SELECT id, gloss FROM languageSpecificDefinitions WHERE id IN ?`,
    args: [
      definitions.map(({ id }) => `${id}-${languageId}`),
    ],
  }])

  const glossByStrongs = {}
  languageSpecificDefinitions.forEach(({ id, gloss }) => {
    glossByStrongs[id.split('-')[0]] = gloss
  })

  definitions.forEach(({ id, lex, hits }) => {
    const gloss = glossByStrongs[id] || ``
    originalWords[id] = { lex, gloss }
    if(includeHits) {
      originalWords[id].hits = hits
    }
  })

  return originalWords

}

const getDefDetailArrayFromProceedingStrongs = async ({ queryStrProceedingDetail, detailType, partialDetail, limit }) => {

  const [ strongDetailOnSameWord ] = queryStrProceedingDetail.split(' ').pop().match(/#[GH][0-9]{5}/) || []
  let detailArray = null

  if(strongDetailOnSameWord) {
    detailArray = []
    const [[ definition ]] = await safelyExecuteSelects([{
      database: `versions/original/ready/definitions`,
      statement: () => `SELECT * FROM definitions WHERE id=?`,
      args: [
        strongDetailOnSameWord.replace(/^#/, ''),
      ],
      jsonKeys: [ 'lxx', 'lemmas', 'forms', 'pos' ],
    }])
    if(definition) {
      detailArray = (
        definition[detailType]
          .filter(detail => stripGreekAccents(stripHebrewVowelsEtc(detail)).toLowerCase().indexOf(partialDetail) === 0)
          .slice(0, limit)
          .map(id => ({ id }))
      )
    }
  }

  return detailArray
}

const getAutoCompleteSuggestions = async ({ incompleteQuery, languageId, SUGGESTIONS_LIMIT }) => {

  const suggestions = []
  const limit = SUGGESTIONS_LIMIT

  // look-up in Bible tables

  if(/(?:^ )=[^#+~*=[\]\/(). ]+$/i.test(incompleteQuery)) {  // translated to
    // TODO

  } else if(/#(not:)?lemma:[^#+~*=[\]\/(). ]*$/i.test(incompleteQuery)) {  // lemma
    // lemmas matching partial naked lemma
    // table: lemmas

    let [ x, queryStrProceedingDetail, negator='', partialDetail ] = incompleteQuery.match(/^(.*)#(not:)?lemma:([^#+~*=[\]\/(). ]*)$/i)
    partialDetail = stripGreekAccents(stripHebrewVowelsEtc(partialDetail)).toLowerCase()

    const [ lemmas, originalWords ] = await Promise.all([
      (async () => {

        let lemmas = await getDefDetailArrayFromProceedingStrongs({ queryStrProceedingDetail, detailType: "lemmas", partialDetail, limit })

        if(!lemmas && partialDetail) {  // i.e. there wasn't a proceeding strongs
          lemmas = (await safelyExecuteSelects([{
            database: `versions/original/ready/search/lemmas`,
            statement: ({ limit }) => `SELECT * FROM lemmas WHERE nakedLemma LIKE ? LIMIT ${limit}`,
            args: [
              `${safeifyForLike(partialDetail)}%`,
            ],
            limit,
          }]))[0]
        }

        return lemmas || []

      })(),
      getOriginalWordsFromStrongs({ strongs: getStrongsFromQueryStr(queryStrProceedingDetail), languageId }),
    ])

    lemmas.forEach(({ id: lemma }) => {
      suggestions.push({
        from: `look-up`,
        suggestedQuery: `${queryStrProceedingDetail}#${negator}lemma:${lemma}`,
        originalWords,
      })
    })

  } else if(/#(not:)?form:[^#+~*=[\]\/(). ]*$/i.test(incompleteQuery)) {  // form
    // forms matching partial naked form
    // table: unitWords

    let [ x, queryStrProceedingDetail, negator='', partialDetail ] = incompleteQuery.match(/^(.*)#(not:)?form:([^#+~*=[\]\/(). ]*)$/i)
    partialDetail = stripGreekAccents(stripHebrewVowelsEtc(partialDetail)).toLowerCase()

    const [ forms, originalWords ] = await Promise.all([
      (async () => {

        let forms = await getDefDetailArrayFromProceedingStrongs({ queryStrProceedingDetail, detailType: "forms", partialDetail, limit })

        if(!forms && partialDetail) {  // i.e. there wasn't a proceeding strongs
          const versionId = containsHebrewChars(partialDetail) ? `uhb` : `ugnt`
          const tableName = `${versionId}UnitWords-form`
          forms = (await safelyExecuteSelects([{
            database: `versions/original/ready/search/${tableName}`,
            statement: ({ limit }) => `SELECT * FROM ${tableName} WHERE id LIKE ? LIMIT ${limit}`,
            args: [
              `verseNumber:form:${safeifyForLike(partialDetail)}%`,
            ],
            limit,
            jsonKeys: [ 'scopeMap' ],
          }]))[0]
        }

        return forms || []

      })(),
      getOriginalWordsFromStrongs({ strongs: getStrongsFromQueryStr(queryStrProceedingDetail), languageId }),
    ])

    forms.forEach(({ id }) => {
      const form = id.replace(/^verseNumber:form:/, '')
      suggestions.push({
        from: `look-up`,
        suggestedQuery: `${queryStrProceedingDetail}#${negator}form:${form}`,
        originalWords,
      })
    })

  } else if(/#(not:)?[0-9a-z\u0590-\u05FF\u0370-\u03FF\u1F00-\u1FFF]+$|^[\u0590-\u05FF\u0370-\u03FF\u1F00-\u1FFF]+$/i.test(incompleteQuery)) {  // strongs

    const [ x, queryStrProceedingDetail, negator='', partialDetail ] = (
      incompleteQuery.match(/^(.*)#(not:)?([0-9a-z\u0590-\u05FF\u0370-\u03FF\u1F00-\u1FFF]+)$/i)
      || incompleteQuery.match(/^()()([\u0590-\u05FF\u0370-\u03FF\u1F00-\u1FFF]+)$/i)
    )
    const previousOrigWordLanguageLetter = (queryStrProceedingDetail.match(/#([GH])[0-9]{5}/) || [])[1]

    let where

    if(/[GH][0-9]+/.test(partialDetail)) {
      // G1 - [G00001], G0001?, G1????
      // G12 - G00012, G0012?, G12???
      // G123 - G00123, G0123?, G123??
      const headLetter = partialDetail[0].toUpperCase()
      const strongsAsInt = parseInt(partialDetail.slice(1), 10)
      where = [
        `id = "${headLetter}${`0000${strongsAsInt}`.slice(-5)}"`,
        `OR`,
        `id LIKE "${headLetter}${`000${strongsAsInt}`.slice(-4)}%"`,
        `OR`,
        `id LIKE "${partialDetail.toUpperCase()}%"`,
      ].join(' ')

    } else if(/[\u0590-\u05FF\u0370-\u03FF\u1F00-\u1FFF]/.test(partialDetail)) {  // Greek or Hebrew
      where = `nakedLex LIKE "${safeifyForLike(stripGreekAccents(stripHebrewVowelsEtc(partialDetail)).toLowerCase())}%"`

    } else {
      where = [
        `simplifiedVocal LIKE "${safeifyForLike(stripVocalOfAccents(partialDetail))}%"`,
      ]
      if(previousOrigWordLanguageLetter) {
        where.push(
          `AND`,
          `id LIKE "${previousOrigWordLanguageLetter}%"`,
        )
      }
      where = where.join(' ')
    }

    const includeHits = (!queryStrProceedingDetail && !negator)

    const [ originalWords, originalWordsForSuggestions ] = await Promise.all([
      getOriginalWordsFromStrongs({ strongs: getStrongsFromQueryStr(queryStrProceedingDetail), languageId }),
      getOriginalWordsFromStrongs({ includeHits, where, languageId, limit }),
    ])

    for(let strongs in originalWordsForSuggestions) {
      const { hits: resultCount, ...originalWordsInfo } = originalWordsForSuggestions[strongs]
      suggestions.push({
        from: `look-up`,
        suggestedQuery: `${queryStrProceedingDetail}#${negator}${strongs}`,
        originalWords: {
          ...originalWords,
          [strongs]: originalWordsInfo,
        },
        ...(!resultCount ? {} : { resultCount }),
      })
    }

  }

  return suggestions

}

export default getAutoCompleteSuggestions
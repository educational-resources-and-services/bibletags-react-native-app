import { getQueryAndFlagInfo, bibleSearch, bibleSearchFlagMap, getInfoOnResultLocs, getWordsHash, isOriginalLanguageSearch } from '@bibletags/bibletags-ui-helper'
import { getRefFromLoc } from '@bibletags/bibletags-versification'

import { safelyExecuteSelects, normalizeVersionId, getVersionInfo, cloneObj } from './toolbox'
import getTagSetsByIds from './getTagSetsById'

const unitWordsCache = {}

const getBibleSearchResults = async ({ downloadedNonOriginalVersionIds, args }) => {

  const { query, flags } = getQueryAndFlagInfo({ ...args, FLAG_MAP: bibleSearchFlagMap })
  const isOrigLanguageSearch = isOriginalLanguageSearch(query)

  let includeVersionIds

  if(isOrigLanguageSearch) {

    // get versions (max: 3)
    includeVersionIds = (flags.include || []).filter(versionId => versionId !== 'variants')
    if(includeVersionIds.length > 3) throw `exceeded maximum number of versions`
    if(includeVersionIds.some(versionId => !downloadedNonOriginalVersionIds.includes(versionId))) throw `include flag has one or more invalid versionIds`

    if(/(?:^| )[^#= ]/.test(query.replace(/["/()*.]/g, ''))) throw `invalid original language search: contains token that doesn't start with # or =`
    if((flags.same || "verse") !== "verse") throw `invalid original language search: cannot use the 'same' flag`

    if(!(flags.in || []).some(inItem => [ 'uhb', 'ugnt', 'lxx' ].includes(inItem))) {
      flags.in = flags.in || []
      if(/#G/.test(query)) {
        flags.in.push('ugnt')
      } else if(/#H/.test(query)) {
        flags.in.push('uhb')
      } else {
        flags.in.push('ugnt')
        flags.in.push('uhb')
      }
    }

  } else {  // translation search

    if(!flags.in) throw `translation search must include 'in' flag`

  }

  const getVersions = async versionIds => versionIds.map(versionId => ({
    ...getVersionInfo(versionId),
    ...(![ 'uhb', 'ugnt' ].includes(versionId) ? {} : {
      id: versionId,
      partialScope: versionId === 'uhb' ? 'ot' : 'nt',
    }),
    // NOTE: I haven't yet decided if the LXX will use its native versification or if I will convert it to original versification.
    // If I do the former, then I will need its proper information returned here.
  }))

  const getUnitWords = async ({ versionId, id, limit }) => {
    const isOriginal = [ 'uhb', 'ugnt' ].includes(versionId)
    const ids = id instanceof Array ? id : [ id ]

    const key = JSON.stringify({ versionId, ids, limit })
    if(unitWordsCache[key]) return cloneObj(unitWordsCache[key])

    const idsByUnitWordsType = {}
    for(let id of ids) {
      const unitWordsType = isOriginal ? id.split(':')[1] : 'translation'

      // if I find an invalid query for this versionId, then just return an empty array
      if(
        (
          versionId === 'ugnt'
          && /^(?:b|h1|h2|h3|h4|h5|isAramaic|k|l|m|n|sh|state|stem|suffixGender|suffixNumber|suffixPerson|v)$/.test(unitWordsType)
        )
        || (
          versionId === 'uhb'
          && /^(?:attribute|case|mood|voice)$/.test(unitWordsType)
        )
      ) return []

      idsByUnitWordsType[unitWordsType] = idsByUnitWordsType[unitWordsType] || []
      idsByUnitWordsType[unitWordsType].push(id)
    }

    const unitWordsResults = await safelyExecuteSelects(
      Object.keys(idsByUnitWordsType).map(unitWordsType => {
        const args = [
          idsByUnitWordsType[unitWordsType].length > 1
            ? idsByUnitWordsType[unitWordsType]
            : idsByUnitWordsType[unitWordsType][0].replace(/([%_\\"])/g, '\\$1').replace(/(.)\*$/g, '$1%'),
        ]
        const dbName = unitWordsType === `translation` ? `unitWords` : `${versionId}UnitWords-${unitWordsType}`
        return {
          database: `versions/${normalizeVersionId(versionId)}/ready/search/${dbName}`,
          statement: ({ limit }) => `SELECT * FROM ${versionId}UnitWords WHERE id ${args[0] instanceof Array ? `IN` : `LIKE`} ? LIMIT ${limit}`,
          args,
          limit,
        }
      })
    )

    unitWordsCache[key] = unitWordsResults.flat()
    return cloneObj(unitWordsCache[key])
  }

  const getUnitRanges = async ({ versionId, ids }) => {
    const tableName = `${versionId}UnitRanges`
    const [ unitRanges ] = await safelyExecuteSelects([{
      database: `versions/${normalizeVersionId(versionId)}/ready/search/${tableName}`,
      statement: () => `SELECT * FROM ${tableName} WHERE id IN ?`,
      args: [
        ids,
      ],
    }])
    return unitRanges
  }

  const getVerses = async ({ versionId, locs }) => {
    const normalizedVersionId = normalizeVersionId(versionId)
    const locsByBookId = {}
    locs.forEach(loc => {
      locsByBookId[getRefFromLoc(loc).bookId] = locsByBookId[getRefFromLoc(loc).bookId] || []
      locsByBookId[getRefFromLoc(loc).bookId].push(loc)
    })
    const versesResults = await safelyExecuteSelects(
      Object.keys(locsByBookId).map(bookIdAsStr => ({
        versionId: normalizedVersionId,
        bookId: parseInt(bookIdAsStr, 10),
        statement: ({ bookId }) => `SELECT * FROM ${normalizedVersionId}VersesBook${bookId} WHERE loc IN ?`,
        args: [
          locsByBookId[bookIdAsStr],
        ],
      }))
    )
    return versesResults.flat()
  }

  const bibleSearchResults = await bibleSearch({
    ...args,
    query,
    flags,
    getVersions,
    getUnitWords,
    getUnitRanges,
    getVerses,
    getTagSetsByIds,
    // doClocking: true,
  })

  if(isOrigLanguageSearch) {

    const tagSetIds = []
    const versionResultsNeedingUsfmByVersionIdAndLoc = {}

    // add on include:[versions] usfm
    await Promise.all(includeVersionIds.map(async versionId => {

      const lookupVersionInfo = getVersionInfo(versionId)

      const { locs, versionResultsNeedingUsfmByLoc } = getInfoOnResultLocs({
        resultsNeedingUsfm: bibleSearchResults.results,
        lookupVersionInfo,
      })
      versionResultsNeedingUsfmByVersionIdAndLoc[versionId] = versionResultsNeedingUsfmByLoc

      const verses = await getVerses({ versionId, locs })

      verses.forEach(({ loc, usfm }) => {
        versionResultsNeedingUsfmByLoc[loc].push({
          versionId,
          usfm,
        })
        tagSetIds.push(`${loc}-${versionId}-${getWordsHash({ usfm, wordDividerRegex: lookupVersionInfo.wordDividerRegex })}`)
      })

    }))

    if(tagSetIds.length > 0) {

      const tagSets = await getTagSetsByIds(tagSetIds)

      tagSets.forEach(tagSet => {
        const [ loc, versionId ] = tagSet.id.split('-')
        const resultObj = versionResultsNeedingUsfmByVersionIdAndLoc[versionId][loc].find(versionResult => versionResult.versionId === versionId)
        resultObj.tagSets = resultObj.tagSets || []
        resultObj.tagSets.push(tagSet)
      })

    }

  }

  return bibleSearchResults

}

module.exports = getBibleSearchResults
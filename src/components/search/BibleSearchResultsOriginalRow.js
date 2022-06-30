import { useEffect, useMemo } from 'react'
import { StyleSheet, View } from "react-native"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"
import { getPiecesFromUSFM, getTextLanguageId, isRTLText } from '@bibletags/bibletags-ui-helper'
import { getCorrespondingRefs, getRefFromLoc } from '@bibletags/bibletags-versification'
import { Divider } from "@ui-kitten/components"

import useBibleSearchResults from '../../hooks/useBibleSearchResults'
import useThemedStyleSets from '../../hooks/useThemedStyleSets'
import { memo, getOriginalVersionInfo, getVersionInfo } from '../../utils/toolbox'

import PassageRef from '../basic/PassageRef'
import Verse from '../basic/Verse'

const displaySettingsOverride = {
  hideNotes: true,
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 15,
    paddingBottom: 10,
  },
  passageRefContainer: {
    lineHeight: 21,
    paddingBottom: 3,
    flexDirection: 'row',
  },
  line: {
    flex: 1,
    alignSelf: 'center',
    marginLeft: 10,
  },
  textContainer: {
    paddingVertical: 3,
  },
  rowPlaceholder: {
    height: 50,
  },
})

const BibleSearchResultsOriginalRow = ({
  searchText,
  index,
  bookId,
  // placeholderHeight,
  // setPlaceholderHeight,

  eva: { style: themedStyle={} },

  myBibleVersions,
}) => {

  const { labelThemedStyle } = useThemedStyleSets(themedStyle)

  const { bibleSearchResult } = useBibleSearchResults({ searchText, myBibleVersions, index })
  const { originalLoc, versionResults=[] } = bibleSearchResult || {}

  // const [ ref, { width, height } ] = useMeasure()

  // useEffect(
  //   () => {
  //     if(index === 0 && height) {
  //       setPlaceholderHeight(height)
  //     }
  //   },
  //   [ setPlaceholderHeight, height, index ],
  // )

  const origWordIdOfHits = useMemo(
    () => {
      if(!versionResults[0]) return []

      const { usfm } = versionResults[0]

      const pieces = getPiecesFromUSFM({
        usfm,
        inlineMarkersOnly: true,
        searchText,
      })

      return pieces.map(word => word.isHit ? word[`x-id`] : null).filter(Boolean)
    },
    [ versionResults, searchText ],
  )

  if(!bibleSearchResult) {
    return (
      <View
        style={styles.rowPlaceholder}
        // $height={placeholderHeight}
      />
    )
  }

  return (
    <View
      style={styles.container}
      // ref={ref}
    >

      <View style={styles.passageRefContainer}>
        <PassageRef
          fromLoc={originalLoc}
          style={labelThemedStyle}
        />
        <Divider style={styles.line} />
      </View>

      {versionResults.map(({ usfm, versionId, tagSets }, idx) => {

        const version = getVersionInfo(versionId) || {}
        const { wordDividerRegex, languageId: preadjustedLanguageId } = version
        const languageId = getTextLanguageId({ languageId: preadjustedLanguageId, bookId })
        const originalVersionInfo = getOriginalVersionInfo(bookId)

        const startRef = getCorrespondingRefs({
          baseVersion: {
            ref: getRefFromLoc(originalLoc),
            info: originalVersionInfo,
          },
          lookupVersionInfo: version,
        })[0]

        const wordNumberInVerseOfHitsByLoc = {}
        if(tagSets) {
          tagSets.forEach(({ id, tags }) => {
            const [ loc ] = id.split('-')
            wordNumberInVerseOfHitsByLoc[loc] = (
              tags
                .map(tag => (
                  tag.o.map(wordIdAndNumber => wordIdAndNumber.split('|')[0]).some(wordId => origWordIdOfHits.includes(wordId))
                    ? tag.t
                    : []
                ))
                .flat()
            )
          })
        }

        return (
          <View
            style={styles.textContainer}
            key={versionId}
            // $isRTL={isRTLText({ languageId, bookId })}
          >
            <Verse
              pieces={
                getPiecesFromUSFM({
                  usfm,
                  inlineMarkersOnly: true,
                  wordDividerRegex,
                  searchText: idx === 0 ? searchText : null,
                  wordNumberInVerseOfHitsByLoc,
                  startRef,
                  splitIntoWords: idx === 0 ? false : true,
                })
              }
              versionId={versionId}
              passageRef={startRef}
              displaySettingsOverride={displaySettingsOverride}
              // searchString={searchString}
              // uiStatus={selected ? "selected" : "unselected"}
              // onTouchStart={onTouchStart}
              // onTouchEnd={onTouchEnd}
              // onPress={onPress}
            />
          </View>
        )
      })}

    </View>
  )
}

const mapStateToProps = ({ myBibleVersions }) => ({
  myBibleVersions,
})

const matchDispatchToProps = dispatch => bindActionCreators({
}, dispatch)

export default memo(connect(mapStateToProps, matchDispatchToProps)(BibleSearchResultsOriginalRow), { name: 'BibleSearchResultsOriginalRow' })
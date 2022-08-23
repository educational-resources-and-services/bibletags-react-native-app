import { useEffect, useState, useMemo } from 'react'
import { StyleSheet, View, Text } from "react-native"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"
import { getPiecesFromUSFM, getTextLanguageId, isRTLText } from '@bibletags/bibletags-ui-helper'
import { getRefFromLoc, getCorrespondingRefs } from '@bibletags/bibletags-versification'
import { Divider } from "@ui-kitten/components"

import useBibleSearchResults from '../../hooks/useBibleSearchResults'
import useVersePieces from '../../hooks/useVersePieces'
import useThemedStyleSets from '../../hooks/useThemedStyleSets'
import { memo, getOriginalVersionInfo, getVersionInfo } from '../../utils/toolbox'

import PassageRef from '../basic/PassageRef'
import CoverAndSpin from '../basic/CoverAndSpin'
import Verse from '../basic/Verse'

const displaySettingsOverride = {
  hideNotes: true,
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 15,
    paddingBottom: 10,
  },
  versionAbbr: {
    marginBottom: 1,
    marginLeft: 6,
    fontSize: 11,
    alignSelf: 'flex-end',
    opacity: .35,
  },
  versionAbbrSelected: {
    opacity: 1,
  },
  loadingContainer: {
    flex: 1,
  },
  passageToVersionAbbrsSpacer: {
    width: 3,
  },
  passageRefContainer: {
    lineHeight: 21,
    // color: ${({ theme }) => theme.palette.grey[500]};
    paddingBottom: 3,
    flexDirection: 'row',
  },
  passageRef: {
    flexShrink: 1,
    alignSelf: 'center',
  },
  line: {
    flex: 1,
    alignSelf: 'center',
    marginLeft: 10,
  },
  textContainer: {
    // direction: ${({ $isRTL }) => $isRTL ? "rtl" : "ltr"};
    paddingVertical: 3,
  },
  rowPlaceholder: {
    // height: ${({ $height }) => $height}px;
  },
})

const BibleSearchResultsTranslationRow = ({
  searchText,
  index,
  bookId,
  placeholderHeight,
  // setPlaceholderHeight,
  goSetPopperInfo,

  eva: { style: themedStyle={} },

  myBibleVersions,
}) => {

  const { labelThemedStyle } = useThemedStyleSets(themedStyle)

  const { bibleSearchResult } = useBibleSearchResults({ searchText, myBibleVersions, index })
  const { originalLoc, versionResults=[] } = bibleSearchResult || {}
  const firstIndexOfVersionResults = versionResults[0] || {}

  const [ selectedIdx, setSelectedIdx ] = useState(0)

  const version = getVersionInfo((versionResults[selectedIdx] || {}).versionId) || {}
  const { wordDividerRegex, languageId: preadjustedLanguageId } = version
  const languageId = getTextLanguageId({ languageId: preadjustedLanguageId, bookId })
  const isRTL = isRTLText({ languageId, bookId })

  let pieces = getPiecesFromUSFM({
    usfm: firstIndexOfVersionResults.usfm || ``,
    inlineMarkersOnly: true,
    wordDividerRegex,
    splitIntoWords: true,
    searchText,
  })

  const refs = useMemo(
    () => (
      (version.id && originalLoc)
        ? (
          getCorrespondingRefs({
            baseVersion: {
              ref: getRefFromLoc(originalLoc),  // Gen 1:1 here for before the result loads
              info: getOriginalVersionInfo(bookId),
            },
            lookupVersionInfo: version,
          })
        )
        : []
    ),
    [ version, originalLoc, bookId ],
  )

  const skip = selectedIdx === 0
  const { pieces: versesPieces } = useVersePieces({
    refs,
    versionId: version.id,
    searchText,
    skip,
  })
  if(!skip) {
    pieces = versesPieces
  }

  // const [ ref, { width, height } ] = useMeasure()
  // const [ heightWithPieces, setHeightWithPieces ] = useState()

  // useEffect(
  //   () => {
  //     if(pieces && height) setHeightWithPieces(height)
  //   },
  //   [ pieces, height ],
  // )

  // useEffect(
  //   () => {
  //     if(index === 0 && heightWithPieces) {
  //       setPlaceholderHeight(heightWithPieces)
  //     }
  //   },
  //   [ index, setPlaceholderHeight, heightWithPieces ],
  // )

  if(!bibleSearchResult) {
    return (
      <View style={styles.rowPlaceholder} $height={placeholderHeight} />
    )
  }

  return (
    <View
      style={styles.container}
      // ref={ref}
      // $height={!pieces && heightWithPieces}
    >

      <View style={styles.passageRefContainer}>

        <Text
          style={styles.passageRef}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          <PassageRef
            fromLoc={originalLoc}
            style={labelThemedStyle}
          />
        </Text>

        <View style={styles.passageToVersionAbbrsSpacer} />

        {versionResults.map(({ versionId }, idx) => (
          <Text
            key={versionId}
            style={[
              styles.versionAbbr,
              idx === selectedIdx ? styles.versionAbbrSelected : null,
            ]}
            onPress={idx === selectedIdx ? null : () => setSelectedIdx(idx)}
          >
            {getVersionInfo(versionId).abbr}
          </Text>
        ))}

        <Divider style={styles.line} />

      </View>

      {!!pieces &&
        <View
          style={styles.textContainer}
          $isRTL={isRTL}
        >
          <Verse
            pieces={pieces}
            versionId={version.id}
            passageRef={refs[0]}
            displaySettingsOverride={displaySettingsOverride}
          />
        </View>
      }

      {!pieces &&
        <View style={styles.loadingContainer}>
          <CoverAndSpin size="small" />
        </View>
      }


    </View>
  )
}

const mapStateToProps = ({ myBibleVersions }) => ({
  myBibleVersions,
})

const matchDispatchToProps = dispatch => bindActionCreators({
}, dispatch)

export default memo(connect(mapStateToProps, matchDispatchToProps)(BibleSearchResultsTranslationRow), { name: 'BibleSearchResultsTranslationRow' })
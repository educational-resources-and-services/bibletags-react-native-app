import { StyleSheet, View, Text } from "react-native"
import { i18n } from "inline-i18n"
import { isOriginalLanguageSearch } from "@bibletags/bibletags-ui-helper"

import { memo } from '../../utils/toolbox'
import useSearchResults from '../../hooks/useSearchResults'
// import useIsLoggedIn from '../../hooks/useIsLoggedIn'

import PassageSearchResultsRow from './PassageSearchResultsRow'
import SearchResultsError from './SearchResultsError'
import BibleSearchResults from './BibleSearchResults'
// import VersionSearchResults from './VersionSearchResults'
import AppItemSearchResults from './AppItemSearchResults'
import HelpItemSearchResults from './HelpItemSearchResults'
import OriginalWordInfo from '../basic/OriginalWordInfo'
import CoverAndSpin from "../basic/CoverAndSpin"

const bibleSearchColumn = {
  flex: 4,
  overflowY: 'auto',
}

const wordInfoColumn = {
  flex: 2,
  overflowY: 'auto',
  // background-color: ${({ theme }) => theme.palette.grey[200]};
  // color: ${({ theme }) => theme.palette.text.primary};  // so that the grey text that accompanies the PassagePopper doesn't affect this container

  // @media (max-width: ${MINIMUM_MEDIUM_WIDTH-1}px) {
  //   flex: none;
  //   order: -1;
  // }
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    width: 1100,
    // maxWidth: '100vw',
    // min-height: min(${({ $minHeight }) => $minHeight}px, calc(100vh - 59px));
    // max-height: min(800px, calc(100vh - 59px));
    alignItems: 'stretch',

    // @media (max-width: ${MINIMUM_MEDIUM_WIDTH-1}px) {
    //   flex-direction: column;
    //   min-height: calc(100vh - 59px);
    //   max-height: none;
    // }
  },
  bibleSearchColumn,
  passageColumn: {
    ...bibleSearchColumn,
    padding: 15,
  },
  wordInfoColumn,
  otherColumn: {
    ...wordInfoColumn,
    // border-left: 1px solid ${({ theme }) => theme.palette.divider};
    paddingVertical: 7,
    paddingHorizontal: 15,
    // color: ${({ theme }) => theme.palette.text.primary};  // so that the grey text that accompanies the PassagePopper doesn't affect this container

    // @media (max-width: ${MINIMUM_MEDIUM_WIDTH-1}px) {
    //   display: none;
    // }
  },

  originalWordInfo: {
    margin: 0,
    // background-color: ${({ theme }) => theme.palette.grey[400]};

    // &:nth-child(2n) {
    //   background-color: ${({ theme }) => theme.palette.grey[300]};
    // }

    // ${({ basicInfoOnly }) => !basicInfoOnly ? `` : `
    //   flex: 0;
    // `}

    // .OriginalWordInfo-RelatedInfo {
    //   background-color: ${({ theme }) => theme.palette.grey[200]};
    // }

    // .OriginalWordInfo-Usage {
    //   background-color: rgb(220 220 220);
    // }

    // .OriginalWordInfo-Vocal {
    //   color: ${({ theme }) => theme.palette.grey[600]};
    // }

    // .OriginalWordInfo-Hash {
    //   color: ${({ theme }) => theme.palette.grey[600]};
    // }

    // .OriginalWordInfo-Hits {
    //   color: ${({ theme }) => theme.palette.grey[600]};
    // }

    // .OriginalLanguageWordSearchMenu-IconButton {
    //   color: black;

    //   :hover {
    //     background-color: rgba(0, 0, 0, 0.1);
    //   }
    // }

    // .OriginalWordInfo-PosGroup {
    //   color: ${({ theme }) => theme.palette.grey[500]};
    // }

    // .OriginalWordInfo-Pos {
    //   color: ${({ theme }) => theme.palette.grey[700]};
    // }

    // .OriginalWordInfo-Lex > span {
    //   color: black;
    // }

  },
})

const AllSearchResults = ({
  searchText,
  closeAndClearSearch,
  goSetPopperInfo,
}) => {

  const {
    foundPassageRef,
    passageInfoLoading,
    passageInfoSets,
    bibleSearchResults,
    includeVersionIds,
    // highlightsAndCount,
    versions,
    appItems,
    helpItems,
  } = useSearchResults({
    searchText,
  })

  // const isLoggedIn = useIsLoggedIn()
  const isOrigLanguageSearch = isOriginalLanguageSearch(searchText)
  const minHeight = ((bibleSearchResults || {}).results || []).length > 5 ? 800 : 500

  const isLoading = (
    isOrigLanguageSearch
      ? bibleSearchResults === undefined
      : (
        passageInfoLoading
        || (!foundPassageRef && bibleSearchResults === undefined)
        || versions === undefined
      )
  )
  if(isLoading) {
    return (
      <View style={styles.container} $minHeight={minHeight}>
        <CoverAndSpin />
      </View>
    )
  }

  const strongsFromSearchText = [ ...new Set(searchText.match(/#(?:[HG][0-9]{5}|[blkm])(?=#| |$)/g) || []) ]

  return (
    <View style={styles.container} $minHeight={minHeight}>

      {foundPassageRef &&
        <View style={styles.passageColumn}>

          {passageInfoSets.map((passageInfo, idx) => (
            <PassageSearchResultsRow
              key={idx}
              {...passageInfo}
              closeAndClearSearch={closeAndClearSearch}
              goSetPopperInfo={goSetPopperInfo}
            />
          ))}

          {passageInfoSets.length === 0 &&
            <SearchResultsError>
              {i18n("Invalid passage reference")}
            </SearchResultsError>
          }

        </View>

      }

      {!foundPassageRef &&
        <View style={styles.passageColumn}>
          <BibleSearchResults
            searchText={searchText}
            {...(bibleSearchResults || {})}
            includeVersionIds={includeVersionIds}
            goSetPopperInfo={goSetPopperInfo}
          />
        </View>
      }

      {isOrigLanguageSearch && strongsFromSearchText.length > 0 &&
        <View style={styles.otherColumn}>
          {strongsFromSearchText.map(strong => (
            <OriginalWordInfo
              style={styles.originalWordInfo}
              key={strong}
              strong={strong}
              basicInfoOnly={strongsFromSearchText.length > 1}
            />
          ))}
        </View>
      }

      {!isOrigLanguageSearch &&
        <View style={styles.otherColumn}>

          {/*
          My Highlights (top 3)
          Alerts (top 2)
          Online Courses
          */}

          {/* {versions.length > 0 &&
            <VersionSearchResults
              versions={versions}
            />
          } */}

          {appItems.length > 0 &&
            <AppItemSearchResults
              suggestions={appItems}
            />
          }

          {helpItems.length > 0 &&
            <HelpItemSearchResults
              suggestions={helpItems}
            />
          }

          {/*
          Shared with me (top 3)
          BSB (top 5)
          */}

          {projectsCount + appItems.length + helpItems.length === 0 &&
            <SearchResultsError>
              {i18n("No other results")}
            </SearchResultsError>
          }

        </View>
      }

    </View>
  )
}

export default memo(AllSearchResults, { name: 'AllSearchResults' })
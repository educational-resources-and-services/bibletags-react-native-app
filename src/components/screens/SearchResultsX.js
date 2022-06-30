import React, { useState, useEffect, useCallback, useRef } from "react"
import { StyleSheet, View, Text, FlatList } from "react-native"
import Constants from "expo-constants"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"
import { i18n } from "inline-i18n"
import { getPiecesFromUSFM, stripHebrewVowelsEtc, normalizeGreek } from "@bibletags/bibletags-ui-helper"

import { logEvent } from "../../utils/analytics"
import { executeSql, escapeLike, getVersionInfo, memo } from "../../utils/toolbox"
import useRouterState from "../../hooks/useRouterState"
import useInstanceValue from "../../hooks/useInstanceValue"

import KeyboardAvoidingView from "../basic/KeyboardAvoidingView"
import SafeLayout from "../basic/SafeLayout"
import SearchResult from "../basic/SearchResult"
import SearchSuggestions from "../basic/SearchSuggestions"
import CoverAndSpin from "../basic/CoverAndSpin"
import SearchHeader from "../major/SearchHeader"

import { recordSearch, setSearchScrollInfo } from "../../redux/actions"

const {
  MAX_RESULTS,
} = Constants.manifest.extra

const styles = StyleSheet.create({
  messageContainer: {
    padding: 20,
    paddingTop: 50,
  },
  message: {
    fontSize: 20,
    textAlign: 'center',
  },
  searchResultsContentContainer: {
    paddingBottom: 20,
  },
  searchResults: {
    flex: 1,
  },
  searchContainer: {
    flex: 1,
  },
})

const defaultTapState = {
  selectedLoc: null,
  selectTapY: 0,
}

const viewabilityConfig = {
  minimumViewTime: 300,
  viewAreaCoveragePercentThreshold: 0,
}

const SearchResultsX = ({
  style,
  
  eva: { style: themedStyle={} },

  recordSearch,
  setSearchScrollInfo,
}) => {

  const {
    // foundPassageRef,
    // passageInfoLoading,
    // passageInfoSets,
    bibleSearchResults,
    includeVersionIds,
    projectsAndCount,
    // highlightsAndCount,
    versions,
    appItems,
    helpItems,
  } = useSearchResults({
    searchText,
  })

  const [ tapState, setTapState ] = useState(defaultTapState)
  const { selectedLoc, selectTapY } = tapState

  const resultsListRef = useRef()
  const scrollInfo = useRef({})
  const skipVerseTap = useRef(false)

  // useEffect(
  //   () => {
  //     const { searchedString } = searchState

  //     if(searchedString && scrollInfo.current.y && resultsListRef.current) {

  //       resultsListRef.current.scrollToOffset({
  //         offset: scrollInfo.current.y,
  //         animated: false,
  //       })

  //     }
  //   },
  //   [ searchState, editing ],
  // )

  // const updateEditedSearchString = useCallback(
  //   searchString => setEditedSearchString(normalizeGreek(stripHebrewVowelsEtc(searchString))),  // Needs to be modified to be version-specific
  //   [],
  // )

  // const onScroll = useCallback(
  //   ({ nativeEvent }) => {
  //     scrollInfo.current.y = nativeEvent.contentOffset.y

  //     setSearchScrollInfo({
  //       scrollInfo: {
  //         y: scrollInfo.current.y,
  //       },
  //     })
  //   },
  //   [],
  // )

  // const onViewableItemsChanged = useCallback(
  //   ({ viewableItems }) => {
  //     if(viewableItems.length === 0) return

  //     scrollInfo.current.numToRender = viewableItems.slice(-1)[0].index + 1

  //     setSearchScrollInfo({
  //       scrollInfo: {
  //         numToRender: scrollInfo.current.numToRender,
  //       },
  //     })
  //   },
  //   [],
  // )

  const renderItem = useCallback(
    ({ item, index }) => {
      const { searchedString, languageId, isOriginal, versionAbbr } = searchState

      const selected = item.loc === selectedLoc

      const clearSelection = () => setTapState(defaultTapState)

      const onTouchStart = () => {
        if(selectedLoc) {
          clearSelection()
          skipVerseTap.current = true
        }
      }
    
      const onTouchEnd = () => skipVerseTap.current = false
    
      const selectLoc = ({ loc, pageY }) => {
        if(skipVerseTap.current) return
  
        setTapState({
          selectedLoc: loc,
          selectTapY: pageY,
        })
      }

      return (
        <SearchResult
          result={item}
          searchString={searchedString}
          languageId={languageId}
          isOriginal={isOriginal}
          versionId={versionId}
          versionAbbr={versionAbbr}
          selected={selected}
          selectTapY={selected ? selectTapY : null}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          onSelect={selectLoc}
          unselect={clearSelection}
        />
      )
    },
    [ searchState, selectedLoc, selectTapY ],
  )

  const keyExtractor = useCallback(item => item.loc, [])

  // const { searchedString, searchedVersionId, searchResults } = searchState

  // const searchDone = searchString === searchedString && versionId === searchedVersionId

  let numberResults = searchDone && searchResults.length
  if(numberResults === MAX_RESULTS) numberResults += '+'

  return (
    <>
      <View style={styles.searchContainer}>
        {!editing && searchDone && searchResults.length === 0 &&
          <View style={styles.messageContainer}>
            <Text 
              style={[
                styles.message,
                themedStyle,
                style,
              ]}
            >
              {i18n("No results found.")}
            </Text>
          </View>
        }
        {!editing && searchDone && searchResults.length > 0 &&
          <FlatList
            data={searchResults}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            extraData={selectedLoc}
            scrollEventThrottle={16}
            onScroll={onScroll}
            viewabilityConfig={viewabilityConfig}
            onViewableItemsChanged={onViewableItemsChanged}
            initialNumToRender={scrollInfo.current.numToRender}
            ref={resultsListRef}
            style={styles.searchResults}
            contentContainerStyle={styles.searchResultsContentContainer}
          />
        }
      </View>
      {!editing && !searchDone && <CoverAndSpin />}
    </>
  )

}

const mapStateToProps = () => ({
  // displaySettings,
})

const matchDispatchToProps = (dispatch, x) => bindActionCreators({
  setSearchScrollInfo,
}, dispatch)

export default memo(connect(mapStateToProps, matchDispatchToProps)(SearchResultsX), { name: 'SearchResultsX' })
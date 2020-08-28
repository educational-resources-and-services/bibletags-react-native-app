import React, { useState, useEffect, useCallback, useRef } from "react"
import { StyleSheet, View, Text, FlatList } from "react-native"
import Constants from "expo-constants"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"
import { i18n } from "inline-i18n"
import { getPiecesFromUSFM } from "bibletags-ui-helper/src/splitting"

import { logEvent } from "../../utils/analytics"
import { stripHebrew, normalizeGreek, executeSql, escapeLike, getVersionInfo, memoStyled } from "../../utils/toolbox"
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
  HEBREW_CANTILLATION_MODE,
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

const Search = ({
  style,
  
  themedStyle,

  recordSearch,
  setSearchScrollInfo,
}) => {

  const { historyAlterStateByRoute, routerState } = useRouterState()
  const { editOnOpen, searchString, initialScrollInfo, versionId } = routerState

  const [ searchState, setSearchState ] = useState({
    searchedString: null,
    searchedVersionId: null,
    searchResults: null,
    languageId: 'eng',
    isOriginal: false,
    versionAbbr: '',
  })

  const [ tapState, setTapState ] = useState(defaultTapState)
  const { selectedLoc, selectTapY } = tapState

  const [ editing, setEditing ] = useState(!!editOnOpen)
  const [ editedSearchString, setEditedSearchString ] = useState(searchString || "")

  const getRouterState = useInstanceValue(routerState)
  const getEditing = useInstanceValue(editing)

  const resultsListRef = useRef()
  const scrollInfo = useRef({})
  const skipVerseTap = useRef(false)

  useEffect(
    () => {
      (async () => {

        const { searchedString, searchedVersionId } = searchState

        if(!searchString) return
        if(searchString === searchedString && versionId === searchedVersionId) return

        // analytics
        const eventName = `Search`
        const properties = {
          SearchString: searchString,
          VersionId: versionId,
        }
        logEvent({ eventName, properties })

        const order = `ORDER BY loc`

        const { rows: { _array: verses } } = await executeSql({
          versionId,
          statement: ({ bookId, limit }) => `SELECT * FROM ${versionId}VersesBook${bookId} WHERE (' ' || search || ' ') LIKE ? ESCAPE '\\' ${order} LIMIT ${limit}`,
          args: [
            `% ${escapeLike(searchString)} %`,
          ],
          limit: MAX_RESULTS,
          removeCantillation: HEBREW_CANTILLATION_MODE === 'remove',
          removeWordPartDivisions: true,
        })

        const { wordDividerRegex, languageId, isOriginal=false, abbr } = getVersionInfo(versionId)

        const searchResults = verses.map(({ usfm, loc }) => ({
          loc,
          pieces: getPiecesFromUSFM({
            usfm: `\\c 1\n${usfm.replace(/\\c ([0-9]+)\n?/g, '')}`,
            inlineMarkersOnly: true,
            wordDividerRegex,
          }),
        }))

        scrollInfo.current = initialScrollInfo || {}

        setSearchState({
          searchedString: searchString,
          searchedVersionId: versionId,
          searchResults,
          languageId,
          isOriginal,
          versionAbbr: abbr,
        })

        if(searchResults.length > 0) {
          recordSearch({
            searchString,
            versionId,
            numberResults: searchResults.length,
          })
        }

      })()
    }
  )

  useEffect(
    () => () => {
      historyAlterStateByRoute('/Read/Search', {
        ...getRouterState(),
        editOnOpen: getEditing(),
        initialScrollInfo: scrollInfo.current,
      })
    },
    [],
  )

  useEffect(
    () => {
      const { searchedString } = searchState

      if(searchedString && scrollInfo.current.y && resultsListRef.current) {

        resultsListRef.current.scrollToOffset({
          offset: scrollInfo.current.y,
          animated: false,
        })

      }
    },
    [ searchState, editing ],
  )

  const updateEditedSearchString = useCallback(
    searchString => setEditedSearchString(normalizeGreek(stripHebrew(searchString))),  // Needs to be modified to be version-specific
    [],
  )

  const onScroll = useCallback(
    ({ nativeEvent }) => {
      scrollInfo.current.y = nativeEvent.contentOffset.y

      setSearchScrollInfo({
        scrollInfo: {
          y: scrollInfo.current.y,
        },
      })
    },
    [],
  )

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }) => {
      if(viewableItems.length === 0) return

      scrollInfo.current.numToRender = viewableItems.slice(-1)[0].index + 1

      setSearchScrollInfo({
        scrollInfo: {
          numToRender: scrollInfo.current.numToRender,
        },
      })
    },
    [],
  )

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
          versionAbbr={versionAbbr}
          selected={selected}
          uiStatus={selected ? "selected" : "unselected"}
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

  const { searchedString, searchedVersionId, searchResults } = searchState

  const searchDone = searchString === searchedString && versionId === searchedVersionId

  let numberResults = searchDone && searchResults.length
  if(numberResults === MAX_RESULTS) numberResults += '+'

  return (
    <KeyboardAvoidingView>
      <SafeLayout>
        <SearchHeader
          editing={editing}
          setEditing={setEditing}
          numberResults={numberResults}
          editedSearchString={editedSearchString}
          updateEditedSearchString={updateEditedSearchString}
        />
        <View style={styles.searchContainer}>
          {editing &&
            <SearchSuggestions
              editedSearchString={editedSearchString}
              updateEditedSearchString={updateEditedSearchString}
              setEditing={setEditing}
            />
          }
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
      </SafeLayout>
    </KeyboardAvoidingView>
  )

}

const mapStateToProps = () => ({
  // displaySettings,
})

const matchDispatchToProps = (dispatch, x) => bindActionCreators({
  recordSearch,
  setSearchScrollInfo,
}, dispatch)

export default memoStyled(connect(mapStateToProps, matchDispatchToProps)(Search), 'Search')
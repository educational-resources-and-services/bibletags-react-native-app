import React, { useState, useEffect, useCallback, useRef } from "react"
import { StyleSheet, View, Text, FlatList } from "react-native"
import Constants from "expo-constants"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"
import { Container, Content } from "native-base"

import { i18n } from "inline-i18n"
import { logEvent } from '../../utils/analytics'
import { stripHebrew, executeSql, escapeLike, getVersionInfo } from "../../utils/toolbox.js"
import { getPiecesFromUSFM } from "bibletags-ui-helper/src/splitting.js"
import useRouterState from "../../hooks/useRouterState"

import SearchResult from '../basic/SearchResult'
import SearchSuggestions from '../basic/SearchSuggestions'
import FullScreenSpin from '../basic/FullScreenSpin'
import SearchHeader from '../major/SearchHeader'
import VersionChooser from '../major/VersionChooser'

import { recordSearch } from "../../redux/actions.js"

const {
  VERSION_CHOOSER_BACKGROUND_COLOR,
  PRIMARY_VERSIONS,
  SECONDARY_VERSIONS,
  MAX_RESULTS,
  HEBREW_CANTILLATION_MODE,
} = Constants.manifest.extra

const ALL_VERSIONS = [...new Set([ ...PRIMARY_VERSIONS, ...SECONDARY_VERSIONS ])]

const styles = StyleSheet.create({
  messageContainer: {
    padding: 20,
    paddingTop: 50,
  },
  message: {
    fontSize: 20,
    textAlign: 'center',
    color: 'rgba(0,0,0,.5)',
  },
  searchResults: {
    paddingBottom: 20,
  },
  searchLowLight: {
    backgroundColor: 'black',
  },
})

const defaultTapState = {
  selectedLoc: null,
  selectTapY: 0,
}

const Search = ({
  displaySettings,

  recordSearch,
}) => {

  const { historyPush, historyReplace, routerState } = useRouterState()
  const { editOnOpen, searchString, versionId } = routerState

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

        const limit = `LIMIT ${MAX_RESULTS}`
        const order = `ORDER BY bookOrdering, loc`

        const { rows: { _array: verses } } = await executeSql({
          versionId,
          statement: `SELECT * FROM ${versionId}Verses WHERE (' ' || search || ' ') LIKE ? ESCAPE '\\' ${order} ${limit}`,
          args: [
            `% ${escapeLike(searchString)} %`,
          ],
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

  const updateVersion = useCallback(
    versionId => {
      historyReplace(null, {
        ...routerState,
        versionId,
      })
    },
    [ routerState ],
  )

  const goVersions = useCallback(() => historyPush("/Versions"), [])

  const updateEditedSearchString = useCallback(
    searchString => setEditedSearchString(stripHebrew(searchString)),  // Needs to be modified to be version-specific
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
    <Container>
      <SearchHeader
        editing={editing}
        setEditing={setEditing}
        numberResults={numberResults}
        editedSearchString={editedSearchString}
        updateEditedSearchString={updateEditedSearchString}
      />
      {editing &&
        <VersionChooser
          versionIds={ALL_VERSIONS}
          update={updateVersion}
          selectedVersionId={versionId}
          backgroundColor={displaySettings.theme === 'low-light' ? 'rgba(64, 62, 62, 1)' : VERSION_CHOOSER_BACKGROUND_COLOR}
          goVersions={goVersions}
        />
      }
      <Content style={displaySettings.theme === 'low-light' ? styles.searchLowLight : {}}>
        {editing &&
          <SearchSuggestions
            editedSearchString={editedSearchString}
            updateEditedSearchString={updateEditedSearchString}
            setEditing={setEditing}
          />
        }
        {!editing && searchDone && searchResults.length === 0 &&
          <View style={styles.messageContainer}>
            <Text style={styles.message}>
              {i18n("No results found.")}
            </Text>
          </View>
        }
        {!editing && searchDone && searchResults.length > 0 &&
          <View style={styles.searchResults}>
            <FlatList
              data={searchResults}
              renderItem={renderItem}
              keyExtractor={keyExtractor}
              extraData={selectedLoc}
            />
          </View>
        }
      </Content>
      {!editing && !searchDone && <FullScreenSpin />}
    </Container>
  )

}

const mapStateToProps = ({ displaySettings }) => ({
  displaySettings,
})

const matchDispatchToProps = (dispatch, x) => bindActionCreators({
  recordSearch,
}, dispatch)

export default connect(mapStateToProps, matchDispatchToProps)(Search)
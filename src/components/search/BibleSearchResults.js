import { useMemo, useCallback, useState, useRef } from 'react'
import { StyleSheet, View, VirtualizedList } from "react-native"
import { i18n } from "inline-i18n"
import { isOriginalLanguageSearch } from "@bibletags/bibletags-ui-helper"

import { memo } from '../../utils/toolbox'

import BibleSearchHeader from './BibleSearchHeader'
import BibleSearchResultsOriginalRow from './BibleSearchResultsOriginalRow'
import BibleSearchResultsTranslationRow from './BibleSearchResultsTranslationRow'
// import BibleSearchResultsBookBreakdown from './BibleSearchResultsBookBreakdown'
import BibleSearchOtherSuggestedQueries from './BibleSearchOtherSuggestedQueries'
import SearchResultsError from './SearchResultsError'
import CoverAndSpin from '../basic/CoverAndSpin'

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flatList: {
    flex: 1,
  },
  flatListContentContainer: {
    minHeight: '100%',
  },
  headerSpacer: {
    height: 20,
  },
})

const keyExtractor = (item, idx) => `key:${idx}`
const getItem = (data, index) => ({ index })
const getItemCount = data => (data || []).length

const viewabilityConfig = {
  waitForInteraction: true,
  minimumViewTime: 300,
  viewAreaCoveragePercentThreshold: 0,
}

const BibleSearchResults = ({
  searchText,
  results,
  rowCountByBookId,
  hitsByBookId,
  otherSuggestedQueries,
  includeVersionIds,
}) => {

  const isOrigLanguageSearch = isOriginalLanguageSearch(searchText)

  const [ visibleRange, setVisibleRange ] = useState({
    startIndex: 0,
    endIndex: 0,
  })

  // const [ placeholderHeight, setPlaceholderHeight ] = useState(80)

  const flatListRef = useRef()

  const Row = isOrigLanguageSearch ? BibleSearchResultsOriginalRow : BibleSearchResultsTranslationRow

  const totalRows = useMemo(
    () => (rowCountByBookId || []).reduce((total, count) => total + count, 0),
    [ rowCountByBookId ],
  )

  const data = useMemo(
    () => Array(totalRows).fill().map((x, idx) => idx),
    [ totalRows ],
  )

  const getBookIdFromIndex = useCallback(
    index => {
      let total = 0
      let bookId
      for(bookId=1; bookId<rowCountByBookId.length; bookId++) {
        total += rowCountByBookId[bookId]
        if(index < total) break
      }
      return bookId
    },
    [ rowCountByBookId ],
  )

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }) => {
      if(viewableItems.length === 0) return

      setVisibleRange({
        startIndex: viewableItems[0].index,
        endIndex: viewableItems.slice(-1)[0].index,
      })
    },
    [ setVisibleRange ],
  )

  const renderItem = useCallback(
    ({ index }) => {
      return (
        <Row
          key={index}
          searchText={searchText}
          index={index}
          bookId={getBookIdFromIndex(index)}
          // placeholderHeight={placeholderHeight}
          // setPlaceholderHeight={setPlaceholderHeight}
        />
      )
    },
    // [ Row, searchText, getBookIdFromIndex, placeholderHeight ],
    [ Row, searchText, getBookIdFromIndex ],
  )

  const ListHeaderComponent = useCallback(() => <View style={styles.headerSpacer} />, [])
  const ListFooterComponent = useCallback(
    () => (
      <BibleSearchOtherSuggestedQueries
        otherSuggestedQueries={otherSuggestedQueries}
      />
    ),
    [],
  )

  if(results === undefined && totalRows !== -1) {
    return <CoverAndSpin />
  }

  if(totalRows === 0) {
    return (
      <SearchResultsError>
        {i18n("No Bible results")}
      </SearchResultsError>
    )
  }

  return (
    <View style={styles.container}>
    
      <BibleSearchHeader
        searchText={searchText}
        includeVersionIds={includeVersionIds}
        totalRows={totalRows}
        hitsByBookId={hitsByBookId}
      />

      <VirtualizedList
        // key={}  // use when they jump to a book?
        data={data}
        renderItem={renderItem}
        extraData={`${totalRows} ${searchText}`}
        keyExtractor={keyExtractor}
        viewabilityConfig={viewabilityConfig}
        onViewableItemsChanged={onViewableItemsChanged}
        getItem={getItem}
        getItemCount={getItemCount}
        initialNumToRender={5}
        maxToRenderPerBatch={1}
        windowSize={3}
        ref={flatListRef}
        style={styles.flatList}
        contentContainerStyle={styles.flatListContentContainer}
        ListHeaderComponent={ListHeaderComponent}
        ListFooterComponent={ListFooterComponent}
      />

      {/* <BibleSearchResultsBookBreakdown
        rowCountByBookId={rowCountByBookId}
        hitsByBookId={hitsByBookId || rowCountByBookId}
        hebrewOrdering={isOrigLanguageSearch}
        visibleRange={visibleRange}
        flatListRef={flatListRef}
        totalRows={totalRows}
      /> */}

    </View>
  )
}

export default memo(BibleSearchResults, { name: 'BibleSearchResults' })
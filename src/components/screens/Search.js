import { useCallback, useState, useMemo, useRef, useLayoutEffect } from 'react'
import { StyleSheet, Text, View } from "react-native"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"
import { TabBar, Tab, Divider } from '@ui-kitten/components'
import { i18n } from "inline-i18n"

import useInstanceValue from '../../hooks/useInstanceValue'
import useAutoCompleteSuggestions from '../../hooks/useAutoCompleteSuggestions'
import useSearchResults from '../../hooks/useSearchResults'
import useRouterState from '../../hooks/useRouterState'
import useThemedStyleSets from '../../hooks/useThemedStyleSets'
import { setRef, setVersionId } from "../../redux/actions"
import { memo } from "../../utils/toolbox"

import SearchHeader from '../major/SearchHeader'
import KeyboardAvoidingView from "../basic/KeyboardAvoidingView"
import SafeLayout from "../basic/SafeLayout"
import SearchTabBible from "../search/SearchTabBible"
// import SearchTabOriginalWord from "../search/SearchTabOriginalWord"
// import SearchTabOther from "../search/SearchTabOther"
// import SearchTabRecent from "../search/SearchTabRecent"
import SearchTabSuggestions from "../search/SearchTabSuggestions"
import SearchTabTips from "../search/SearchTabTips"

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
  },
  tabBarContainer: {
    paddingHorizontal: 15,
    alignSelf: 'center',
    width: '100%',
  },
  tabBar: {
  },
  tabBarIndicator: {
    top: 36,
    height: 2,
    borderRadius: 0,
  },
  tab: {
    paddingTop: 5,
    height: 30,
  },
  tabText: {
    fontWeight: '500',
    fontSize: 13,
  },
  searchTextFieldContainer: {
    minWidth: 400,
    // maxWidth: 100vw;
    minHeight: 0,
    flexShrink: 1,

    // @media (max-width: ${MINIMUM_MEDIUM_WIDTH-1}px) {
    //   min-width: 0;
    //   width: 100vw;
    // }
  },
  linkIconButton: {
    position: 'absolute',
    top: 5,
    right: 5,
  },
})

const Search = ({
  eva: { style: themedStyle={} },

  myBibleVersions,

  setRef,
  setVersionId,
}) => {

  const { altThemedStyleSets } = useThemedStyleSets(themedStyle)
  const [
    dividerThemedStyle={},
  ] = altThemedStyleSets

  const { historyGoBack, historyReplace, routerState } = useRouterState()

  const { searchText } = routerState
  const showSearchResults = !!searchText

  const getRouterState = useInstanceValue(routerState)

  const [ searchTextInComposition, setSearchTextInComposition ] = useState(searchText || "")
  const getSearchTextInComposition = useInstanceValue(searchTextInComposition)

  const { autoCompleteSuggestions, tabAddition } = useAutoCompleteSuggestions({
    searchTextInComposition,
    myBibleVersions,
  })

  const {
    // foundPassageRef,
    // passageInfoLoading,
    // passageInfoSets,
    bibleSearchResults,
    includeVersionIds,
    // highlightsAndCount,
    // versions,
    // appItems,
    // helpItems,
  } = useSearchResults({
    searchText,
    myBibleVersions,

    // TODO: next part is temporary until we allow display of verse in multiple versions
    openPassage: useCallback(({ versionId, ref }) => {
      historyGoBack()
      setVersionId({ versionId })
      setRef({ ref })
    }, []),

  })

  const [ selectedTabIndex, setSelectedTabIndex ] = useState((!searchTextInComposition && !showSearchResults) ? 1 : 0)

  const inputRef = useRef()
  const inputContainerRef = useRef()

  const clearCurrentSearch = useCallback(
    () => {
      if(getRouterState().searchText) {
        historyReplace(null, {
          searchText: ``,
        })
      }
    },
    [ getRouterState, historyReplace ],
  )

  const onChangeText = useCallback(
    newSearchTextInComposition => {

      const oldSearchTextInComposition = getSearchTextInComposition()

      newSearchTextInComposition = (
        newSearchTextInComposition
          .replace(/#h([0-9]{1,5})/g, '#H$1')
          .replace(/#g([0-9]{1,5})/g, '#G$1')
          .replace(/[“”]/g, '"')
          .replace(/[…]/g, '...')
      )

      if(newSearchTextInComposition && !oldSearchTextInComposition) {
        setSelectedTabIndex(0)
      }

      if(newSearchTextInComposition.slice(0, -1) === oldSearchTextInComposition) {  // cursor at very end
        requestAnimationFrame(() => {
          inputContainerRef.current.scrollToEnd()
        })
      }

      setSearchTextInComposition(newSearchTextInComposition)

    },
    [],
  )

  const setEditing = useCallback(
    () => {
      setSearchTextInComposition(getRouterState().searchText || ``)
      clearCurrentSearch()
    },
    [ clearCurrentSearch ],
  )

  const clearSearchTextInComposition = useCallback(
    () => {
      setSearchTextInComposition("")
      clearCurrentSearch()
      inputRef.current.focus()
      setSelectedTabIndex(1)
    },
    [ clearCurrentSearch ],
  )

  const setSearchText = useCallback(
    searchText => {
      historyReplace(null, {
        searchText,
      })
      inputRef.current.blur()
    },
    [ historyReplace ],
  )

  const tabs = useMemo(
    () => {
      if(!showSearchResults) {
        return [
          // {
          //   title: i18n("Recent"),
          //   component: (
          //     <SearchTabRecent />
          //   ),
          // },
          {
            title: i18n("Suggestions"),
            component: (
              <SearchTabSuggestions
                autoCompleteSuggestions={autoCompleteSuggestions}
                setSearchText={setSearchText}
              />
            ),
          },
          {
            title: i18n("Tips"),
            component: (
              <SearchTabTips />
            ),
          },
        ]
      }

      const tabs = [
        {
          title: i18n("Bible"),
          component: (
            <SearchTabBible
              searchText={searchText}
              bibleSearchResults={bibleSearchResults}
              includeVersionIds={includeVersionIds}
            />
          ),
        },
      ]

      return tabs
    },
    [ showSearchResults, autoCompleteSuggestions, setSearchText, searchText, bibleSearchResults, includeVersionIds ],
  )

  const effectiveSelectedTabIndex = selectedTabIndex <= tabs.length - 1 ? selectedTabIndex : 0

  return (
    <KeyboardAvoidingView>
      <SafeLayout>
        <SearchHeader
          editing={!showSearchResults}
          setEditing={setEditing}
          searchText={showSearchResults ? searchText : searchTextInComposition}
          onChangeText={onChangeText}
          setSearchText={setSearchText}
          clearSearchTextInComposition={clearSearchTextInComposition}
          inputRef={inputRef}
          inputContainerRef={inputContainerRef}
          autoCompleteSuggestions={autoCompleteSuggestions}
          tabAddition={tabAddition}
        />

        <View
          style={[
            styles.tabBarContainer,
            {
              maxWidth: tabs.length * 130 + 30,  // 30 for the paddingHorizontal
            },
          ]}
        >
          <TabBar
            key={showSearchResults ? `results` : `editing`}
            style={styles.tabBar}
            indicatorStyle={styles.tabBarIndicator}
            selectedIndex={effectiveSelectedTabIndex}
            onSelect={setSelectedTabIndex}
          >
            {tabs.map(({ title }, idx) => (
              <Tab
                key={idx}
                style={styles.tab}
                title={
                  <Text>
                    <Text style={styles.tabText}>
                      {title}
                    </Text>
                  </Text>
                }
              />
            ))}
          </TabBar>
        </View>

        <Divider style={dividerThemedStyle} />

        {(tabs[effectiveSelectedTabIndex] || {}).component}

      </SafeLayout>
    </KeyboardAvoidingView>
  )
}

const mapStateToProps = ({ myBibleVersions }) => ({
  myBibleVersions,
})

const matchDispatchToProps = dispatch => bindActionCreators({
  setRef,
  setVersionId,
}, dispatch)

export default memo(connect(mapStateToProps, matchDispatchToProps)(Search), { name: 'Search' })
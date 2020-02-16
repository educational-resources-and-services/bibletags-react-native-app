import React, { useCallback } from "react"
import { StyleSheet } from "react-native"
import Constants from "expo-constants"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"

import useRouterState from "../../hooks/useRouterState"

import RecentBookmark from "./RecentBookmark"

import { removeRecentSearch } from "../../redux/actions.js"

const {
  RECENT_SEARCH_BACKGROUND_COLOR,
} = Constants.manifest.extra

const styles = StyleSheet.create({
  textBackground: {
    backgroundColor: RECENT_SEARCH_BACKGROUND_COLOR,
  },
  textBackgroundLowLight: {
    backgroundColor: 'rgba(103, 178, 245, 1)',
  },
})

const RecentSearch = React.memo(({
  searchString,
  versionId,

  displaySettings,

  removeRecentSearch,
}) => {

  const { historyPush } = useRouterState()

  const discard = useCallback(
    () => removeRecentSearch({ searchString }),
    [ searchString ],
  )

  const select = useCallback(
    () => {
      historyPush("/Read/Search", {
        editOnOpen: false,
        searchString,
        versionId,
      })
    },
    [ searchString, versionId ],
  )

  const { theme } = displaySettings

  return (
    <RecentBookmark
      text={searchString}
      style={
        theme === 'low-light'
          ?
            styles.textBackgroundLowLight
          :
            styles.textBackground
      }
      discard={discard}
      select={select}
    />
  )

})

const mapStateToProps = ({ displaySettings }) => ({
  displaySettings,
  // recentSearches,
})

const matchDispatchToProps = dispatch => bindActionCreators({
  removeRecentSearch,
}, dispatch)

export default connect(mapStateToProps, matchDispatchToProps)(RecentSearch)
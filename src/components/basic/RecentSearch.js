import React, { useCallback } from "react"
import { StyleSheet } from "react-native"
import Constants from "expo-constants"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"

import useRouterState from "../../hooks/useRouterState"
import { removeRecentSearch } from "../../redux/actions.js"

import RecentBookmark from "./RecentBookmark"

const {
  RECENT_SEARCH_BACKGROUND_COLOR,
} = Constants.manifest.extra

const styles = StyleSheet.create({
  textBackground: {
    backgroundColor: RECENT_SEARCH_BACKGROUND_COLOR,
  },
})

const RecentSearch = React.memo(({
  searchString,
  versionId,

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

  return (
    <RecentBookmark
      text={searchString}
      style={styles.textBackground}
      discard={discard}
      select={select}
    />
  )

})

const mapStateToProps = () => ({
  // recentSearches,
})

const matchDispatchToProps = dispatch => bindActionCreators({
  removeRecentSearch,
}, dispatch)

export default connect(mapStateToProps, matchDispatchToProps)(RecentSearch)
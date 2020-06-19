import React, { useCallback } from "react"
// import { StyleSheet } from "react-native"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"
import { styled } from "@ui-kitten/components"

import useRouterState from "../../hooks/useRouterState"
import { removeRecentSearch } from "../../redux/actions"

import RecentBookmark from "./RecentBookmark"


const RecentSearch = React.memo(({
  searchString,
  versionId,
  style,
  themedStyle,

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
      style={[
        style,
        themedStyle,
      ]}
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

RecentSearch.styledComponentName = 'RecentSearch'

export default styled(connect(mapStateToProps, matchDispatchToProps)(RecentSearch))
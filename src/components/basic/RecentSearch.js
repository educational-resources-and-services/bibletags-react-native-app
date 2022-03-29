import React, { useCallback } from "react"
// import { StyleSheet } from "react-native"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"

import useRouterState from "../../hooks/useRouterState"
import { removeRecentSearch } from "../../redux/actions"
import { memo } from '../../utils/toolbox'

import RecentBookmark from "./RecentBookmark"


const RecentSearch = ({
  searchString,
  versionId,
  initialScrollInfo,
  style,

  eva: { style: themedStyle={} },

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
        initialScrollInfo,
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

}

const mapStateToProps = () => ({
  // recentSearches,
})

const matchDispatchToProps = dispatch => bindActionCreators({
  removeRecentSearch,
}, dispatch)

export default memo(connect(mapStateToProps, matchDispatchToProps)(RecentSearch), { name: 'RecentSearch' })
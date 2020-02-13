import React from "react"
import { View, StyleSheet, Text } from "react-native"
import { List } from "native-base"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"

import SearchSuggestion from "./SearchSuggestion"

const MAX_SEARCH_RESULTS = 15

// const styles = StyleSheet.create({
// })

const getSearchKey = ({ searchString, versionId }) => `${versionId}:${searchString}`

const SearchSuggestions = React.memo(({
  navigation,
  editedSearchString,
  setEditing,
  updateEditedSearchString,

  history,
}) => {

  const { searchString="" } = navigation.state.params

  const searchKeys = []
  let searchHistory = history.filter(search => {
    if(search.type !== 'search') return false
    
    const searchKey = getSearchKey(search)

    if(searchKeys.includes(searchKey)) {
      return false
    } else {
      searchKeys.push(searchKey)
      return true
    }
  })

  const normalizedEditedSearchString = editedSearchString.toLowerCase().trim()
  if(normalizedEditedSearchString && searchString !== normalizedEditedSearchString) {
    const editedSearchStringWords = normalizedEditedSearchString.split(" ")  // Needs to be modified to be version-specific, as not all languages divide words with spaces
    searchHistory = searchHistory.filter(({ searchString }) => {
      const searchStringWords = searchString.split(" ")  // Needs to be modified to be version-specific, as not all languages divide words with spaces
      return editedSearchStringWords.every(word => searchStringWords.some(w => w.indexOf(word) === 0))
    })
  }

  searchHistory = searchHistory.slice(0, MAX_SEARCH_RESULTS)

  return (
    <List>
      {searchHistory.map(search => (
        <SearchSuggestion
          key={getSearchKey(search)}
          navigation={navigation}
          setEditing={setEditing}
          updateEditedSearchString={updateEditedSearchString}
          {...search}
        />
      ))}
    </List>
  )

})

const mapStateToProps = ({ history }) => ({
  history,
})

const matchDispatchToProps = (dispatch, x) => bindActionCreators({
  // recordSearch,
}, dispatch)

export default connect(mapStateToProps, matchDispatchToProps)(SearchSuggestions)
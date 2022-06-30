import { StyleSheet, ScrollView } from "react-native"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"

import { memo } from "../../utils/toolbox"

import BibleSearchResults from "./BibleSearchResults"

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: 10,
    paddingBottom: 600,
  },
})

const SearchTabBible = ({
  searchText,
  bibleSearchResults,
  includeVersionIds,

  eva: { style: themedStyle={} },
}) => {

  return (
    <BibleSearchResults
      searchText={searchText}
      {...(bibleSearchResults || {})}
      includeVersionIds={includeVersionIds}
    />
  )
}

const mapStateToProps = () => ({
})

const matchDispatchToProps = dispatch => bindActionCreators({
}, dispatch)

export default memo(connect(mapStateToProps, matchDispatchToProps)(SearchTabBible), { name: 'SearchTabBible' })
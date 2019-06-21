import React from "react"
import { Constants } from "expo"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"

import i18n from "../../utils/i18n.js"
import { debounce } from "../../utils/toolbox.js"
import RecentBookmark from "./RecentBookmark"

import { removeRecentSearch } from "../../redux/actions.js"

const {
  RECENT_REF_BACKGROUND_COLOR,
  RECENT_REF_SELECTED_BACKGROUND_COLOR,
} = Constants.manifest.extra

class RecentSearch extends React.PureComponent {

  discard = () => {
    const { searchString, removeRecentSearch } = this.props

    removeRecentSearch({ searchString })
  }

  select = () => {
    const { navigation, searchString, versionId } = this.props

    debounce(
      navigation.navigate,
      "Search",
      {
        editOnOpen: false,
        searchString,
        versionId,
      }
    )
  }

  render() {
    const { searchString, selected } = this.props

    return (
      <RecentBookmark
        selected={selected}
        text={i18n("“{{searchString}}”", { searchString })}
        backgroundColor={selected ? RECENT_REF_SELECTED_BACKGROUND_COLOR : RECENT_REF_BACKGROUND_COLOR}
        discard={this.discard}
        select={this.select}
      />
    )
  }
}

const mapStateToProps = () => ({
  // recentSearches,
})

const matchDispatchToProps = dispatch => bindActionCreators({
  removeRecentSearch,
}, dispatch)

export default connect(mapStateToProps, matchDispatchToProps)(RecentSearch)
import React from "react"
import { StyleSheet, View, Text, Dimensions } from "react-native"
import { Constants } from "expo"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"
import { Container, Content } from "native-base"

import i18n from "../../utils/i18n.js"
import { logEvent } from '../../utils/analytics'
import { unmountTimeouts, executeSql, escapeLike, getVersionInfo, debounce } from "../../utils/toolbox.js"
import { getPiecesFromUSFM } from "bibletags-ui-helper/src/splitting.js"

import SearchResult from '../basic/SearchResult'
import SearchSuggestions from '../basic/SearchSuggestions'
import BackFunction from '../basic/BackFunction'
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
})

class Search extends React.Component {

  constructor(props) {
    super(props)

    const { navigation } = props
    const { editOnOpen } = navigation.state.params

    this.state = {
      editing: !!editOnOpen,
      searchedString: null,
      searchedVersionId: null,
      searchResults: null,
      languageId: 'eng',
      isOriginal: false,
    }
  }

  // componentDidMount() {
  //   AppState.addEventListener('change', this.handleAppStateChange)
  // }

  // componentWillUnmount = () => {
  //   AppState.removeEventListener('change', this.handleAppStateChange)
  //   unmountTimeouts.bind(this)()
  // }

  // handleAppStateChange = currentAppState => {
  //   this.setState({
  //     currentAppState,
  //   })
  // }


  componentDidMount() {
    this.performSearch()
  }

  componentDidUpdate() {
    this.performSearch()
  }

  performSearch = async () => {
    const { navigation, passage, recordSearch } = this.props
    const { searchedString, searchedVersionId } = this.state
    const { searchString, versionId } = navigation.state.params

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

    const { wordDividerRegex, languageId, isOriginal=false } = getVersionInfo(versionId)

    const searchResults = verses.map(({ usfm, loc }) => ({
      loc,
      pieces: getPiecesFromUSFM({
        usfm: `\\c 1\n${usfm.replace(/\\c ([0-9]+)\n?/g, '')}`,
        inlineMarkersOnly: true,
        wordDividerRegex,
      }),
    }))

    this.setState({
      searchedString: searchString,
      searchedVersionId: versionId,
      searchResults,
      languageId,
      isOriginal,
    })

    if(searchResults.length > 0) {
      recordSearch({
        searchString,
        versionId,
        numberResults: searchResults.length,
      })
    }
  }

  setEditing = editing => this.setState({ editing })

  updateVersion = versionId => {
    const { navigation } = this.props

    debounce(
      navigation.setParams,
      {
        ...navigation.state.params,
        versionId,
      },
    )
  }

  render() {

    const { navigation } = this.props
    const { editing, searchedString, searchedVersionId, searchResults, languageId, isOriginal } = this.state

    const { searchString, versionId } = navigation.state.params

    const { width } = Dimensions.get('window')
    const searchDone = searchString === searchedString && versionId === searchedVersionId

    let numberResults = searchDone && searchResults.length
    if(numberResults === MAX_RESULTS) numberResults += '+'

    return (
      <Container>
        <SearchHeader
          editing={editing}
          navigation={navigation}
          setEditing={this.setEditing}
          numberResults={numberResults}
          width={width}  // By sending this as a prop, I force a rerender
        />
        {editing &&
          <VersionChooser
            versionIds={ALL_VERSIONS}
            update={this.updateVersion}
            selectedVersionId={versionId}
            backgroundColor={VERSION_CHOOSER_BACKGROUND_COLOR}
          />
        }
        <Content>
          {editing &&
            <SearchSuggestions
              searchString={searchString}
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
              {searchResults.slice(0,50).map((result, idx) => (
                <SearchResult
                  key={idx}
                  result={result}
                  searchString={searchString}
                  languageId={languageId}
                  isOriginal={isOriginal}
                />
              ))}
            </View>
          }
        </Content>
        {!editing && !searchDone && <FullScreenSpin />}
      </Container>
    )
  }
}

const mapStateToProps = ({ passage }) => ({
  passage,
})

const matchDispatchToProps = (dispatch, x) => bindActionCreators({
  recordSearch,
}, dispatch)

export default connect(mapStateToProps, matchDispatchToProps)(Search)
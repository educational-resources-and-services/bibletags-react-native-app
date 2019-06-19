import React from "react"
import { StyleSheet, View, Text, Dimensions } from "react-native"
import { Constants } from "expo"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"
import { Container, Content } from "native-base"

import i18n from "../../utils/i18n.js"
import { unmountTimeouts, executeSql, escapeLike, getVersionInfo } from "../../utils/toolbox.js"
import { getPiecesFromUSFM } from "bibletags-ui-helper/src/splitting.js"

import SearchResult from '../basic/SearchResult'
import SearchSuggestions from '../basic/SearchSuggestions'
import BackFunction from '../basic/BackFunction'
import FullScreenSpin from '../basic/FullScreenSpin'
import SearchHeader from '../major/SearchHeader'

const {
  APP_BACKGROUND_COLOR,
} = Constants.manifest.extra

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
      searchResults: null,
      languageId: 'eng',
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
    const { navigation, passage } = this.props
    const { searchedString } = this.state
    const { searchString } = navigation.state.params

    const { versionId, parallelVersionId } = passage

    if(!searchString) return
    if(searchString === searchedString) return

    const limit = `LIMIT 50`
    const order = `ORDER BY loc`

    const { rows: { _array: verses } } = await executeSql({
      versionId,
      statement: `SELECT * FROM ${versionId}Verses WHERE (' ' || search || ' ') LIKE ? ESCAPE '\\' ${order} ${limit}`,
      args: [
        `% ${escapeLike(searchString)} %`,
      ],
    })

    const { wordDividerRegex, languageId } = getVersionInfo(versionId)

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
      searchResults,
      languageId,
    })
  }

  setEditing = editing => this.setState({ editing })

  render() {

    const { navigation } = this.props
    const { editing, searchedString, searchResults, languageId } = this.state

    const { searchString } = navigation.state.params

    const { width } = Dimensions.get('window')
    const searchDone = searchString === searchedString

    return (
      <Container>
        <SearchHeader
          editing={editing}
          navigation={navigation}
          setEditing={this.setEditing}
          width={width}  // By sending this as a prop, I force a rerender
        />
        <Content>
          {editing &&
            <SearchSuggestions
              searchString={searchString}
            />
          }
          {!editing && !searchDone &&
            <FullScreenSpin />
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
              {searchResults.map((result, idx) => (
                <SearchResult
                  key={idx}
                  result={result}
                  searchString={searchString}
                  languageId={languageId}
                />
              ))}
            </View>
          }
        </Content>
      </Container>
    )
  }
}

const mapStateToProps = ({ passage }) => ({
  passage,
})

const matchDispatchToProps = (dispatch, x) => bindActionCreators({
  // setXapiConsentShown,
}, dispatch)

export default connect(mapStateToProps, matchDispatchToProps)(Search)
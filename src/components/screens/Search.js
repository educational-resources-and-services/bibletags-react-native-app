import React from "react"
import { StyleSheet, View, Text, Dimensions } from "react-native"
import { Constants } from "expo"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"
import { Container, Content } from "native-base"

import i18n from "../../utils/i18n.js"
import { unmountTimeouts, executeSql, escapeLike, getVersionInfo } from "../../utils/toolbox.js"

import BackFunction from '../basic/BackFunction'
import FullScreenSpin from '../basic/FullScreenSpin'
import SearchHeader from '../major/SearchHeader'

const {
  APP_BACKGROUND_COLOR,
} = Constants.manifest.extra

const contentsStyles = {
}

class Search extends React.Component {

  constructor(props) {
    super(props)

    const { navigation } = props
    const { editOnOpen } = navigation.state.params

    this.state = {
      editing: !!editOnOpen,
      searchResults: null,
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
    const { searchResults } = this.state
    const { searchString } = navigation.state.params

    const { versionId, parallelVersionId } = passage

    if(!searchString) {
      if(searchResults) {
        this.setState({ searchResults: null })
      }
      return
    }

    const { rows: { _array: verses } } = await executeSql({
      versionId,
      statement: `SELECT * FROM ${versionId}Verses WHERE search LIKE ? ESCAPE '\\' LIMIT 50`,
      args: [
        `%${escapeLike(searchString)}%`,
      ],
    })

    const { wordDividerRegex, languageId } = getVersionInfo(versionId)

    console.log('verses', verses)
    // const pieces = getPiecesFromUSFM({
    //   usfm: verses.map(({ usfm }) => usfm).join('\n'),
    //   // usfm: verses.slice(0,3).map(({ usfm }) => usfm).join('\n'),
    //   wordDividerRegex,
    // })

    // this.setState({
    //   pieces,
    //   languageId,
    // })
    // TODO: handle scrollY
  }

  setEditing = editing => this.setState({ editing })

  render() {

    const { navigation } = this.props
    const { editing, searchResults } = this.state

    const { width } = Dimensions.get('window')

    return (
      <Container>
        <SearchHeader
          editing={editing}
          navigation={navigation}
          setEditing={this.setEditing}
          width={width}  // By sending this as a prop, I force a rerender
        />
        <Content>
          <View>
            <Text>Search Results</Text>
          </View>
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
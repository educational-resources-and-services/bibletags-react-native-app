import React from "react"
import { Constants } from "expo"
import { View, Text, StyleSheet } from "react-native"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"

import { executeSql } from '../../utils/toolbox.js'
import { getValidFontName } from "../../utils/bibleFonts.js"
import RecentRef from '../basic/RecentRef'
import RecentSearch from '../basic/RecentSearch'

const {
  DEFAULT_FONT_SIZE,
} = Constants.manifest.extra

const styles = StyleSheet.create({
  container: {
  },
})

class ReadText extends React.PureComponent {

  state = {
    verses: null,
  }

  componentDidMount() {
    this.getText()
  }

  getText = async () => {
    const { versionId, passageRef } = this.props

    const { bookId, chapter } = passageRef

    const { rows: { _array: verses } } = await executeSql({
      versionId,
      statement: `SELECT * FROM ${versionId}Verses WHERE loc LIKE ?`,
      args: [
        `${('0'+bookId).substr(-2)}${('00'+chapter).substr(-3)}%`,
      ],
    })

    this.setState({ verses })
    // TODO: handle scrollY
  }


  render() {
    const { displaySettings } = this.props
    const { verses } = this.state

    const { font, textSize } = displaySettings
    const fontSize = DEFAULT_FONT_SIZE * textSize

    if(!verses) return null

    return (
      <View
        style={styles.container}
      >
        {verses.map(({ loc, usfm, search }) => (
          <Text
            key={loc}
            style={{
              fontSize,
              fontFamily: getValidFontName({ font }),
            }}
          >
            {search}
          </Text>
        ))}
          
        {/* <Text style={{ fontSize, fontFamily: getValidFontName({ font, variant: 'italic' }) }}>italics text2</Text>
        <Text style={{ fontSize, fontFamily: getValidFontName({ font, variant: 'bold' }) }}>bold text2</Text> */}

      </View>
    )
  }
}

const mapStateToProps = ({ displaySettings }) => ({
  displaySettings,
})

const matchDispatchToProps = dispatch => bindActionCreators({
  // setTheme,
}, dispatch)

export default connect(mapStateToProps, matchDispatchToProps)(ReadText)
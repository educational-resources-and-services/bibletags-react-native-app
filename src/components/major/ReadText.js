import React from "react"
import { Constants } from "expo"
import { View, Text, StyleSheet } from "react-native"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"

import { executeSql } from '../../utils/toolbox.js'
import { getValidFontName } from "../../utils/bibleFonts.js"
import RecentRef from '../basic/RecentRef'
import RecentSearch from '../basic/RecentSearch'
import { getPiecesFromUSFM, blockUsfmMarkers, tagInList } from "bibletags-ui-helper/src/splitting.js"
import bibleVersions from '../../../versions.js'

const {
  DEFAULT_FONT_SIZE,
} = Constants.manifest.extra

const viewStyles = StyleSheet.create({
  container: {
  },
  sup: {
    position: "relative",
    top: "-0.3em",
  },
})

const textStyles = StyleSheet.create({
  nd: {
    // fontVariant: "small-caps",
  },
  em: {
    fontStyle: "italic",
  },
  bd: {
    fontWeight: "bold",
  },
  it: {
    fontStyle: "italic",
  },
  bdit: {
    fontWeight: "bold",
    fontStyle: "italic",
  },
  no: {
    // fontVariant: "normal",
    fontStyle: "normal",
    fontWeight: "normal",
  },
  sc: {
    // fontVariant: "small-caps",
  },
  sup: {
    // fontSize: ".83em",
  },
})

const getStyle = ({ tag, styles }) => styles[(tag || "").replace(/^\+/, '')]

class ReadText extends React.PureComponent {

  state = {
    pieces: null,
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

    let wordDividerRegex

    bibleVersions.some(version => {
      if(version.id === versionId) {
        wordDividerRegex = version.wordDividerRegex
      }
    })

    const pieces = getPiecesFromUSFM({
      usfm: verses.map(({ usfm }) => usfm).join('\n'),
      wordDividerRegex,
    })

    this.setState({ pieces })
    // TODO: handle scrollY
  }

  getJSXFromPieces = ({ pieces, verse }) => {
    const { displaySettings } = this.props

    const { font, textSize } = displaySettings
    const fontSize = DEFAULT_FONT_SIZE * textSize
    const displaySettingsStyle = {
      fontSize,
      fontFamily: getValidFontName({ font }),
      // TODO:
      // getValidFontName({ font, variant: 'italic' })
      // getValidFontName({ font, variant: 'bold' })

    }

// only do tags when needed (otherwise, do plain text)
// can there be content and text?
// display verse numbers
// display chapter numbers when in a different chapter
// get all tags working
// speed up

    verse = verse || 1

    return pieces.map((piece, idx) => {
      const { type, tag, text, content, children } = piece

      if(children) {

        let component = (
          <Text
            key={idx}
            style={[
              displaySettingsStyle,
              getStyle({ tag, styles: textStyles }),
            ]}
          >
            {this.getJSXFromPieces({
              pieces: children,
              verse,
            })}
          </Text>
        )

        if(tagInList({ tag, list: blockUsfmMarkers })) {
          component = (
            <View
              key={idx}
              style={[
                displaySettingsStyle,
                getStyle({ tag, styles: viewStyles }),
              ]}
            >
              {component}
            </View>
          )
        }

        return component

      // } else if(type === "word") {

      //   return (
      //     <Text
      //       key={idx}
      //       {getStyle({ tag, styles: textStyles })}
      //     >
      //       {text}
      //     </Text>
      //   )

      } else if(text || content) {

        if(text && !tag) return text

        return (
          <Text
            key={idx}
            style={[
              displaySettingsStyle,
              getStyle({ tag, styles: textStyles }),
            ]}
          >
            {text || content}
          </Text>
        )

      } else {
        return null
      }
    })
  }

  render() {
    const { displaySettings } = this.props
    const { pieces } = this.state

    const { font, textSize } = displaySettings
    const fontSize = DEFAULT_FONT_SIZE * textSize

    if(!pieces) return null

    return (
      <View
        style={viewStyles.container}
      >
        {this.getJSXFromPieces({ pieces })}
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
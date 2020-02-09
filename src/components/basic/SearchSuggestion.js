import React from "react"
import { View, StyleSheet, Text, I18nManager } from "react-native"
import { ListItem, Body } from "native-base"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"

import { debounce, getVersionInfo, isRTLText } from '../../utils/toolbox.js'
import { i18n } from "inline-i18n"

import RelativeTime from "./RelativeTime"

const styles = StyleSheet.create({
  searchString: {
    fontWeight: '700',
    fontSize: 16,
    textAlign: 'left',
  },
  secondLine: {
    flexDirection: 'row',
    marginTop: 2,
  },
  versionAbbr: {
    fontWeight: '400',
    fontSize: 12,
  },
  subtitleView: {
    flex: 1,
  },
  subtitle: {
    color: 'rgba(0, 0, 0, .6)',
    fontSize: 13,
    textAlign: 'left',
  },
  time: {
    fontSize: 13,
  },
  contrast: {
    color: 'black',
  },
  listItem: {
    marginLeft: 0,
    paddingLeft: 16,
  },
  listItemLowLight: {
    borderBottomColor: 'rgba(139, 139, 143, 1)',
    backgroundColor: 'black',
  },
  searchStringLowLight: {
    color: 'white',
  },
  subtitleLowLight: {
    color: 'rgba(145, 145, 145, 1)',
  },
  timeLowLight: {
    color: 'rgba(217, 217, 217, 1)',
  },
})

class SearchSuggestion extends React.PureComponent {

  goSearch = () => {
    const { navigation, searchString, versionId, setEditing, updateEditedSearchString } = this.props

    updateEditedSearchString(searchString)
    setEditing(false)

    debounce(
      navigation.setParams,
      {
        ...navigation.state.params,
        searchString,
        versionId,
        editOnOpen: false,
      },
    )
  }

  render() {
    const { searchString, versionId, lastViewTime, numberResults, displaySettings } = this.props

    const { abbr, languageId } = getVersionInfo(versionId)

    return (
      <ListItem
        style={[
          styles.listItem,
          displaySettings.theme === 'low-light' ? styles.listItemLowLight: null
        ]}
        button={true}
        onPress={this.goSearch}
      >
        <Body>
          <View>
            <Text 
              style={[
                styles.searchString,
                displaySettings.theme === 'low-light' ? styles.searchStringLowLight : null,
              ]}>
              {I18nManager.isRTL ? `\u2067`: `\u2066`}
              {i18n("“{{searchString}}”", {
                searchString: isRTLText({ languageId, searchString }) ? `\u2067${searchString}\u2069` : `\u2066${searchString}\u2069`,
              })}
              {`  `}
              <Text style={styles.versionAbbr}>{abbr}</Text>
            </Text>
          </View>
          <View 
            style={[
              styles.secondLine,
            ]}
          >
            <View style={styles.subtitleView}>
              <Text
                style={[
                  styles.subtitle,
                  displaySettings.theme === 'high-contrast' ? styles.contrast : null,
                  displaySettings.theme === 'low-light' ? styles.subtitleLowLight : null,
                ]}
            >
              {i18n("{{num_results}} result(s)", { num_results: numberResults })}
            </Text>
            </View>
            <View>
              <RelativeTime
                style={[
                  styles.time,
                  displaySettings.theme === 'low-light' ? styles.timeLowLight : null,
                ]}
                time={lastViewTime}
              />
            </View>
          </View>
        </Body>
      </ListItem>
    )
  }
}

const mapStateToProps = ({ displaySettings }) => ({
  displaySettings,
})

const matchDispatchToProps = dispatch => bindActionCreators({
  // setRef,
}, dispatch)

export default connect(mapStateToProps, matchDispatchToProps)(SearchSuggestion)
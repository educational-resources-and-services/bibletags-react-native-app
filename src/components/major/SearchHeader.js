import React from "react"
import { StyleSheet, Text, Dimensions, Platform } from "react-native"
import { Title, Subtitle, Left, Right, Button, Body, Item, Input } from "native-base"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"

import { debounce, getVersionInfo, isRTL } from '../../utils/toolbox.js'
import i18n from "../../utils/i18n.js"
import { RTL } from "../../../language.js"

import AppHeader from "../basic/AppHeader"
import HeaderIcon from "../basic/HeaderIcon"

const styles = StyleSheet.create({
  title: {
    ...(Platform.OS === 'android' ? { textAlign: "left" } : {}),
  },
  subtitle: {
    ...(Platform.OS !== 'android' ? {} : {
      color: 'rgba(255, 255, 255, .65)',
      fontSize: 13,
    }),
  },
  left: {
    width: 46,
    flex: 0,
  },
  right: {
    width: 46,
    flex: 0,
  },
  searchBarLeft: {
    flex: 0,
    marginRight: 10,
  },
  searchBarRight: {
    flex: 0,
  },
  searchString: {
    flexDirection: 'row',
  },
  versionAbbr: {
    fontSize: 12,
  },
  input: {
    ...(RTL ? { textAlign: 'right' } : {}),
  },
  contrast: {
    color: 'black',
  },
})

class SearchHeader extends React.PureComponent {

  updateSearchString = () => {
    const { navigation, setEditing, editedSearchString } = this.props
    
    const searchString = 
      editedSearchString
        .replace(/  +/g, ' ')
        .trim()

    if(searchString === '') return

    setEditing(false)

    debounce(
      navigation.setParams,
      {
        ...navigation.state.params,
        searchString,
        editOnOpen: false,
      },
    )
  }

  onCancel = () => {
    const { navigation, setEditing, updateEditedSearchString } = this.props
    const { searchString } = navigation.state.params

    if(!searchString) {
      this.onBackPress()
      return
    }

    setEditing(false)

    updateEditedSearchString(searchString)
  }

  editSearchString = () => {
    const { setEditing } = this.props

    setEditing(true)
  }

  onBackPress = () => {
    const { navigation } = this.props
    
    debounce(navigation.goBack)
    // debounce(navigation.goBack, navigation.state.params.pageKey)
  }

  render() {
    const { navigation, editing, numberResults, editedSearchString,
            updateEditedSearchString, displaySettings } = this.props

    const { searchString, versionId } = navigation.state.params
    const { abbr, languageId } = getVersionInfo(versionId)

    const { width } = Dimensions.get('window')
    const maxTitleWidth = width - 120

    if(editing) {
      return (
        <AppHeader searchBar rounded>
          <Left style={styles.searchBarLeft}>
            <Button
              transparent
              onPress={this.onBackPress}
            >
              <HeaderIcon name={RTL ? "arrow-forward" : "arrow-back"} />
            </Button>
          </Left>
          <Item>
            <HeaderIcon name="search" />
            <Input
              placeholder={i18n("Search")}
              returnKeyType="search"
              value={editedSearchString}
              onChangeText={updateEditedSearchString}
              onSubmitEditing={this.updateSearchString}
              autoCapitalize="none"
              autoCompleteType="off"
              autoCorrect={true}
              enablesReturnKeyAutomatically={true}
              importantForAutofill="no"
              autoFocus={true}
              selectTextOnFocus={true}
              style={styles.input}
            />
          </Item>
          <Right style={styles.searchBarRight}>
            <Button
              transparent
              onPress={this.onCancel}
            >
              <HeaderIcon name="close" />
            </Button>
          </Right>
        </AppHeader>
      )
    }

    return (
      <AppHeader>
        <Left style={styles.left}>
          <Button
            transparent
            onPress={this.onBackPress}
          >
            <HeaderIcon name={RTL ? "arrow-forward" : "arrow-back"} />
          </Button>
        </Left>
        <Body>
          <Title style={[
            styles.title,
            { width: maxTitleWidth },
          ]}>
            {RTL ? `\u2067`: `\u2066`}
            {i18n("“{{searchString}}”", {
              searchString: isRTL(languageId) ? `\u2067${searchString}\u2069` : `\u2066${searchString}\u2069`,
            })}
            {`  `}
            <Text style={styles.versionAbbr}>{abbr}</Text>
          </Title>
          <Subtitle
            style={[
              styles.subtitle,
              displaySettings.theme === 'high-contrast' ? styles.contrast : null,
            ]}
          >
            {
              numberResults === false
                ? i18n("Searching...")
                : i18n("{{num_results}} result(s)", { num_results: numberResults })
            }
          </Subtitle>
        </Body>
        <Right style={styles.right}>
          <Button
            transparent
            onPress={this.editSearchString}
          >
            <HeaderIcon name="search" />
          </Button>
        </Right>
      </AppHeader>
    )
  }
}

const mapStateToProps = ({ displaySettings }) => ({
  displaySettings,
})

const matchDispatchToProps = dispatch => bindActionCreators({
  // setRef,
}, dispatch)

export default connect(mapStateToProps, matchDispatchToProps)(SearchHeader)

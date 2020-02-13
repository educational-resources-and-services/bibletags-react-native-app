import React, { useCallback } from "react"
import { StyleSheet, Text, Platform, I18nManager } from "react-native"
import { Title, Subtitle, Left, Right, Button, Body, Item, Input } from "native-base"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"

import { debounce, getVersionInfo, isRTLText } from '../../utils/toolbox.js'
import { i18n } from "inline-i18n"
import { useDimensions } from 'react-native-hooks'

import AppHeader from "../basic/AppHeader"
import HeaderIcon from "../basic/HeaderIcon"

const styles = StyleSheet.create({
  title: {
    ...(Platform.OS === 'android' ? { textAlign: "left" } : {}),
  },
  titleLowLight: {
    color: 'rgba(240, 240, 240, 1)',
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
    ...(I18nManager.isRTL ? { textAlign: 'right' } : {}),
  },
  contrast: {
    color: Platform.OS === 'ios' ? 'black' : 'white',
  },
})

const SearchHeader = React.memo(({
  navigation,
  setEditing,
  editedSearchString,
  updateEditedSearchString,
  editing,
  numberResults,

  displaySettings,
}) => {

  const { searchString, versionId } = navigation.state.params

  const updateSearchString = useCallback(
    () => {
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
    },
    [ navigation, setEditing, editedSearchString ],
  )

  const onBackPress = useCallback(
    () => {
      debounce(navigation.goBack)
      // debounce(navigation.goBack, navigation.state.params.pageKey)
    },
    [ navigation ],
  )

  const onCancel = useCallback(
    () => {
      if(!searchString) {
        onBackPress()
        return
      }

      setEditing(false)

      updateEditedSearchString(searchString)
    },
    [ searchString, onBackPress, setEditing, updateEditedSearchString ],
  )

  const editSearchString = useCallback(
    () => setEditing(true),
    [ setEditing ],
  )

  const { abbr, languageId } = getVersionInfo(versionId)

  const { theme } = displaySettings
  const { width } = useDimensions().window
  const maxTitleWidth = width - 120

  if(editing) {
    return (
      <AppHeader searchBar rounded>
        <Left style={styles.searchBarLeft}>
          <Button
            transparent
            onPress={onBackPress}
          >
            <HeaderIcon name={I18nManager.isRTL ? "arrow-forward" : "arrow-back"} />
          </Button>
        </Left>
        <Item>
          <HeaderIcon name="search" />
          <Input
            placeholder={i18n("Search")}
            returnKeyType="search"
            value={editedSearchString}
            onChangeText={updateEditedSearchString}
            onSubmitEditing={updateSearchString}
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
            onPress={onCancel}
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
          onPress={onBackPress}
        >
          <HeaderIcon name={I18nManager.isRTL ? "arrow-forward" : "arrow-back"} />
        </Button>
      </Left>
      <Body>
        <Title style={[
          styles.title,
          theme === 'low-light' ? styles.titleLowLight : null,
          { width: maxTitleWidth },
        ]}>
          {I18nManager.isRTL ? `\u2067`: `\u2066`}
          {i18n("“{{searchString}}”", {
            searchString: isRTLText({ languageId, searchString }) ? `\u2067${searchString}\u2069` : `\u2066${searchString}\u2069`,
          })}
          {`  `}
          <Text style={styles.versionAbbr}>{abbr}</Text>
        </Title>
        <Subtitle
          style={[
            styles.subtitle,
            theme === 'high-contrast' ? styles.contrast : null,
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
          onPress={editSearchString}
        >
          <HeaderIcon name="search" />
        </Button>
      </Right>
    </AppHeader>
  )

})

const mapStateToProps = ({ displaySettings }) => ({
  displaySettings,
})

const matchDispatchToProps = dispatch => bindActionCreators({
  // setRef,
}, dispatch)

export default connect(mapStateToProps, matchDispatchToProps)(SearchHeader)

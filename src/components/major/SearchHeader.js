import React, { useCallback } from "react"
import { StyleSheet, View, Text, I18nManager } from "react-native"
import Constants from "expo-constants"
import { Input } from "@ui-kitten/components"
import { i18n } from "inline-i18n"
import { useDimensions } from "react-native-hooks"

import { getVersionInfo, isRTLText } from "../../utils/toolbox"
import useRouterState from "../../hooks/useRouterState"

import AppHeader from "../basic/AppHeader"
import HeaderIconButton from "../basic/HeaderIconButton"
import Icon from "../basic/Icon"
import VersionChooser from "./VersionChooser"

const {
  PRIMARY_VERSIONS,
  SECONDARY_VERSIONS,
} = Constants.manifest.extra

const ALL_VERSIONS = [...new Set([ ...PRIMARY_VERSIONS, ...SECONDARY_VERSIONS ])]

const styles = StyleSheet.create({
  line1: {
    flexDirection: 'row',
  },
  title: {
    flex: 1,
    justifyContent: 'center',
  },
  titleLine1: {
    fontSize: 16,
    fontWeight: '700',
  },
  titleLine2: {
    fontSize: 11,
    fontWeight: '300',
  },
  searchIcon: {
    position: 'absolute',
    top: 14,
    left: 13,
    zIndex: 1,
    height: 18,
    
  },
  searchContainer: {
    flexDirection: 'row',
    flex: 1,
  },
  versionAbbr: {
    fontSize: 12,
    fontWeight: '400',
  },
  input: {
    flex: 1,
    marginTop: 3,
    ...(I18nManager.isRTL ? { textAlign: 'right' } : {}),
  },
  inputText: {
    paddingLeft: 20,
  },
})

const SearchHeader = React.memo(({
  setEditing,
  editedSearchString,
  updateEditedSearchString,
  editing,
  numberResults,
}) => {

  const { historyPush, historyReplace, historyGoBack, routerState } = useRouterState()
  const { searchString, versionId } = routerState

  const updateSearchString = useCallback(
    () => {
      const searchString = 
        editedSearchString
          .replace(/  +/g, ' ')
          .trim()

      if(searchString === '') return

      setEditing(false)

      historyReplace(null, {
        ...routerState,
        searchString,
        editOnOpen: false,
      })
    },
    [ setEditing, editedSearchString, routerState ],
  )

  const onCancel = useCallback(
    () => {
      if(!searchString) {
        historyGoBack()
        return
      }

      setEditing(false)

      updateEditedSearchString(searchString)
    },
    [ searchString, setEditing, updateEditedSearchString ],
  )

  const editSearchString = useCallback(
    () => setEditing(true),
    [ setEditing ],
  )

  const updateVersion = useCallback(
    versionId => {
      historyReplace(null, {
        ...routerState,
        versionId,
      })
    },
    [ routerState ],
  )

  const goVersions = useCallback(() => historyPush("/Read/Versions"), [])

  const { abbr, languageId } = getVersionInfo(versionId)

  const { width } = useDimensions().window
  const maxTitleWidth = width - 120

  if(editing) {
    return (
      <AppHeader>
        <View>
          <View style={styles.line1}>
            <HeaderIconButton
              name={I18nManager.isRTL ? "md-arrow-forward" : "md-arrow-back"}
              onPress={historyGoBack}
            />
            <View style={styles.searchContainer}>
              <Icon
                style={styles.searchIcon}
                name="md-search"
              />
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
                textStyle={styles.inputText}
              />
            </View>
            <HeaderIconButton
              name="md-close"
              onPress={onCancel}
            />
          </View>
          <VersionChooser
            versionIds={ALL_VERSIONS}
            update={updateVersion}
            selectedVersionId={versionId}
            type="search"
            goVersions={goVersions}
          />
        </View>
      </AppHeader>
    )
  }

  return (
    <AppHeader>
      <HeaderIconButton
        name={I18nManager.isRTL ? "md-arrow-forward" : "md-arrow-back"}
        onPress={historyGoBack}
      />
      <View style={styles.title}>
        <Text style={styles.titleLine1}>
          {I18nManager.isRTL ? `\u2067`: `\u2066`}
          {i18n("“{{searchString}}”", {
            searchString: isRTLText({ languageId, searchString }) ? `\u2067${searchString}\u2069` : `\u2066${searchString}\u2069`,
          })}
          {`  `}
          <Text style={styles.versionAbbr}>{abbr}</Text>
        </Text>
        <Text style={styles.titleLine2}>
          {
            numberResults === false
              ? i18n("Searching...")
              : i18n("{{num_results}} result(s)", { num_results: numberResults })
          }
        </Text>
      </View>
      <HeaderIconButton
        name="md-search"
        onPress={editSearchString}
      />
    </AppHeader>
  )

})

export default SearchHeader

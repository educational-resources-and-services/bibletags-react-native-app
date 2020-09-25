import React, { useCallback, useState, useEffect } from "react"
import { StyleSheet, View, Text, I18nManager, Platform } from "react-native"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"
import { Input } from "@ui-kitten/components"
import { i18n } from "inline-i18n"

import { getVersionInfo, isRTLText } from "../../utils/toolbox"
import useRouterState from "../../hooks/useRouterState"
import useBibleVersions from "../../hooks/useBibleVersions"

import AppHeader from "../basic/AppHeader"
import HeaderIconButton from "../basic/HeaderIconButton"
import Icon from "../basic/Icon"
import VersionChooser from "./VersionChooser"

const styles = StyleSheet.create({
  line1: {
    marginTop: Platform.select({ ios: 1, android: 0 }),
    flexDirection: 'row',
  },
  title: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
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

  myBibleVersions,
}) => {

  const { historyPush, historyReplace, historyGoBack, routerState } = useRouterState()
  const { searchString, versionId } = routerState

  const [ editedVersionId, setEditedVersionId ] = useState(versionId)

  const { versionIds } = useBibleVersions({ myBibleVersions })

  useEffect(
    () => {
      if(versionId !== editedVersionId) {
        setEditedVersionId(versionId)
      }
    },
    [ versionId ],
  )

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
        versionId: editedVersionId,
        initialScrollInfo: {},
        editOnOpen: false,
      })
    },
    [ setEditing, editedSearchString, routerState, editedVersionId ],
  )

  const onCancel = useCallback(
    () => {
      if(!searchString) {
        historyGoBack()
        return
      }

      setEditedVersionId(versionId)
      updateEditedSearchString(searchString)
      setEditing(false)
    },
    [ searchString, setEditing, updateEditedSearchString, versionId ],
  )

  const editSearchString = useCallback(
    () => setEditing(true),
    [ setEditing ],
  )

  const goVersions = useCallback(() => historyPush("/Read/Versions"), [])

  const { abbr, languageId } = getVersionInfo(editedVersionId)

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
            versionIds={versionIds}
            update={setEditedVersionId}
            selectedVersionId={editedVersionId}
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

const mapStateToProps = ({ myBibleVersions }) => ({
  myBibleVersions,
})

const matchDispatchToProps = dispatch => bindActionCreators({
}, dispatch)

export default connect(mapStateToProps, matchDispatchToProps)(SearchHeader)
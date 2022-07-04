import React, { useCallback } from "react"
import { StyleSheet, View, I18nManager, Platform } from "react-native"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"

import { isPhoneSize } from "../../utils/toolbox"
import useRouterState from "../../hooks/useRouterState"
import useInstanceValue from "../../hooks/useInstanceValue"

import AppHeader from "../basic/AppHeader"
import HeaderIconButton from "../basic/HeaderIconButton"
import SearchTextField from "../search/SearchTextField"

const phoneSize = isPhoneSize()

const styles = StyleSheet.create({
  appHeader: {
    borderBottomWidth: 0,
    marginTop: Platform.select({ ios: 2, android: 6 }),
    alignSelf: 'center',
    maxWidth: '100%',
    minHeight: 0,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    zIndex: 1,
  },
  searchContainerTablet: {
    minWidth: 320,
    flexDirection: 'row',
    flexShrink: 1,
    zIndex: 1,
  },
})

const SearchHeader = React.memo(({
  editing,
  setEditing,
  autoFocus,
  searchText,
  onChangeText,
  setSearchText,
  clearSearchTextInComposition,
  inputRef,
  inputContainerRef,
  autoCompleteSuggestions,
  tabAddition,

  myBibleVersions,
}) => {

  const { historyGoBack } = useRouterState()

  const getSearchTextWithTabAddition = useInstanceValue(searchText + tabAddition)

  const onSubmitEditing = useCallback(
    () => {
      const newSearchText = 
        getSearchTextWithTabAddition()
          .replace(/  +/g, ' ')
          .trim()

      if(newSearchText === '') return

      setSearchText(newSearchText)
    },
    [ setSearchText ],
  )

  const hasError = autoCompleteSuggestions.length === 0 && !/^[("]*$/.test(searchText.trim())

  return (
    <AppHeader style={styles.appHeader}>
      <HeaderIconButton
        name={I18nManager.isRTL ? "md-arrow-forward" : "md-arrow-back"}
        onPress={historyGoBack}
      />
      <View
        style={[
          !phoneSize ? styles.searchContainerTablet : styles.searchContainer,
        ]}
      >
        <SearchTextField
          value={searchText}
          onChangeText={onChangeText}
          onSubmitEditing={onSubmitEditing}
          onFocus={setEditing}
          autoFocus={autoFocus}
          inputRef={inputRef}
          uiStatus={hasError ? `error` : (editing ? `editing` : `results`)}
          inputContainerRef={inputContainerRef}
          tabAddition={editing ? tabAddition : ``}
        />
      </View>
      <HeaderIconButton
        name="md-close"  // or "md-undo"
        onPress={clearSearchTextInComposition}
        uiStatus={!searchText ? `disabled` : null}
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
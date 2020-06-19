import React, { useCallback } from "react"
import { StyleSheet, TouchableOpacity, I18nManager, View, Text } from "react-native"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"
import { i18n } from "inline-i18n"
import { getPassageStr } from "bibletags-ui-helper"
import { styled } from "@ui-kitten/components"

import useThemedStyleSets from "../../hooks/useThemedStyleSets"
import { getVersionInfo } from "../../utils/toolbox"
import useRouterState from "../../hooks/useRouterState"

import AppHeader from "../basic/AppHeader"
import HeaderIconButton from "../basic/HeaderIconButton"
import Icon from "../basic/Icon"

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    minHeight: 40,
    height: 40,
    paddingTop: 0,
    marginTop: 26,
    marginHorizontal: 15,
    borderRadius: 4,
    elevation: 4,
    shadowOffset: { width: 0, height: 0 },
    shadowColor: "black",
    shadowOpacity: 0.3,
    shadowRadius: 15,
    borderBottomWidth: 0,
  },
  middle: {
    flex: 1,
    flexDirection: 'row',
  },
  passageAndVersion: {
    paddingRight: 20,
    lineHeight: 40,
  },
  passage: {
    textAlign: 'left',
    fontSize: 14,
    fontWeight: '500',
  },
  version: {
    textAlign: 'left',
    writingDirection: 'ltr',
    fontSize: 11,
  },
  dropdownIcon: {
    position: 'absolute',
    right: 5,
    top: 0,
    height: 16,
    lineHeight: 40,
  },
  search: {
    paddingRight: 8,
  },
  options: {
    paddingLeft: 8,
  },
})

const ReadHeader = React.memo(({
  toggleShowOptions,
  showPassageChooser,
  showingPassageChooser,
  hideStatusBar,
  style,

  themedStyle,
  passage,
}) => {

  const { historyPush } = useRouterState()
  const { baseThemedStyle, altThemedStyleSets } = useThemedStyleSets(themedStyle)
  const [ dropdownIconThemedStyle={} ] = altThemedStyleSets

  const goSearch = useCallback(
    () => {
      historyPush("/Read/Search", {
        editOnOpen: true,
        versionId: passage.versionId,
      })
    },
    [ passage ],
  )

  const openSideMenu = useCallback(() => historyPush("./SideMenu"), [])

  const versionsText = [
    getVersionInfo(passage.versionId).abbr,
    getVersionInfo(passage.parallelVersionId || null).abbr,
  ]
    .filter(val => val)
    .join(i18n(", ", "list separator", {}))
    .toUpperCase()

  return (
    <AppHeader
      hideStatusBar={hideStatusBar}
      style={styles.header}
    >
      <HeaderIconButton
        name="md-menu"
        onPress={openSideMenu}
      />
      <View style={styles.middle}>
        <TouchableOpacity
          onPressIn={showPassageChooser}
        >
          <Text style={styles.passageAndVersion}>
            <Text style={styles.passage}>
              {getPassageStr({
                refs: [
                  passage.ref,
                ],
              })}
            </Text>
            {`  `}
            <Text 
              style={[
                styles.version,
                baseThemedStyle,
                style,
              ]}
            >
              {`${I18nManager.isRTL ? `\u2067` : `\u2066`}${versionsText}`}
            </Text>
          </Text>
          <Icon
            name={showingPassageChooser ? `md-arrow-dropup` : `md-arrow-dropdown`}
            style={[
              styles.dropdownIcon,
              dropdownIconThemedStyle,
              style,
            ]}
          />
        </TouchableOpacity>
      </View>
      <HeaderIconButton
        name="md-search"
        onPress={goSearch}
        style={styles.search}
      />
      <HeaderIconButton
        name="format-size"
        pack="materialCommunity"
        onPress={toggleShowOptions}
        style={styles.options}
      />
    </AppHeader>
  )

})

const mapStateToProps = ({ passage }) => ({
  passage,
})

const matchDispatchToProps = dispatch => bindActionCreators({
  // setRef,
}, dispatch)

ReadHeader.styledComponentName = 'ReadHeader'

export default styled(connect(mapStateToProps, matchDispatchToProps)(ReadHeader))
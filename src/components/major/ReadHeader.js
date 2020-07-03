import React, { useCallback } from "react"
import { StyleSheet, TouchableWithoutFeedback, I18nManager, View, Text } from "react-native"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"
import { i18n } from "inline-i18n"
import { getPassageStr } from "bibletags-ui-helper"
import { styled } from "@ui-kitten/components"

import useThemedStyleSets from "../../hooks/useThemedStyleSets"
import { getVersionInfo } from "../../utils/toolbox"
import useRouterState from "../../hooks/useRouterState"
import { isIPhoneX, iPhoneXInset } from "../../utils/toolbox"

import AppHeader from "../basic/AppHeader"
import GradualFade from "../basic/GradualFade"
import HeaderIconButton from "../basic/HeaderIconButton"
import Icon from "../basic/Icon"

const styles = StyleSheet.create({
  gradualFade: {
    ...StyleSheet.absoluteFillObject,
    bottom: 'auto',
    top: 26,
    zIndex: 2,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    minHeight: 40,
    height: 40,
    paddingTop: 0,
    marginTop: (
      Platform.OS === 'android'
        ? 5
        : (26 + (
          isIPhoneX
            ? iPhoneXInset['portrait'].topInset
            : 0
        ))
    ),
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
    paddingRight: 7,
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
    height: 18,
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
  iconStyle,

  themedStyle,
  passage,
}) => {

  const { historyPush } = useRouterState()
  const { baseThemedStyle, iconThemedStyle } = useThemedStyleSets(themedStyle)

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
    <>
      {isIPhoneX &&
        <GradualFade
          height={iPhoneXInset['portrait'].topInset + 5}
          style={styles.gradualFade}
        />
      }
      <AppHeader
        hideStatusBar={hideStatusBar}
        style={styles.header}
      >
        <HeaderIconButton
          name="md-menu"
          onPress={openSideMenu}
        />
        <TouchableWithoutFeedback
          onPressIn={showPassageChooser}
        >
          <View style={styles.middle}>
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
                iconThemedStyle,
                iconStyle,
              ]}
            />
          </View>
        </TouchableWithoutFeedback>
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
    </>
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
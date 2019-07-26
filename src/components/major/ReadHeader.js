import React from "react"
import { StyleSheet, View, Platform, TouchableOpacity } from "react-native"
import { Title, Subtitle, Left, Icon, Right, Button, Body } from "native-base"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"

import { RTL } from "../../../language.js"
import i18n from "../../utils/i18n.js"
import { isPhoneSize, debounce, getVersionInfo, getToolbarHeight } from '../../utils/toolbox.js'
import { getPassageStr } from "bibletags-ui-helper"

import AppHeader from "../basic/AppHeader"
import HeaderIcon from "../basic/HeaderIcon"

const leftIconsWidth = 50
const rightIconsWidth = 135

const styles = StyleSheet.create({
  body: {
    ...(
      Platform.OS === 'ios' && isPhoneSize() ?
        {
          alignItems: 'flex-start',
          left: (leftIconsWidth - rightIconsWidth) / 2,
        }
        : {}
    ),
    ...(
      Platform.OS === 'android' && isPhoneSize() ?
        {
          marginLeft: -5,
          marginRight: -20,
        }
        : {}
    ),
  },
  title: {
    textAlign: 'left',
  },
  subtitle: {
    textAlign: 'left',
    writingDirection: 'ltr',
    ...(Platform.OS !== 'android' ? {} : {
      color: 'rgba(255, 255, 255, .65)',
      fontSize: 13,
    }),
  },
  titles: {
    paddingRight: 34,
  },
  dropdownIcon: {
    position: 'absolute',
    right: 10,
    top: 0,
    fontSize: Platform.OS === 'ios' ? 18 : 22,
    lineHeight: getToolbarHeight() - (Platform.OS === 'ios' ? 24 : 0) - 6,  // 24 is the height of the status bar; 6 offsets it toward the top more
    ...(Platform.OS === 'ios' ? { color: '#bbbbbb' } : { color: 'rgba(255,255,255,.5)' }),
  },
})

class ReadHeader extends React.PureComponent {

  openDrawer = () => {
    const { navigation } = this.props

    debounce(navigation.openDrawer)
  }

  goSearch = () => {
    const { navigation, passage } = this.props

    debounce(
      navigation.navigate,
      "Search",
      {
        editOnOpen: true,
        versionId: passage.versionId,
      }
    )
  }

  render() {
    let { passage, toggleShowOptions, showPassageChooser,
          showingPassageChooser, hideStatusBar, width } = this.props

    width -= (leftIconsWidth + rightIconsWidth)

    const versionsText = [
      getVersionInfo(passage.versionId).abbr,
      getVersionInfo(passage.parallelVersionId || null).abbr,
    ]
      .filter(val => val)
      .join(i18n(", ", {}, "list separator"))
      .toUpperCase()

    return (
      <AppHeader
        hideStatusBar={hideStatusBar}
      >
        <Left>
          <Button
            transparent
            onPressIn={this.openDrawer}
          >
            <HeaderIcon name="menu" />
          </Button>
        </Left>
        <Body style={[
          styles.body,
          (
            isPhoneSize()
              ? {
                width,
                minWidth: width,
                maxWidth: width,
              }
              : {}
          ),
        ]}>
          <TouchableOpacity
            onPressIn={showPassageChooser}
          >
            <View style={styles.titles}>
              <Title style={styles.title}>
                {getPassageStr({
                  refs: [
                    passage.ref,
                  ],
                })}
              </Title>
              <Subtitle style={styles.subtitle}>
                {`${RTL ? `\u2067` : `\u2066`}${versionsText}`}
              </Subtitle>
              <Icon
                name={showingPassageChooser ? `md-arrow-dropup` : `md-arrow-dropdown`}
                style={styles.dropdownIcon}
              />
            </View>
          </TouchableOpacity>
        </Body>
        <Right>
          <Button
            transparent
            onPressIn={this.goSearch}
          >
            <HeaderIcon name="search" />
          </Button>
          <Button
            transparent
            onPressIn={toggleShowOptions}
          >
            <HeaderIcon name="more" />
          </Button>
        </Right>
      </AppHeader>
    )
  }
}

const mapStateToProps = ({ passage }) => ({
  passage,
})

const matchDispatchToProps = dispatch => bindActionCreators({
  // setRef,
}, dispatch)

export default connect(mapStateToProps, matchDispatchToProps)(ReadHeader)
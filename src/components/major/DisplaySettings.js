import React from "react"
import { Card, CardItem, Icon, Text, View, Switch, Body, ActionSheet } from "native-base"
import { StyleSheet, TouchableWithoutFeedback, Platform, Slider } from "react-native"
import { Constants } from "expo"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"

import i18n from "../../utils/i18n.js"
import { getToolbarHeight } from "../../utils/toolbox.js"
import { bibleFontList } from "../../utils/bibleFonts.js"

import BackFunction from '../basic/BackFunction'

import { setMode, setTextSize, setLineSpacing, setFont, setTheme } from "../../redux/actions.js"

const {
  CHOOSER_SELECTED_BACKGROUND_COLOR,
  CHOOSER_SELECTED_SECONDARY_BACKGROUND_COLOR,
} = Constants.manifest.extra

const styles = StyleSheet.create({
  cover: {
    ...StyleSheet.absoluteFill,
    zIndex: 15,
  },
  options: {
    position: 'absolute',
    top: getToolbarHeight() - 2,
    right: 1,
    minWidth: 230,
    paddingBottom: 15,
    zIndex: 16,
  },
  header: {
    fontWeight: 'bold',
  },
  switch: {
    ...(Platform.OS === 'android' ? { marginLeft: -10 } : {}),
    marginRight: 10,
  },
  dropdownIcon: {
    marginLeft: 10,
    fontSize: 20,
    ...(Platform.OS === 'ios' ? { color: '#bbbbbb' } : {}),
  },
  slider: {
    ...(Platform.OS === 'android' ? { width: 220 } : { width: 200 }),
    height: 30,
    ...(Platform.OS === 'android' ? { marginLeft: -10 } : {}),
  },
})

const themeOptions = [
  {
    id: 'default',
    label: i18n("Default theme"),
  },
  {
    id: 'low-light',
    label: i18n("Low light theme"),
  },
  {
    id: 'high-contrast',
    label: i18n("High contrast theme"),
  },
]

class DisplaySettings extends React.PureComponent {

  constructor(props) {
    super(props)

    const { displaySettings } = props
    const { textSize, lineSpacing } = displaySettings

    this.state = {
      textSize,
      lineSpacing,
    }
  }

  toggleParallelMode = () => {
    const { setMode, displaySettings } = this.props
    const { mode } = displaySettings

    setMode({
      mode: mode === 'parallel' ? 'basic' : 'parallel',
    })
  }

  setTextSize = textSize => {
    const { setTextSize } = this.props

    setTextSize({ textSize })
  }

  setLineSpacing = lineSpacing => {
    const { setLineSpacing } = this.props

    setLineSpacing({ lineSpacing })
  }

  selectFont = () => {
    ActionSheet.show(
      {
        title: i18n("Font"),
        options: bibleFontList,
      },
      this.setFont,
    )
  }

  setFont = idx => {
    const { setFont } = this.props

    if(idx != null) {
      setFont({ font: bibleFontList[idx] })
    }
  }

  selectTheme = () => {
    ActionSheet.show(
      {
        options: themeOptions.map(({ label }) => label),
      },
      this.setTheme,
    )
  }

  setTheme = idx => {
    const { setTheme } = this.props

    if(idx != null) {
      setTheme({ theme: themeOptions[idx].id })
    }
  }

  render() {
    const { hideDisplaySettings, displaySettings } = this.props
    const { textSize, lineSpacing } = this.state

    const { mode, font, theme } = displaySettings

    let currentThemeLabel = themeOptions[0].label
    themeOptions.some(({ id, label }) => {
      if(id === theme) {
        currentThemeLabel = label
        return true
      }
    })

    let currentFontLabel = bibleFontList.includes(font) ? font : bibleFontList[0]

    return (
      <React.Fragment>
        <BackFunction func={hideDisplaySettings} />
        <TouchableWithoutFeedback
          style={styles.cover}
          onPress={hideDisplaySettings}
        >
          <View style={styles.cover} />
        </TouchableWithoutFeedback>
        <Card style={styles.options}>
          <CardItem header>
            <Text style={styles.header}>
              {i18n("Display options")}
            </Text>
          </CardItem>
          <TouchableWithoutFeedback
            onPress={this.toggleParallelMode}
          >
            <CardItem>
              <Switch
                onValueChange={this.toggleParallelMode}
                style={styles.switch}
                trackColor={{
                  true: CHOOSER_SELECTED_SECONDARY_BACKGROUND_COLOR,
                }}
                ios_backgroundColor={CHOOSER_SELECTED_SECONDARY_BACKGROUND_COLOR}
                thumbColor={CHOOSER_SELECTED_BACKGROUND_COLOR}
                value={mode === 'parallel'}
              />
              <Text>{i18n("Parallel mode")}</Text>
            </CardItem>
          </TouchableWithoutFeedback>
          <CardItem>
            <Body>
              <Text>{i18n("Text size")}</Text>
              <Slider
                minimumValue={.3}
                maximumValue={3}
                value={textSize}
                onValueChange={this.setTextSize}
                style={styles.slider}
                minimumTrackTintColor={CHOOSER_SELECTED_BACKGROUND_COLOR}
                maximumTrackTintColor={CHOOSER_SELECTED_SECONDARY_BACKGROUND_COLOR}
                thumbTintColor={CHOOSER_SELECTED_BACKGROUND_COLOR}
              />
            </Body>
          </CardItem>
          {/* <CardItem>
            <Body>
              <Text>{i18n("Line spacing")}</Text>
              <Slider
                minimumValue={1}
                maximumValue={4}
                value={lineSpacing}
                onValueChange={this.setLineSpacing}
                style={styles.slider}
                minimumTrackTintColor={CHOOSER_SELECTED_BACKGROUND_COLOR}
                maximumTrackTintColor={CHOOSER_SELECTED_SECONDARY_BACKGROUND_COLOR}
                thumbTintColor={CHOOSER_SELECTED_BACKGROUND_COLOR}
              />
            </Body>
          </CardItem> */}
          <CardItem button
            onPress={this.selectTheme}
          >
            <Text>
              {currentThemeLabel}
            </Text>
            <Icon
              name="arrow-dropdown"
              style={styles.dropdownIcon}
            />
          </CardItem>
          <CardItem button
            onPress={this.selectFont}
          >
            <Text>
              {currentFontLabel}
            </Text>
            <Icon
              name="arrow-dropdown"
              style={styles.dropdownIcon}
            />
          </CardItem>
        </Card>
      </React.Fragment>
    )
  }
}

const mapStateToProps = ({ displaySettings }) => ({
  displaySettings,
})

const matchDispatchToProps = dispatch => bindActionCreators({
  setMode,
  setTextSize,
  setLineSpacing,
  setFont,
  setTheme,
}, dispatch)

export default connect(mapStateToProps, matchDispatchToProps)(DisplaySettings)
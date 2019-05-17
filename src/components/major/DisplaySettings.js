import React from "react"
import { Card, CardItem, Icon, Text, View, Switch, Body, ActionSheet } from "native-base"
import { StyleSheet, TouchableWithoutFeedback, Platform, Slider } from "react-native"
import { Constants } from "expo"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"

import { getToolbarHeight } from '../../utils/toolbox.js'
import i18n from "../../utils/i18n.js"

import BackFunction from '../basic/BackFunction'

import { setMode, setTextSize, setLineSpacing, setTheme } from "../../redux/actions.js"

const {
  CHOOSER_SELECTED_BACKGROUND_COLOR,
  CHOOSER_SELECTED_SECONDARY_BACKGROUND_COLOR,
} = Constants.manifest.extra

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    top: getToolbarHeight(),
    zIndex: 5,
  },
  cover: {
    ...StyleSheet.absoluteFill,
  },
  options: {
    position: 'absolute',
    top: -2,
    right: 1,
    minWidth: 230,
    paddingBottom: 15,
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
    width: 200,
    height: 30,
    ...(Platform.OS === 'android' ? { marginLeft: -10 } : {}),
    ...(Platform.OS === 'android' ? { marginRight: -10 } : {}),
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

  setTheme = idx => {
    const { setTheme } = this.props

    setTheme({ theme: themeOptions[idx].id })
  }

  render() {
    const { hideDisplaySettings, displaySettings } = this.props
    const { textSize, lineSpacing } = this.state

    const { mode, theme } = displaySettings

    let currentThemeLabel = themeOptions[0].label
    themeOptions.some(({ id, label }) => {
      if(id === theme) {
        currentThemeLabel = label
        return true
      }
    })

    return (
      <View style={styles.container}>
        <BackFunction func={hideDisplaySettings} />
        <TouchableWithoutFeedback
          onPress={hideDisplaySettings}
        >
          <View style={styles.cover}>
          </View>
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
                maximumValue={4}
                value={textSize}
                onSlidingComplete={this.setTextSize}
                style={styles.slider}
                minimumTrackTintColor={CHOOSER_SELECTED_BACKGROUND_COLOR}
                maximumTrackTintColor={CHOOSER_SELECTED_SECONDARY_BACKGROUND_COLOR}
                thumbTintColor={CHOOSER_SELECTED_BACKGROUND_COLOR}
              />
            </Body>
          </CardItem>
          <CardItem>
            <Body>
              <Text>{i18n("Line spacing")}</Text>
              <Slider
                minimumValue={1}
                maximumValue={4}
                value={lineSpacing}
                onSlidingComplete={this.setLineSpacing}
                style={styles.slider}
                minimumTrackTintColor={CHOOSER_SELECTED_BACKGROUND_COLOR}
                maximumTrackTintColor={CHOOSER_SELECTED_SECONDARY_BACKGROUND_COLOR}
                thumbTintColor={CHOOSER_SELECTED_BACKGROUND_COLOR}
              />
            </Body>
          </CardItem>
          <CardItem button
            onPress={() => {
              ActionSheet.show(
                {
                  options: themeOptions.map(({ label }) => label),
                },
                this.setTheme,
              )
            }}
          >
            <Text>
              {currentThemeLabel}
            </Text>
            <Icon
              name="arrow-dropdown"
              style={styles.dropdownIcon}
            />
          </CardItem>
        </Card>
      </View>
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
  setTheme,
}, dispatch)

export default connect(mapStateToProps, matchDispatchToProps)(DisplaySettings)
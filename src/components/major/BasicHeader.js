import React, { useCallback } from "react"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"
import { StyleSheet, Dimensions, Platform, I18nManager } from "react-native"
import { Title, Left, Right, Button, Body } from "native-base"

import AppHeader from "../basic/AppHeader"
import HeaderIcon from "../basic/HeaderIcon"

const styles = StyleSheet.create({
  title: {
    ...(Platform.OS === 'android' ? { textAlign: "left" } : {}),
  },
  lowLight: {
    color: 'rgba(224, 224, 224, 1)',
  },
})

const BasicHeader = React.memo(({
  navigation,
  title,

  displaySettings,
}) => {

  const onBackPress = useCallback(
    () => navigation.goBack(),
    [ navigation ],
  )

  const { theme } = displaySettings

  const { width } = Dimensions.get('window')
  const maxTitleWidth = width - 120

  return (
    <AppHeader>
      <Left>
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
          { width: maxTitleWidth },
          theme === 'low-light' ? styles.lowLight: null,
        ]}>
          {title}
        </Title>
      </Body>
      <Right />
    </AppHeader>
  )

})

const mapStateToProps = ({ displaySettings }) => ({
  displaySettings,
})

const matchDispatchToProps = dispatch => bindActionCreators({
  // setTheme,
}, dispatch)

export default connect(mapStateToProps, matchDispatchToProps)(BasicHeader)

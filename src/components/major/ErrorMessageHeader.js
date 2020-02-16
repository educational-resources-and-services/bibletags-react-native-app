import React, { useCallback } from "react"
import { StyleSheet, Platform } from "react-native"
import { Title, Left, Right, Button, Body } from "native-base"

import { i18n } from "inline-i18n"
import { isPhoneSize } from '../../utils/toolbox.js'
import useRouterState from "../../hooks/useRouterState"

import AppHeader from "../basic/AppHeader"
import HeaderIcon from "../basic/HeaderIcon"

const styles = StyleSheet.create({
  title: {
    ...(Platform.OS === 'ios' && isPhoneSize() ? { marginLeft: -50, left: -20 } : {}),
  },
})

const ErrorMessageHeader = React.memo(() => {

  const { historyGoBack, routerState } = useRouterState()
  const { title, critical } = routerState
  
  return (
    <AppHeader>
      <Left>
        {!critical &&
          <Button
            transparent
            onPress={historyGoBack}
          >
            <HeaderIcon name="arrow-back" />
          </Button>
        }
      </Left>
      <Body>
        <Title style={styles.title}>{title || i18n("Error")}</Title>
      </Body>
      <Right />
    </AppHeader>
  )

})

export default ErrorMessageHeader

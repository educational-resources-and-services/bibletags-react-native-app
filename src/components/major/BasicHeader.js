import React from "react"
import { StyleSheet, I18nManager, Text } from "react-native"

import useRouterState from "../../hooks/useRouterState"

import AppHeader from "../basic/AppHeader"
import HeaderIconButton from "../basic/HeaderIconButton"

const styles = StyleSheet.create({
  title: {
    fontSize: 17,
    alignSelf: 'center',
    flex: 1,
    paddingRight: 15,
    textAlign: 'left',  // needed so that it is flipped to right when rtl
    maxHeight: 30,
  },
})

const BasicHeader = React.memo(({
  title,
  extraButtons,
  disableBack,
}) => {

  const { historyGoBack } = useRouterState()

  return (
    <AppHeader>
      <HeaderIconButton
        name={I18nManager.isRTL ? "md-arrow-forward" : "md-arrow-back"}
        onPress={historyGoBack}
        uiStatus={disableBack ? `disabled` : `unselected`}
        disabled={!!disableBack}
      />
      <Text
        style={styles.title}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {title}
      </Text>
      {extraButtons}
    </AppHeader>
  )

})

export default BasicHeader

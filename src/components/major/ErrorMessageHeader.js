import React from "react"
import { StyleSheet, Platform, View, Text } from "react-native"
import { Button } from "@ui-kitten/components"
import { i18n } from "inline-i18n"

// import { isPhoneSize } from '../../utils/toolbox'
import useRouterState from "../../hooks/useRouterState"

import AppHeader from "../basic/AppHeader"
import Icon from "../basic/Icon"

const styles = StyleSheet.create({
  title: {
  },
})

const ErrorMessageHeader = React.memo(() => {

  const { historyGoBack, routerState } = useRouterState()
  const { title, critical } = routerState
  
  return (
    <AppHeader>
      <View>
        {!critical &&
          <Button
            transparent
            onPress={historyGoBack}
          >
            <Icon name="arrow-back" />
          </Button>
        }
      </View>
      <View>
        <Text style={styles.title}>
          {title || i18n("Error")}
        </Text>
      </View>
      <View />
    </AppHeader>
  )

})

export default ErrorMessageHeader

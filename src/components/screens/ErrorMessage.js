import React, { useEffect } from "react"
import { Updates } from "expo"
import { StyleSheet, View, Text } from "react-native"
import { i18n } from "inline-i18n"

import useSetTimeout from "../../hooks/useSetTimeout"
import useRouterState from "../../hooks/useRouterState"

import SafeLayout from "../basic/SafeLayout"
import ErrorMessageHeader from "../major/ErrorMessageHeader"

const styles = StyleSheet.create({
  body: {
    padding: 15,
    width: '100%',
  },
})

const ErrorMessage = () => {

  const { routerState } = useRouterState()
  const { message, critical } = routerState

  const [ setReloadTimeout ] = useSetTimeout()

  useEffect(
    () => {
      if(critical) {
        setReloadTimeout(Updates.reload, 5000)
      }
    },
    [],
  )

  return (
    <SafeLayout>
      <ErrorMessageHeader />
      <View style={styles.body}>
        <Text>
          {message || (
            critical
              ? i18n("There was a critical error. The app will reload in a few seconds. Please contact us if you continue to receive this message.")
              : i18n("There was an unknown error. Please contact us if you continue to receive this message.")
          )}
        </Text>
      </View>
    </SafeLayout>
  )

}

export default ErrorMessage

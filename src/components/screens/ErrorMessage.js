import React from "react"
import { Updates } from "expo"
import { StyleSheet, View } from "react-native"
import { Container, Content, Body, Text } from "native-base"

import { i18n } from "inline-i18n"
import useSetTimeout from "../../hooks/useSetTimeout"

import ErrorMessageHeader from "../major/ErrorMessageHeader"

const styles = StyleSheet.create({
  body: {
    padding: 15,
    width: '100%',
  },
  view: {
    width: '100%',
  },
})

const ErrorMessage = ({ navigation }) => {

  const [ setReloadTimeout ] = useSetTimeout()
  const { message, critical } = navigation.state.params || {}

  useEffect(
    () => {
      if(critical) {
        setReloadTimeout(Updates.reload, 5000)
      }
    },
    [],
  )

  return (
    <Container>
      <ErrorMessageHeader navigation={navigation} />
      <Content>
        <Body style={styles.body}>
          <View style={styles.view}>
            <Text>{message || (
              critical
                ? i18n("There was a critical error. The app will reload in a few seconds. Please contact us if you continue to receive this message.")
                : i18n("There was an unknown error. Please contact us if you continue to receive this message.")
            )}</Text>
          </View>
        </Body>
      </Content>
    </Container>
  )

}

export default ErrorMessage

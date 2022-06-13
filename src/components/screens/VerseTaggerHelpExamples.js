import React from "react"
import { StyleSheet, ScrollView, View, Text } from "react-native"
import { i18n } from "inline-i18n"

import { memo } from "../../utils/toolbox"

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  body: {
    paddingTop: 20,
    paddingBottom: 400,
    paddingHorizontal: 20,
    width: '100%',
  },
  intro: {
    marginBottom: 7,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingTop: 70,
  },
})

const VerseTaggerHelpExamples = ({
  style,

  eva: { style: themedStyle={} },
}) => {

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.body}
    >

      <Text style={styles.intro}>
        Coming soon...
      </Text>

    </ScrollView>
  )

}

export default memo(VerseTaggerHelpExamples, { name: 'VerseTaggerHelpExamples' })

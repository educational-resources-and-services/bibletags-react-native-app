import React from "react"
import { StyleSheet, ScrollView, Text } from "react-native"

import SafeLayout from "../src/components/basic/SafeLayout"
import BasicHeader from "../src/components/major/BasicHeader"

const styles = StyleSheet.create({
  container: {
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  question: {
    fontWeight: 'bold',
  },
  answer: {
    marginTop: 10,
    marginBottom: 20,
  },
  i: {
    fontStyle: 'italic',
  },
})

const FAQ = () => (
  <SafeLayout>

    <BasicHeader
      title="FAQ"
    />

    <ScrollView contentContainerStyle={styles.container}>

      <Text style={styles.question}>
        [ Question 1 ]
      </Text>
      <Text style={styles.answer}>
        [ Answer 1 ]
      </Text>

      <Text style={styles.question}>
        [ Question 2 ]
      </Text>
      <Text style={styles.answer}>
        [ Answer 2 ]
      </Text>

      <Text style={styles.question}>
        [ Question 3 ]
      </Text>
      <Text style={styles.answer}>
        [ Answer 3 ]
      </Text>

    </ScrollView>

  </SafeLayout>
)

export default FAQ
import React from "react"
import { StyleSheet, Text } from "react-native"

const styles = StyleSheet.create({
  container: {
    paddingVertical: 15,
    paddingHorizontal: 18,
  },
  morph: {
    color: 'white',
  },
})

const Parsing = ({
  selectedWordInfo,
}) => {

  const { morph } = selectedWordInfo || {}

  return (
    <Text style={styles.container}>
      <Text style={styles.morph}>
        {morph}
      </Text>
    </Text>
  )

}

export default Parsing
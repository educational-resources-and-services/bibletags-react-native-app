import React from "react"
import { ScrollView, StyleSheet, Text } from "react-native"

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderColor: 'rgba(0, 0, 0, .15)',
    borderTopWidth: 1,
  },
  content: {
    paddingVertical: 15,
    paddingHorizontal: 18,
  },
})

const ExtendedDefinition = ({
  lexEntry,
  syn,
  rel,
  lemmas,
  morphLemma,
  forms,
  onContentSizeChange,
}) => {

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      onContentSizeChange={onContentSizeChange}
    >
      <Text>
      </Text>
    </ScrollView>
  )

}

export default ExtendedDefinition
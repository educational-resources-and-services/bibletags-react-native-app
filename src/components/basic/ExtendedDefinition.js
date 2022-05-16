import React from "react"
import { ScrollView, StyleSheet, Text } from "react-native"

import { memo } from "../../utils/toolbox"

import IPhoneXBuffer from "./IPhoneXBuffer"

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  doIPhoneBuffer,

  eva: { style: themedStyle={} },
}) => {

  return (
    <ScrollView
      style={[
        styles.container,
        themedStyle,
      ]}
      contentContainerStyle={styles.content}
      onContentSizeChange={onContentSizeChange}
    >
      <Text>
      </Text>

      {doIPhoneBuffer &&
        <IPhoneXBuffer
          extraSpace={true}
        />
      }
    </ScrollView>
  )

}

export default memo(ExtendedDefinition, { name: 'ExtendedDefinition' })
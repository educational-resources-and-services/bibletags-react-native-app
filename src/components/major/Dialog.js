import React from "react"
import { Modal } from "@ui-kitten/components"
import { StyleSheet, Text, View, ScrollView } from "react-native"
import { i18n } from "inline-i18n"
import { Button } from "@ui-kitten/components"
import { useDimensions } from "@react-native-community/hooks"

import useThemedStyleSets from "../../hooks/useThemedStyleSets"
import useBack from "../../hooks/useBack"
import { memo } from '../../utils/toolbox'

const styles = StyleSheet.create({
  container: {
    elevation: 4,
    shadowOffset: { width: 0, height: 0 },
    shadowColor: "black",
    shadowOpacity: 0.3,
    shadowRadius: 15,
    backgroundColor: "white",
    padding: 15,
  },
  title: {
    fontWeight: '600',
    fontSize: 15,
    marginBottom: 15,
    textAlign: 'left',
  },
  line: {
    marginTop: 15,
    fontSize: 15,
  },
  firstLine: {
    marginTop: 0,
  },
  buttonContainer: {
    flexDirection: "row",
    marginHorizontal: -5,
  },
  button: {
    marginHorizontal: 5,
    marginTop: 25,
    flex: 1,
  },
})

const Dialog = ({
  title=i18n("Confirm"),
  message,
  children,
  buttons=[],
  goHide,
  style,
  labelStyle,

  eva: { style: themedStyle={} },

  ...otherProps
}) => {
  
  const { baseThemedStyle, labelThemedStyle } = useThemedStyleSets(themedStyle)

  const { width, height } = useDimensions().window

  useBack(goHide)

  const messageArray = message instanceof Array ? message : [ message ].filter(Boolean)

  return (
    <Modal
      backdropStyle={styles.cover}
      style={{
        maxWidth: parseInt(width * .9, 10),
        maxHeight: parseInt(height * .85, 10),
        minWidth: 240,
      }}
      onBackdropPress={goHide}
      visible={true}
      {...otherProps}
    >
      <View style={styles.container}>

        <Text
          style={[
            styles.title,
            labelThemedStyle,
            labelStyle,
          ]}
        >
          {title}
        </Text>

        <ScrollView 
          contentContainerStyle={[
            styles.contentContainerStyle,
            baseThemedStyle,
            style,
          ]}
          alwaysBounceVertical={false}
        >

          {messageArray.map((line, idx) => (
            <Text
              key={idx}
              style={[
                styles.line,
                (idx === 0 ? styles.firstLine : null),
              ]}
            >
              {line}
            </Text>
          ))}

          {children}

          <View style={styles.buttonContainer}>
            {buttons.map(({ label=i18n("Okay"), ...button }, idx) => (
              <Button
                key={idx}
                onPress={goHide}
                children={
                  <Text
                    numberOfLines={1}
                    ellipsizeMode="clip"
                  >
                    {label}
                  </Text>
                }
                status='info'
                style={styles.button}
                {...button}
              />
            ))}
          </View>

        </ScrollView>
      </View>
    </Modal>
  )

}

export default memo(Dialog, { name: 'Dialog' })
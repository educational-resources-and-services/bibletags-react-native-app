import { StyleSheet, Text, View, ScrollView, I18nManager } from "react-native"
import { Input } from "@ui-kitten/components"
import { i18n } from "inline-i18n"

import { memo, readHeaderHeight } from '../../utils/toolbox'
import useFormattedSearchValue from '../../hooks/useFormattedSearchValue'
import useThemedStyleSets from '../../hooks/useThemedStyleSets'

const fontSize = 16

const styles = StyleSheet.create({
  container: {
    height: readHeaderHeight,
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: 5,
    overflow: 'hidden',
    flexGrow: 1,
  },
  inputContainer: {
    ...StyleSheet.absoluteFill,
    top: -1,
  },
  inputContainerContent: {
    minWidth: '100%',
  },
  formattedInputText: {
    color: 'black',
    alignSelf: 'center',
    paddingHorizontal: 16,
    fontSize,
    lineHeight: fontSize,
    top: 2,
  },
  invisibleFormattedInputText: {
    opacity: 0,
  },
  input: {
    ...StyleSheet.absoluteFill,
    ...(I18nManager.isRTL ? { textAlign: 'right' } : {}),
    backgroundColor: 'transparent',
    borderWidth: 0,
    margin: 0,
  },
  inputText: {
    color: 'transparent',
    fontSize,
  },
})

const SearchTextField = ({
  value,
  tabAddition,
  action,
  versionId,
  button,
  inputRef,
  inputContainerRef,

  eva: { style: themedStyle={} },

  ...otherProps
}) => {

  const { baseThemedStyle, altThemedStyleSets } = useThemedStyleSets(themedStyle)

  const formattedValue = useFormattedSearchValue({ value, action, versionId, tabAddition })

  return (
    <View
      style={[
        styles.container,
        baseThemedStyle,
      ]}
    >

      <Text
        style={[
          styles.formattedInputText,
          styles.invisibleFormattedInputText,
        ]}
        allowFontScaling={false}
      >
        {/* This is to have SearchTextFieldContainer automatically widen properly */}
        {formattedValue}
      </Text>

      <ScrollView
        style={styles.inputContainer}
        contentContainerStyle={styles.inputContainerContent}
        horizontal={true}
        ref={inputContainerRef}
      >

        <Text
          style={styles.formattedInputText}
          allowFontScaling={false}
        >
          {formattedValue}
        </Text>

        <Input
          allowFontScaling={false}
          style={styles.input}
          value={value}
          textStyle={styles.inputText}
          returnKeyType="search"
          autoCapitalize="none"
          autoCompleteType="off"
          autoCorrect={false}
          spellcheck={false}
          autoFocus
          importantForAutofill="no"
          enablesReturnKeyAutomatically
          maxLength={1000}
          ref={inputRef}
          {...otherProps}
        />

      </ScrollView>

    </View>
  )
}

export default memo(SearchTextField, { name: 'SearchTextField' })
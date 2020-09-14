import React, { useCallback, useMemo } from "react"
import Constants from "expo-constants"
import { View, StyleSheet, Text, Clipboard, I18nManager } from "react-native"
import { bindActionCreators } from "redux"
import { connect } from "react-redux"
import { i18n } from "inline-i18n"
import { getRefFromLoc } from "bibletags-versification/src/versification"
import { getPassageStr } from "bibletags-ui-helper"
import { useDimensions } from "@react-native-community/hooks"

import useThemedStyleSets from "../../hooks/useThemedStyleSets"
import { isRTLText, getCopyVerseText, adjustFontSize, memo } from "../../utils/toolbox"
import useRouterState from "../../hooks/useRouterState"
import { setRef, setVersionId } from "../../redux/actions"

import TapOptions from "./TapOptions"
import Verse from "./Verse"

const {
  DEFAULT_FONT_SIZE,
} = Constants.manifest.extra

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 0,
  },
  reference: {
    textAlign: 'right',
    fontWeight: 'bold',
  },
  leftAlign: {
    textAlign: 'left',
  },
})

const SearchResult = ({
  result,
  languageId,
  isOriginal,
  searchString,
  selected,
  selectTapY,
  onTouchStart,
  onTouchEnd,
  onSelect,
  versionId,
  versionAbbr,
  unselect,
  style,
  labelStyle,

  themedStyle,

  displaySettings,

  setRef,
  setVersionId,
}) => {

  const { baseThemedStyle, labelThemedStyle } = useThemedStyleSets(themedStyle)

  const { historyGoBack } = useRouterState()

  const { textSize, lineSpacing, theme } = displaySettings
  const { pieces, loc } = result
  const ref = getRefFromLoc(loc)
  const { bookId } = ref

  const tapOptions = useMemo(
    () => ([
      {
        label: i18n("Read"),
        action: () => {
          historyGoBack()
          setVersionId({ versionId })
          setRef({ ref })
        }
      },
      {
        label: i18n("Copy"),
        action: () => {
          const copyTextContent = getCopyVerseText({ pieces, ref, versionAbbr })
          
          Clipboard.setString(copyTextContent)

          return {
            showResult: true,
            onDone: unselect,
          }
        }
      },
    ]),
    [ pieces, ref, versionAbbr, versionId, unselect ],
  )

  const onPress = useCallback(
    ({ nativeEvent }) => {
      const { pageY } = nativeEvent

      onSelect({ loc, pageY })
    },
    [ loc, onSelect ],
  )

  const { width, height } = useDimensions().window

  const fontSize = adjustFontSize({ fontSize: DEFAULT_FONT_SIZE * textSize, isOriginal, languageId, bookId })

  const passageStr = getPassageStr({
    refs: [
      ref,
    ],
  })

  const showBelow = selectTapY < height / 2

  return (
    <View style={styles.container}>
      <Text
        style={[
          styles.reference,
          labelThemedStyle,
          labelStyle,
          (isRTLText({ languageId, bookId }) === I18nManager.isRTL ? styles.leftAlign : null),
          {
            fontSize: Math.max(fontSize * .65, 12),
            lineHeight: Math.max(fontSize * .65, 12) * lineSpacing,
          },
        ]}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onPress={onPress}
      >
        {passageStr}
      </Text>
      <Verse
        passageRef={ref}
        versionId={versionId}
        pieces={pieces}
        searchString={searchString}
        style={[
          baseThemedStyle,
          style,
        ]}
        uiStatus={selected ? "selected" : "unselected"}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onPress={onPress}
      />
      {selected &&
        <TapOptions
          options={tapOptions}
          centerX={parseInt(width/2, 10)}
          bottomY={showBelow ? 0 : null}
          topY={!showBelow ? -20 : null}
        />
      }
    </View>
  )

}

const mapStateToProps = ({ displaySettings }) => ({
  displaySettings,
})

const matchDispatchToProps = dispatch => bindActionCreators({
  setRef,
  setVersionId,
}, dispatch)

export default memo(connect(mapStateToProps, matchDispatchToProps)(SearchResult), { name: 'SearchResult', jsonMemoProps: [ 'style', 'labelStyle' ] })
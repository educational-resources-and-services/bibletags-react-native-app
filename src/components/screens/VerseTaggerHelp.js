import React, { useState, useMemo, useEffect } from "react"
import { TouchableOpacity, StyleSheet, View } from "react-native"
import { i18n } from "inline-i18n"

import useThemedStyleSets from "../../hooks/useThemedStyleSets"
import useRouterState from "../../hooks/useRouterState"
import { memo } from "../../utils/toolbox"

import SafeLayout from "../basic/SafeLayout"
import BasicHeader from "../major/BasicHeader"
import VerseTaggerHelpWhy from "./VerseTaggerHelpWhy"
import VerseTaggerHelpHow from "./VerseTaggerHelpHow"
import VerseTaggerHelpRules from "./VerseTaggerHelpRules"
import VerseTaggerHelpExamples from "./VerseTaggerHelpExamples"

let lastHelpIndex = 0

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    flexDirection: 'row',
  },
  selectedDotContainer: {
    paddingVertical: 9,
    paddingHorizontal: 5,
  },
  dotContainer: {
    paddingVertical: 13,
    paddingHorizontal: 9,
  },
  selectedDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  dot: {
    width: 4,
    height: 4,
    backgroundColor: 'black',
    borderRadius: 3,
  },
})

const VerseTaggerHelp = ({
  style,

  eva: { style: themedStyle={} },
}) => {

  const { labelThemedStyle } = useThemedStyleSets(themedStyle)

  const [ helpIndex, setHelpIndex ] = useState(lastHelpIndex)

  const { routerState } = useRouterState()
  const { defaultOrigLangForExamples } = routerState

  const [ showHebrewExamples, setShowHebrewExamples ] = useState(defaultOrigLangForExamples === 'heb')
  const [ showGreekExamples, setShowGreekExamples ] = useState(defaultOrigLangForExamples === 'grc')

  useEffect(
    () => {
      lastHelpIndex = helpIndex
    },
    [ helpIndex ],
  )

  const helpPageInfo = useMemo(
    () => ([
      {
        title: i18n("Why tag?"),
        component: <VerseTaggerHelpWhy setHelpIndex={setHelpIndex} />,
      },
      {
        title: i18n("How to tag"),
        component: (
          <VerseTaggerHelpHow
            setHelpIndex={setHelpIndex}
            showHebrewExamples={showHebrewExamples}
          />
        ),
      },
      {
        title: i18n("Tagging rules"),
        component: (
          <VerseTaggerHelpRules
            setHelpIndex={setHelpIndex}
            showHebrewExamples={showHebrewExamples}
            setShowHebrewExamples={setShowHebrewExamples}
            showGreekExamples={showGreekExamples}
            setShowGreekExamples={setShowGreekExamples}
          />
        ),
      },
      {
        title: i18n("Examples"),
        component: (
          <VerseTaggerHelpExamples
            showHebrewExamples={showHebrewExamples}
            showGreekExamples={showGreekExamples}
          />
        ),
      },
    ]),
    [ setHelpIndex, showHebrewExamples, showGreekExamples ],
  )

  return (
    <SafeLayout>

      <BasicHeader
        title={helpPageInfo[helpIndex].title}
        extraButtons={
          <View style={styles.container}>
            {helpPageInfo.map((x, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => setHelpIndex(idx)}
              >
                <View
                  style={
                    helpIndex === idx
                      ? styles.selectedDotContainer
                      : styles.dotContainer
                    }
                >
                  <View
                    style={[
                      helpIndex === idx ? styles.selectedDot : styles.dot,
                      helpIndex === idx ? labelThemedStyle : null,
                    ]}
                  />
                </View> 
              </TouchableOpacity>
            ))}
          </View>
        }
      />

      {helpPageInfo[helpIndex].component}

    </SafeLayout>
  )

}

export default memo(VerseTaggerHelp, { name: 'VerseTaggerHelp' })

import { useCallback, useMemo, useState } from "react"
import { i18n } from "inline-i18n"
import { StyleSheet, View, Text } from "react-native"
import { useWindowDimensions } from 'react-native'

import { setAsyncStorage, getAsyncStorage } from "../utils/toolbox"
import useRouterState from "./useRouterState"
import useEffectAsync from "./useEffectAsync"

const ASYNC_STORAGE_KEY = `haveSeenTaggingInstructions`

const styles = StyleSheet.create({
  cover: {
    ...StyleSheet.absoluteFill,
    padding: 30,
    backgroundColor: 'rgba(255, 255, 255, .7)',
  },
  spacer1: {
    flex: 1,
  },
  spacer3: {
    flex: 3,
  },
  textContainer: {
    elevation: 4,
    shadowOffset: { width: 0, height: 0 },
    shadowColor: "black",
    shadowOpacity: 0.3,
    shadowRadius: 15,
    backgroundColor: "white",
    padding: 15,
    alignSelf: 'center',
  },
  heading: {
    fontWeight: '700',
    fontSize: 15,
    textAlign: 'left',
  },
  p: {
    marginTop: 15,
    fontSize: 15,
  },
})

const useTaggingInstructions = ({ defaultOrigLangForExamples }) => {

  const [ haveSeenTaggingInstructions, setHaveSeenTaggingInstructions ] = useState(true)
  const { historyPush } = useRouterState()

  const { fontScale } = useWindowDimensions()

  useEffectAsync(
    async () => {
      setHaveSeenTaggingInstructions(
        await getAsyncStorage(ASYNC_STORAGE_KEY, false)
      )
    },
    [],
  )

  const openInstructions = useCallback(
    async () =>  {

      historyPush("/Read/VerseTagger/Help", { defaultOrigLangForExamples })

      if(!haveSeenTaggingInstructions) {
        await setAsyncStorage(ASYNC_STORAGE_KEY, true)
      }

    },
    [ haveSeenTaggingInstructions, defaultOrigLangForExamples ],
  )

  const instructionsCover = useMemo(
    () => (
      !haveSeenTaggingInstructions
        ? (
          <View style={styles.cover}>
            <View style={styles.spacer1} />
            <View
              style={[
                styles.textContainer,
                { maxWidth: 400 * fontScale },
              ]}
            >
              <Text style={styles.heading}>
                {i18n("We thank God for your desire to help!")}
              </Text>
              <Text style={styles.p}>
                {i18n("To get started, click the information icon in the top right corner for an orientation.")}
              </Text>
            </View>
            <View style={styles.spacer3} />
          </View>
        )
        : null
    ),
    [ haveSeenTaggingInstructions ],
  )

  return {
    openInstructions,
    instructionsCover,
  }

}

export default useTaggingInstructions

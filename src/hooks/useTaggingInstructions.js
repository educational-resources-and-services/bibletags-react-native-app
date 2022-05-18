import { useCallback, useMemo, useState } from "react"
import { i18n } from "inline-i18n"
import { StyleSheet, View, Text } from "react-native"

import { setAsyncStorage, getAsyncStorage } from "../utils/toolbox"
import useRouterState from "./useRouterState"
import useEffectAsync from "./useEffectAsync"

const ASYNC_STORAGE_KEY = `haveSeenTaggingInstructions`

const styles = StyleSheet.create({
  cover: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
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
    maxWidth: 400,
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

const useTaggingInstructions = () => {

  const [ haveSeenTaggingInstructions, setHaveSeenTaggingInstructions ] = useState(true)
  const { historyPush } = useRouterState()

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

      historyPush("/Read/VerseTagger/Help")

      if(!haveSeenTaggingInstructions) {
        await setAsyncStorage(ASYNC_STORAGE_KEY, true)
      }

    },
    [ haveSeenTaggingInstructions ],
  )

  const instructionsCover = useMemo(
    () => (
      !haveSeenTaggingInstructions
        ? (
          <View style={styles.cover}>
            <View style={styles.spacer1} />
            <View style={styles.textContainer}>
              <Text style={styles.heading}>
                {i18n("We thank God for your desire to help!")}
              </Text>
              <Text style={styles.p}>
                {i18n("The more people who tag, the better tagging data becomes. So we invite you to tag often!")}
              </Text>
              <Text style={styles.p}>
                {i18n("At the same time, good data relies on us all using the same tagging principles. So please follow the instructions carefully.")}
              </Text>
              <Text style={styles.p}>
                {i18n("Click the information icon in the top right corner to view the instructions before you begin.")}
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

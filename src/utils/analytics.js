import { Platform } from "react-native"
import * as Amplitude from "expo-analytics-amplitude"
import Constants from "expo-constants"

const {
  AMPLITUDE_API_KEY,
} = Constants.manifest.extra

const IS_STANDALONE = Constants.appOwnership === 'standalone'

if(IS_STANDALONE && AMPLITUDE_API_KEY) {
  Amplitude.initialize(AMPLITUDE_API_KEY)
}

export const logEvent = ({ eventName, properties }) => {

  if(IS_STANDALONE && AMPLITUDE_API_KEY) {
    Amplitude.logEventWithProperties(
      eventName,
      {
        Platform: Platform.OS,
        ...properties,
      }
    )
  }

}
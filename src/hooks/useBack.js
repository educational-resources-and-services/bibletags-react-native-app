import { useEffect } from "react"
import { BackHandler } from "react-native"

const useBack = fn => {
  useEffect(
    () => {
      if(fn) {

        const fnWithReturnTrue = () => {
          fn()
          return true
        }

        const backHandler = BackHandler.addEventListener('hardwareBackPress', fnWithReturnTrue)
        return backHandler.remove
        
      }
    },
    [ fn ],
  )
}

export default useBack
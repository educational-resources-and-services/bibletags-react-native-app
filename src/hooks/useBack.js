import { useEffect } from "react"
import { BackHandler } from "react-native"

const useBack = fn => {
  useEffect(
    () => {
      if(fn) {

        const backHandler = BackHandler.addEventListener('hardwareBackPress', fn)
        return backHandler.remove
        
      }
    },
    [ fn ],
  )
}

export default useBack
import { useLayoutEffect, useState } from "react"
import NetInfo from "@react-native-community/netinfo"

const useNetwork = () => {

  const [ connectionInfo, setConnectionInfo ] = useState({ online: false })

  useLayoutEffect(
    () => {

      const unsubscribe = NetInfo.addEventListener(
        ({ type }) => {
          setConnectionInfo({
            online: type !== 'none',
          })
        },
      )

      return unsubscribe
    },
    [],
  )

  return connectionInfo
}

export default useNetwork
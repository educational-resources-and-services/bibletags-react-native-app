import { useCallback, useRef } from "react"
import useSetTimeout from "./useSetTimeout"
import useInstanceValue from "./useInstanceValue"

const useThrottledCallback = (fn, ms, dep) => {

  const hasTimeout = useRef()
  const latestValue = useRef()

  const [ setThrottleTimeout ] = useSetTimeout()

  const getFn = useInstanceValue(fn)

  const throttledFn = useCallback(
    value => {
      latestValue.current = value

      if(!hasTimeout.current) {
        hasTimeout.current = true

        setThrottleTimeout(
          () => {
            getFn()(latestValue.current)
            hasTimeout.current = null
          },
          Number.isInteger(ms) ? ms : 100,
        )
      }
    },
    dep,
  )

  return throttledFn

}

export default useThrottledCallback
import { useMemo, useRef } from "react"

const useEqualObjsMemo = (valueOrFunc, deps=[]) => {

  const value = useRef(valueOrFunc)

  if(typeof valueOrFunc !== 'function') {
    value.current = valueOrFunc
  }

  useMemo(
    () => {
      if(typeof valueOrFunc === 'function') {
        value.current = valueOrFunc()
      }
    },
    deps,  // eslint-disable-line react-hooks/exhaustive-deps
  )

  const returnValue = useMemo(
    () => value.current,
    [ JSON.stringify(value.current) ],  // eslint-disable-line react-hooks/exhaustive-deps
  )

  return returnValue
}

export default useEqualObjsMemo

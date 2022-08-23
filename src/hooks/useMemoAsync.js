import { useState } from "react"
import useMountedState from "react-use/lib/useMountedState"

import useEffectAsync from "./useEffectAsync"

const useMemoAsync = (func, deps, defaultValue) => {

  const [ value, setValue ] = useState(defaultValue)
  const isMounted = useMountedState()

  useEffectAsync(
    async () => {
      const newValue = await func()
      if(isMounted()) {
        setValue(newValue)
      }
    },
    deps,  // eslint-disable-line react-hooks/exhaustive-deps
  )

  return value

}

export default useMemoAsync

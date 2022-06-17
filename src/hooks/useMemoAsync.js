import { useState } from "react"

import useEffectAsync from "./useEffectAsync"

const useMemoAsync = (func, deps, defaultValue) => {

  const [ value, setValue ] = useState(defaultValue)

  useEffectAsync(
    async () => {
      setValue(await func())
    },
    deps,  // eslint-disable-line react-hooks/exhaustive-deps
  )

  return value

}

export default useMemoAsync

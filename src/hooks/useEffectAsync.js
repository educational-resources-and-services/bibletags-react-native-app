import { useEffect } from "react"

const useEffectAsync = (func, deps) => {

  useEffect(
    () => {
      func()
    },
    deps,  // eslint-disable-line react-hooks/exhaustive-deps
  )

}

export default useEffectAsync

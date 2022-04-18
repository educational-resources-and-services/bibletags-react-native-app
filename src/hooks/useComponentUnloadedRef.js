import { useEffect, useRef } from "react"

const useComponentUnloadedRef = () => {

  const unloaded = useRef(false)

  useEffect(
    () => () => {
      unloaded.current = true
    },
    [],
  )

  return unloaded

}

export default useComponentUnloadedRef
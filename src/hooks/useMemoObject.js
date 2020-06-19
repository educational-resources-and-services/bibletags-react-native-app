import { useMemo } from "react"

const useMemoObject = obj => {

  const memoObj = useMemo(
    () => obj,
    [
      ...Object.keys(obj),
      ...Object.values(obj),
    ],
  )

  return memoObj
}

export default useMemoObject
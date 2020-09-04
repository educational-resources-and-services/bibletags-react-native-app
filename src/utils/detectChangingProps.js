import React, { useRef } from "react"

const timeoutInfoByNameAndKey = {}

const detectChangingProps = (name, Component) => props => {
  
  const prevProps = useRef(props)
  
  const keys = Object.keys(props)

  keys.forEach(key => {
    if(props[key] !== prevProps.current[key]) {

      const nameAndKey = `${name} ${key}`

      if(!timeoutInfoByNameAndKey[nameAndKey]) {
        timeoutInfoByNameAndKey[nameAndKey] = {
          i: 0,
        }
      }

      clearTimeout(timeoutInfoByNameAndKey[nameAndKey].timeout)
      timeoutInfoByNameAndKey[nameAndKey].i++
      timeoutInfoByNameAndKey[nameAndKey].timeout = setTimeout(
        () => {
          console.log(nameAndKey, timeoutInfoByNameAndKey[nameAndKey].i)
          timeoutInfoByNameAndKey[nameAndKey].i = 0
        },
        500,
      )
    
    }
  })

  prevProps.current = props

  return <Component {...props} />
}

export default detectChangingProps
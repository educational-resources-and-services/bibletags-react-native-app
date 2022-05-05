import React from "react"
import { i18n } from "inline-i18n"

import useRouterState from "../../hooks/useRouterState"

import BasicHeader from "./BasicHeader"

const ErrorMessageHeader = React.memo(() => {

  const { routerState } = useRouterState()
  const { title, critical } = routerState
  
  return (
    <BasicHeader
      title={title || i18n("Error")}
      disableBack={!!critical}
    />
  )

})

export default ErrorMessageHeader

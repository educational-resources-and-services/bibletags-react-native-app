import React from "react"
import { Routes, Route } from "react-router-native"

import FAQ from "./tenantComponents/FAQ"

const RouteSwitcher = () => (
  <Routes>

    {/*
      The following base paths are already used and so will have no effect:
        /Read
        /LanguageChooser
        /ErrorMessage
    */}

    <Route path="/FAQ" element={<FAQ />} />

  </Routes>
)

export default RouteSwitcher
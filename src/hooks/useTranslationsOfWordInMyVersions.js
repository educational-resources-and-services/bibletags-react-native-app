import { useEffect } from "react"

const useTranslationsOfWordInMyVersions = ({
  wordId,
  wordPartNumber,
  originalLoc,
  myBibleVersions,
}) => {

  // get verses (translated from originalLoc) from all my versions
  // get all tagSets matching the loc-versionId combos
  // find the tagged wordNumber in all tagSets and then grab it from the verse, compiling an array like this:
  // [
  //   {
  //     translation: "beginning",
  //     versions: [
  //       {
  //         id: "esv",
  //         status: "unconfirmed",
  //       },
  //       {
  //         id: "nasb",
  //         status: "confirmed",
  //       },
  //     ],
  //   },
  //   {
  //     translation: "start",
  //     versions: [
  //       {
  //         id: "net",
  //         status: "automatch",
  //       },
  //     ],
  //   },
  // ]

}

export default useTranslationsOfWordInMyVersions

// TODO: uses
  // orig - word tap
  // translation - vsnum tap - word tap
  // two translations in parallel - word tap

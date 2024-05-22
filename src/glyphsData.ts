// @ts-nocheck
import type { GlyphData, WebfontOptions } from './types'
import fse from 'fs-extra'
import fileSorter from 'svgicons2svgfont/src/filesorter.js'
import getMetadataService from 'svgicons2svgfont/src/metadata.js'
import xml2js from 'xml2js'

// eslint-disable-next-line no-unused-vars
type GlyphsDataGetter = (files: Array<GlyphData['srcPath']>, options: WebfontOptions) => unknown

export const getGlyphsData: GlyphsDataGetter = (files, options) => {
  const metadataProvider =
    options.metadataProvider ||
    getMetadataService({
      prependUnicode: options.prependUnicode,
      startUnicode: options.startUnicode,
    })

  const xmlParser = new xml2js.Parser()

  return Promise.all(
    files.map(
      (srcPath: GlyphData['srcPath']) =>
        new Promise((resolve, reject) => {
          const glyphContents = fse.readFileSync(srcPath, 'utf-8')
          if (glyphContents.length === 0) {
            reject(new Error(`Empty file ${srcPath}`))
          }

          xmlParser.parseString(glyphContents, (error) => {
            if (error) {
              reject(error)
            }

            const glyphData: GlyphData = {
              contents: glyphContents,
              srcPath,
            }

            resolve(glyphData)
          })
        })
    )
  ).then((glyphsData) => {
    let sortedGlyphsData = glyphsData

    if (options.sort) {
      const sortCallback = (fileA: GlyphData, fileB: GlyphData) => fileSorter(fileA.srcPath, fileB.srcPath)
      sortedGlyphsData = glyphsData.sort(sortCallback)
    }

    const { ligatures } = options

    return Promise.all(
      sortedGlyphsData.map(
        (glyphData: GlyphData) =>
          new Promise((resolve, reject) => {
            metadataProvider(glyphData.srcPath, (error, metadata) => {
              if (error) {
                return reject(error)
              }

              if (ligatures) {
                metadata.unicode.push(metadata.name.replace(/-/gu, '_'))
              }

              glyphData.metadata = metadata

              return resolve(glyphData)
            })
          })
      )
    )
  })
}

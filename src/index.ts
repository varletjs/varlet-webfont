import { GlyphData, InitialOptions, Result } from './types'
import { getGlyphsData } from './glyphsData.js'
import { getOptions } from './options.js'
import { Readable } from 'stream'
import SVGIcons2SVGFontStream from 'svgicons2svgfont'
import globby from 'globby'
import path from 'path'
import svg2ttf from 'svg2ttf'

const toSvg = (glyphsData: any, options: any) => {
  let result = ''

  return new Promise((resolve, reject) => {
    let log = () => {
      Function.prototype()
    }

    if (options.verbose) {
      // eslint-disable-next-line no-console
      log = console.log.bind(console)
    }

    const fontStream = new SVGIcons2SVGFontStream({
      ascent: options.ascent,
      centerHorizontally: options.centerHorizontally,
      descent: options.descent,
      fixedWidth: options.fixedWidth,
      fontHeight: options.fontHeight,
      fontId: options.fontId,
      fontName: options.fontName,
      fontStyle: options.fontStyle,
      fontWeight: options.fontWeight,
      log,
      metadata: options.metadata,
      normalize: options.normalize,
      round: options.round,
    })
      .on('finish', () => resolve(result))
      .on('data', (data: any) => {
        result += data
      })
      .on('error', (error: any) => reject(error))

    glyphsData.forEach((glyphData: any) => {
      const glyphStream = new Readable() as Readable & { metadata: any }
      glyphStream.push(glyphData.contents)
      glyphStream.push(null)
      glyphStream.metadata = glyphData.metadata
      fontStream.write(glyphStream)
    })

    fontStream.end()
  })
}

const toTtf = (buffer: any, options: any) => Buffer.from(svg2ttf(buffer, options).buffer)

type Webfont = (initialOptions?: InitialOptions) => Promise<Result>

export const webfont: Webfont = async (initialOptions) => {
  const options = getOptions(initialOptions)
  const foundFiles = await globby([...(options.files ?? [])])
  const filteredFiles = foundFiles.filter((foundFile) => path.extname(foundFile) === '.svg')

  if (filteredFiles.length === 0) {
    throw new Error('Files glob patterns specified did not match any files')
  }

  let glyphsData = (await getGlyphsData(filteredFiles, options)) as GlyphData[]

  if (options.glyphTransformFn && typeof options.glyphTransformFn === 'function') {
    const transformedGlyphs = glyphsData.map(async (glyphData: GlyphData) => {
      const metadata = await options.glyphTransformFn!(glyphData.metadata!)

      return {
        ...glyphData,
        metadata,
      }
    })
    glyphsData = await Promise.all(transformedGlyphs)
  }

  let ttfOptions = {}

  if (options.formatsOptions && options.formatsOptions.ttf) {
    ttfOptions = options.formatsOptions.ttf
  }

  const svg = (await toSvg(glyphsData, options)) as Result['svg']
  const ttf = toTtf(svg, ttfOptions)

  const result: Result = {
    glyphsData,
    svg,
    ttf,
  }

  if (!options.formats!.includes('svg')) {
    delete result.svg
  }

  if (!options.formats!.includes('ttf')) {
    delete result.ttf
  }

  result.config = options

  return result
}

export * from './types'

// @ts-nocheck
import type { GlyphData, InitialOptions } from "../types";
import { Readable } from "stream";
import type { Result } from "../types/Result";
import SVGIcons2SVGFontStream from "svgicons2svgfont";
import crypto from "crypto";
import { getGlyphsData } from "./glyphsData";
import { getOptions } from "./options";
import globby from "globby";
import path from "path";
import svg2ttf from "svg2ttf";
import ttf2eot from "ttf2eot";
import ttf2woff from "ttf2woff";
import wawoff2 from "wawoff2";

const toSvg = (glyphsData, options) => {
  let result = "";

  return new Promise((resolve, reject) => {
    let log = () => {
      Function.prototype();
    };

    if (options.verbose) {
      // eslint-disable-next-line no-console
      log = console.log.bind(console);
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
      .on("finish", () => resolve(result))
      .on("data", (data) => {
        result += data;
      })
      .on("error", (error) => reject(error));

    glyphsData.forEach((glyphData) => {
      const glyphStream: Readable = new Readable();

      glyphStream.push(glyphData.contents);
      glyphStream.push(null);

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      glyphStream.metadata = glyphData.metadata;

      fontStream.write(glyphStream);
    });

    fontStream.end();
  });
};

const toTtf = (buffer, options) => Buffer.from(svg2ttf(buffer, options).buffer);

const toEot = (buffer) => Buffer.from(ttf2eot(buffer).buffer);

const toWoff = (buffer, options) =>
  Buffer.from(ttf2woff(buffer, options).buffer);

const toWoff2 = (buffer) => wawoff2.compress(buffer);

// eslint-disable-next-line no-unused-vars
type Webfont = (initialOptions?: InitialOptions) => Promise<Result>;

export const webfont: Webfont = async (initialOptions) => {
  const options = getOptions(initialOptions);

  const foundFiles = await globby([].concat(options.files));
  const filteredFiles = foundFiles.filter(
    (foundFile) => path.extname(foundFile) === ".svg"
  );

  if (filteredFiles.length === 0) {
    throw new Error("Files glob patterns specified did not match any files");
  }

  let glyphsData = (await getGlyphsData(filteredFiles, options)) as GlyphData[];

  if (
    options.glyphTransformFn &&
    typeof options.glyphTransformFn === "function"
  ) {
    const transformedGlyphs = glyphsData.map(async (glyphData: GlyphData) => {
      const metadata = await options.glyphTransformFn(glyphData.metadata);

      return {
        ...glyphData,
        metadata,
      };
    });
    glyphsData = await Promise.all(transformedGlyphs);
  }

  let ttfOptions = {};

  if (options.formatsOptions && options.formatsOptions.ttf) {
    ttfOptions = options.formatsOptions.ttf;
  }

  const svg = (await toSvg(glyphsData, options)) as Result["svg"];
  const ttf = toTtf(svg, ttfOptions);

  const result: Result = {
    glyphsData,
    hash: crypto.createHash("md5").update(svg).digest("hex"),
    svg,
    ttf,
  };

  if (options.formats.includes("eot")) {
    result.eot = toEot(ttf);
  }

  if (options.formats.includes("woff")) {
    result.woff = toWoff(ttf, { metadata: options.metadata });
  }

  if (options.formats.includes("woff2")) {
    result.woff2 = await toWoff2(ttf);
  }

  if (!options.formats.includes("svg")) {
    delete result.svg;
  }

  if (!options.formats.includes("ttf")) {
    delete result.ttf;
  }

  result.config = options;

  return result;
};

export default webfont;

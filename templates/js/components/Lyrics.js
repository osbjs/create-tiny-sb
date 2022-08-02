import { color, DefaultPallete, fade, Layer, Origin, scale } from '@osbjs/tiny-osbjs'
import {
	createText,
	createTxtGenContext,
	measureLineHeight,
	measureLineWidth,
	useFont,
	useTxtGenContext
} from '@osbjs/txtgen-tiny-osbjs'
import { readFileSync } from 'fs'
import { parseSync } from 'subtitle'
import { beatmapFolder } from '../config'

/**
 * @typedef LyricsOptions
 * @type {object}
 * @property {import('@osbjs/txtgen-tiny-osbjs').FontProps} fontProps Font properties used to generate text.
 * @property {string} [fontPath] Path to non-system font you want to use.
 * @property {number} [fontScale] The scale factor applied to the generated text image.
 * @property {boolean} [perCharacter] Generate image for each character instead of a full sentence.
 * @property {number} [fadeDuration] Fade in/out duration.
 * @property {number} [opacity] Opacity.
 * @property {number} [y] Y coordinate of each sentence.
 * @property {import('@osbjs/tiny-osbjs').Color} [textColor] Text color.
 * @property {number} [spaceWidth] If you are rendering each character, we will not render the space character
 * but instead we will add a gap to the x coordinate calculation between each letter.
 */

/**
 * @typedef Lyric
 * @type {object}
 * @property {string} text
 * @property {number} startTime
 * @property {number} endTime
 */

/**
 * @param {LyricsOptions} options
 */
function useDefaultConfigIfEmpty(options) {
	return {
		perCharacter: false,
		fadeDuration: 300,
		opacity: 1,
		y: 400,
		textColor: DefaultPallete.White,
		fontScale: 1,
		...options
	}
}

/**
 * `subtitle` only supports srt and vtt file.
 * @returns {Lyric[]}
 */
function loadLyricsFile(lyricsFilePath) {
	const input = readFileSync(lyricsFilePath, 'utf8')

	if (lyricsFilePath.match(/.*\.(srt|vtt)$/)) {
		let data = parseSync(input)

		return data
			.filter((s) => s.type == 'cue')
			.map((s) => {
				const { start: startTime, end: endTime, text } = s.data

				return { startTime, endTime, text }
			})
	} else if (lyricsFilePath.match(/.*\.json$/)) {
		return JSON.parse(input)
	} else {
		throw new Error('Unsupported file type')
	}
}

/**
 * Read the subtitle file and generate lyrics.
 * @param {string} lyricsFilePath Path to the lyrics file.
 * @param {string} osbFolderPath Relative path to the folder that will be used to save generated text images, ex: `sb/lyrics`.
 * @param {LyricsOptions} options Read the type definition to see which options you can override.
 */
export default function Lyrics(lyricsFilePath, osbFolderPath, options) {
	const { perCharacter, fadeDuration, opacity, y, textColor, fontProps, fontPath, fontScale } =
		useDefaultConfigIfEmpty(options)

	if (fontPath) useFont(fontPath, fontProps.name)

	const txtgenContext = createTxtGenContext(osbFolderPath, beatmapFolder, fontProps)
	useTxtGenContext(txtgenContext)

	const lyrics = loadLyricsFile(lyricsFilePath)

	if (perCharacter) {
		lyrics.forEach(({ text, startTime, endTime }) => {
			let letterY = y

			// may have multiple lines
			text.split('\n').forEach((line) => {
				const lineHeight = maxLineHeight(line) * fontScale
				const lineWidth = measureLineWidth(line) * fontScale

				let letterX = 320 - lineWidth / 2

				line.split('').forEach((letter) => {
					createText(letter, Layer.Background, Origin.Centre, [letterX, letterY], ({ width }) => {
						scale(startTime, fontScale)
						fade([startTime, startTime + fadeDuration], 0, opacity)
						fade([endTime - fadeDuration, endTime], opacity, 0)
						color(startTime, textColor)

						letterX += width * fontScale
					})
				})

				letterY += lineHeight
			})
		})
	} else {
		lyrics.forEach(({ text, startTime, endTime }) => {
			createText(text, Layer.Background, Origin.Centre, [320, y], () => {
				scale(startTime, fontScale)
				fade([startTime, startTime + fadeDuration], 0, opacity)
				fade([endTime - fadeDuration, endTime], opacity, 0)
				color(startTime, textColor)
			})
		})
	}
}

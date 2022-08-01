import { color, Color, DefaultPallete, fade, Layer, Origin, scale } from '@osbjs/tiny-osbjs'
import {
	createText,
	createTxtGenContext,
	ejectAllTextImages,
	FontProps,
	measureLineHeight,
	measureLineWidth,
	useFont,
	useTxtGenContext
} from '@osbjs/txtgen-tiny-osbjs'
import { readFileSync } from 'fs'
import { Cue, parseSync } from 'subtitle'
import { beatmapFolder } from '../config'

export type LyricsOptions = {
	/**
	 * Path to non-system font you want to use.
	 */
	fontPath?: string
	/**
	 * Font properties used to generate text.
	 */
	fontProps: FontProps
	/**
	 * The scale factor applied to the generated text image.
	 */
	fontScale?: number
	/**
	 * Generate image for each character instead of a full sentence.
	 */
	perCharacter?: boolean
	/**
	 * Fade in/out duration.
	 */
	fadeDuration?: number
	/**
	 * Opacity.
	 */
	opacity?: number
	/**
	 * Y coordinate of each sentence.
	 */
	y?: number
	/**
	 * Text color.
	 */
	textColor?: Color
	/**
	 * If you are rendering each character, we will not render the space image
	 * but instead we will add a gap to the x coordinate calculation between each letter.
	 */
	spaceWidth?: number
}

function useDefaultConfigIfEmpty(options: LyricsOptions) {
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

type Lyric = {
	text: string
	startTime: number
	endTime: number
}

/**
 * `subtitle` only supports srt and vtt file.
 */
function loadLyricsFile(lyricsFilePath: string): Lyric[] {
	const input = readFileSync(lyricsFilePath, 'utf8')

	if (lyricsFilePath.match(/.*\.(srt|vtt)$/)) {
		let data = parseSync(input)

		return data
			.filter((s) => s.type == 'cue')
			.map((s) => {
				const { start: startTime, end: endTime, text } = s.data as Cue

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
 * @param lyricsFilePath Path to the lyrics file.
 * @param osbFolderPath Relative path to the folder that will be used to save generated text images, ex: `sb/lyrics`.
 * @param options Read the type definition to see which options you can override.
 */
export default function Lyrics(lyricsFilePath: string, osbFolderPath: string, options: LyricsOptions) {
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
				const lineHeight = measureLineHeight(line, (pr, cr) => Math.max(pr, cr)) * fontScale
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

	ejectAllTextImages()
}

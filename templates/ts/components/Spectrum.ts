import { extractFrames, loadSpectrumSchema } from '@osbjs/spectrum-tiny-osbjs'
import { Color, color, createSprite, DefaultPallete, fade, Layer, Origin, scaleVec } from '@osbjs/tiny-osbjs'

export type SpectrumOptions = {
	/**
	 * Real width of the sprite.
	 */
	spriteWidth?: number
	/**
	 * Real height of the sprite.
	 */
	spriteHeight?: number
	/**
	 * How many bars you want to generate.
	 */
	barCount?: number
	/**
	 * Width of each bar.
	 */
	barWidth?: number
	/**
	 * Maximun height of each bar.
	 */
	maxBarHeight?: number
	/**
	 * Color of each bar.
	 */
	barColor?: Color
	/**
	 * Gap between each bar.
	 */
	gap?: number
	/**
	 * Opacity of each bar.
	 */
	opacity?: number
}

function useDefaultOptionsIfEmpty(options: SpectrumOptions) {
	// assuming you are using a "dot" sprite
	return {
		spriteHeight: 1,
		spriteWidth: 1,
		barCount: 32,
		barWidth: 20,
		maxBarHeight: 80,
		barColor: DefaultPallete.White,
		gap: 3,
		opacity: 1,
		...options
	}
}

/**
 * Display a spectrum.
 * @param startTime Start time of the effect.
 * @param endTime End time of the effect.
 * @param schemaPath Path to the generated schema file.
 * @param spritePath Relative path to the `bar` sprite.
 * @param options Read the type definition to see which options you can override.
 */
export default function Spectrum(
	startTime: number,
	endTime: number,
	schemaPath: string,
	spritePath: string,
	options: SpectrumOptions
) {
	const { fps, spectrumFrames: sF } = loadSpectrumSchema(schemaPath)
	const spectrumFrames = extractFrames(sF, startTime, endTime, fps)
	const { barCount, barWidth, maxBarHeight, gap, barColor, opacity, spriteWidth, spriteHeight } =
		useDefaultOptionsIfEmpty(options)
	const timestep = 1000 / fps

	let x = 320 - (spriteWidth * barCount + gap * (barCount - 1)) / 2

	for (let i = 0; i < barCount; i++) {
		const barFrames = spectrumFrames.map((frame) => frame[i])

		createSprite(spritePath, Layer.Background, Origin.Centre, [x, 240], () => {
			fade(startTime, opacity)
			color(startTime, barColor)

			let prevFrames = barFrames[0]

			for (let j = 0; j < barFrames.length; j++) {
				if (barFrames[j + 1] != prevFrames) {
					scaleVec(
						[startTime + timestep * j, startTime + timestep * (j + 1)],
						[barWidth / spriteWidth, (barFrames[j] * maxBarHeight) / spriteHeight],
						[barWidth / spriteWidth, (barFrames[j + 1] * maxBarHeight) / spriteHeight]
					)

					prevFrames = barFrames[j + 1]
				}
			}
		})

		x += barWidth + gap
	}
}

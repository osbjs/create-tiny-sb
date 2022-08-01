import { loadBeatmapHitobjects } from '@osbjs/hitobjects-tiny-osbjs'
import { createSprite, fade, Layer, move, Origin, scale } from '@osbjs/tiny-osbjs'

/**
 * Highlight every hit objects in a specific time range.
 * @param {number} startTime Start time of the effect.
 * @param {number} endTime End time of the effect.
 * @param {string} spritePath Relative path to the image.
 * @param {string} osuFilePath Full path to the .osu file
 * @param {number} fps How many times the sprite will move along the slider body per second.
 */
export default function HitObjectHighlight(startTime, endTime, spritePath, osuFilePath, fps = 30) {
	const { sliders, circles } = loadBeatmapHitobjects(osuFilePath)

	circles
		.filter((circle) => circle.time >= startTime && circle.time <= endTime)
		.forEach((circle) => {
			createSprite(spritePath, Layer.Background, Origin.Centre, circle.position, () => {
				fade([circle.time, circle.time + 100], 1, 0)
				scale(circle.time, circle.time + 100, 0, 1)
			})
		})

	const timestep = 1000 / fps

	sliders
		.filter((slider) => slider.startTime >= startTime && slider.endTime <= endTime)
		.forEach((slider) => {
			createSprite(spritePath, Layer.Background, Origin.Centre, slider.positionAtTime(slider.startTime), () => {
				fade([slider.startTime, slider.endTime], 1, 0)

				const startTime = slider.startTime
				const totalStep = Math.round((slider.endTime - slider.startTime) / timestep)

				for (let i = 0; i < totalStep; i++) {
					const prevEndTime = startTime + timestep * i
					const endTime = startTime + timestep * (i + 1)
					const startPosition = slider.positionAtTime(prevEndTime)
					const endPosition = slider.positionAtTime(endTime)
					move([prevEndTime, endTime], startPosition, endPosition)
				}
			})
		})
}

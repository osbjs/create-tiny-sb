import {
	addVec,
	color,
	createSprite,
	DefaultPallete,
	degToRad,
	Easing,
	fade,
	interpolateVec,
	Layer,
	loop,
	move,
	mulVecScalar,
	Origin,
	randFloat,
	rotate,
	scale
} from '@osbjs/tiny-osbjs'

/**
 * @typedef ParticlesOptions
 * @type {object}
 * @property {Easing} [easing] Easing applied to each particle' movement.
 * @property {number} [fadeDuration] Fade in/out duration.
 * @property {number} [particleCount] How many particles you want to generate.
 * @property {import('@osbjs/tiny-osbjs').Color} [particleColor] Color of each particle.
 * @property {number} [particleScale] Scale factor applied to each particle.
 * @property {number} [particleStartAngle] The angle of each particle at the start of the animation.
 * @property {number} [particleOpacity] Opacity of each particle.
 * @property {import('@osbjs/tiny-osbjs').Vector2} [spawnOrigin] Where the particles spawn.
 * @property {number} [maxDistanceFromSpawnOrigin] Maximum distance from origin that particles can be spawned.
 * @property {[number, number]} [angleRange] The angle used to determine which direction the particles are moving toward.
 * @property {number} [speed] How many osu pixel each particle travels per second.
 * @property {number} [lifetime] How long in miliseconds each particle can stay visible.
 */

/**
 * @param {ParticlesOptions} options
 */
function useDefaultOptionsIfEmpty(options) {
	return {
		easing: Easing.Linear,
		fadeDuration: 300,
		particleCount: 20,
		particleColor: DefaultPallete.White,
		particleRotation: 0,
		particleScale: 1,
		particleOpacity: 1,
		spawnOrigin: [420, 0],
		spawnSpread: 360,
		angle: 110,
		angleSpread: 60,
		speed: 480,
		lifetime: 1000,
		...options
	}
}

/**
 * Show particles falling on screen.
 * @param {number} startTime Start time of the effect.
 * @param {number} endTime End time of the effect.
 * @param {string} spritePath Relative path to the particle image, ex: `sb/petal.png`.
 * @param {ParticlesOptions} options Read the type definition to see which options you can override.
 */
export default function Particles(startTime, endTime, spritePath, options) {
	const {
		easing,
		fadeDuration,
		particleCount,
		particleColor,
		particleRotation,
		particleScale,
		particleOpacity,
		spawnOrigin,
		spawnSpread,
		angle,
		angleSpread,
		speed,
		lifetime
	} = useDefaultOptionsIfEmpty(options)

	const duration = endTime - startTime
	const loopCount = Math.max(1, Math.floor(duration / lifetime))
	const loopDuration = duration / loopCount

	for (let i = 0; i < particleCount; i++) {
		const spawnAngle = randFloat(0, Math.PI * 2)
		const spawnDistance = spawnSpread * Math.sqrt(randFloat(0, 1))

		const moveAngle = degToRad(angle + randFloat(-angleSpread, angleSpread) / 2)
		const moveDistance = speed * lifetime * 0.001

		const spriteRotation = degToRad(particleRotation) + moveAngle

		const startPosition = addVec(
			spawnOrigin,
			mulVecScalar([Math.cos(spawnAngle), Math.sin(spawnAngle)], spawnDistance)
		)
		const endPosition = addVec(
			startPosition,
			mulVecScalar([Math.cos(moveAngle), Math.sin(moveAngle)], moveDistance)
		)

		if (willParticleGoOutsideOfPlayfield(startPosition, endPosition, loopDuration)) continue

		createSprite(spritePath, Layer.Background, Origin.Centre, startPosition, () => {
			color(startTime, particleColor)
			scale(startTime, particleScale)
			rotate(startTime, spriteRotation)

			loop(startTime, loopCount, () => {
				fade([0, fadeDuration], 0, particleOpacity)
				fade([loopDuration - fadeDuration, loopDuration], particleOpacity, 0)
				move([0, loopDuration], startPosition, endPosition, easing)
			})
		})
	}
}

/**
 * Precompute to see if the particle will go outside of the playfield at some point.
 * @param {import('@osbjs/tiny-osbjs').Vector2} startPosition
 * @param {import('@osbjs/tiny-osbjs').Vector2} endPostion
 * @param {number} loopDuration
 */
function willParticleGoOutsideOfPlayfield(startPosition, endPostion, loopDuration) {
	for (let t = 0; t < loopDuration; t++) {
		const [x, y] = interpolateVec(startPosition, endPostion, t / loopDuration)
		if (x > 747 || x < -107 || y < 0 || y > 480) return true
	}
	return false
}

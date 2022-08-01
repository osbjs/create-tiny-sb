import {
	addVec,
	color,
	Color,
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
	scale,
	Vector2
} from '@osbjs/tiny-osbjs'

export type ParticlesOptions = {
	/**
	 * Easing applied to each particle' movement.
	 */
	easing?: Easing
	/**
	 * Fade in/out duration.
	 */
	fadeDuration?: number
	/**
	 * How many particles you want to generate.
	 */
	particleCount?: number
	/**
	 * Color of each particle.
	 */
	particleColor?: Color
	/**
	 * Scale factor applied to each particle.
	 */
	particleScale?: number
	/**
	 * The angle of each particle at the start of the animation.
	 */
	particleStartAngle?: number
	/**
	 * Opacity of each particle.
	 */
	particleOpacity?: number
	/**
	 * Where the particles spawn.
	 */
	spawnOrigin?: Vector2
	/**
	 * Maximum distance from origin that particles can be spawned.
	 */
	maxDistanceFromSpawnOrigin?: number
	/**
	 * The angle used to determine which direction the particles are moving toward.
	 */
	angleRange?: [number, number]
	/**
	 * How many osu pixel each particle travels per second.
	 */
	speed?: number
	/**
	 * How long in miliseconds each particle can stay visible.
	 */
	lifetime?: number
}

function useDefaultOptionsIfEmpty(options: ParticlesOptions) {
	return {
		easing: Easing.Linear,
		fadeDuration: 300,
		particleCount: 20,
		particleColor: DefaultPallete.White,
		particleStartAngle: 0,
		particleScale: 1,
		particleOpacity: 1,
		spawnOrigin: [420, 0] as Vector2,
		maxDistanceFromSpawnOrigin: 10,
		angleRange: [50, 150],
		speed: 480,
		lifetime: 1000,
		...options
	}
}

/**
 * Show particles falling on screen.
 * @param startTime Start time of the effect.
 * @param endTime End time of the effect.
 * @param spritePath Relative path to the particle image, ex: `sb/petal.png`.
 * @param options Read the type definition to see which options you can override.
 */
export default function Particles(startTime: number, endTime: number, spritePath: string, options: ParticlesOptions) {
	const {
		easing,
		fadeDuration,
		particleCount,
		particleColor,
		particleStartAngle,
		particleScale,
		particleOpacity,
		spawnOrigin,
		maxDistanceFromSpawnOrigin,
		angleRange,
		speed,
		lifetime
	} = useDefaultOptionsIfEmpty(options)

	const duration = endTime - startTime
	const loopCount = Math.max(1, Math.floor(duration / lifetime))
	const loopDuration = duration / loopCount

	for (let i = 0; i < particleCount; i++) {
		const spawnAngle = randFloat(0, Math.PI * 2)
		const spawnDistance = maxDistanceFromSpawnOrigin * randFloat(0, 1)

		const [minAngle, maxAngle] = angleRange
		const moveAngle = degToRad(randFloat(minAngle, maxAngle))
		const moveDistance = speed * lifetime * 0.001

		const particleEndRotation = degToRad(particleStartAngle) + moveAngle

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

			loop(startTime, loopCount, () => {
				fade([0, fadeDuration], 0, particleOpacity)
				fade([loopDuration - fadeDuration, loopDuration], particleOpacity, 0)
				move([0, loopDuration], startPosition, endPosition, easing)
				rotate([0, loopDuration], particleStartAngle, particleEndRotation)
			})
		})
	}
}

/**
 * Precompute to see if the particle will go outside of the playfield at some point.
 */
function willParticleGoOutsideOfPlayfield(startPosition: Vector2, endPostion: Vector2, loopDuration: number): boolean {
	for (let t = 0; t < loopDuration; t++) {
		const [x, y] = interpolateVec(startPosition, endPostion, t / loopDuration)
		if (x > 747 || x < -107 || y < 0 || y > 480) return true
	}
	return false
}

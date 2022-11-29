#!/usr/bin/env node

import fs from 'fs-extra'
import { blue, green, red, reset, yellow } from 'kolorist'
import minimist from 'minimist'
import path from 'path'
import prompts from 'prompts'
import { fileURLToPath } from 'url'

const TEMPLATES = [
	{
		name: 'ts',
		color: blue
	},
	{
		name: 'js',
		color: yellow
	}
]

const argv = minimist(process.argv.slice(2), { string: ['_'] })
const cwd = process.cwd()

async function init() {
	let targetDir = formatTargetDir(argv._[0])
	let template = argv.template || argv.t

	const defaultTargetDir = 'my-storyboard'
	const getProjectName = () => (targetDir === '.' ? path.basename(path.resolve()) : targetDir)

	let result = {}

	try {
		result = await prompts(
			[
				{
					type: targetDir ? null : 'text',
					name: 'projectName',
					message: reset('Project name:'),
					initial: defaultTargetDir,
					onState: (state) => {
						targetDir = formatTargetDir(state.value) || defaultTargetDir
					}
				},
				{
					type: () => (!fs.existsSync(targetDir) || isEmpty(targetDir) ? null : 'confirm'),
					name: 'overwrite',
					message: () =>
						(targetDir === '.' ? 'Current directory' : `Target directory "${targetDir}"`) +
						` is not empty. Remove existing files and continue?`
				},
				{
					type: (_, { overwrite } = {}) => {
						if (overwrite === false) {
							throw new Error(red('✖') + ' Operation cancelled')
						}
						return null
					},
					name: 'overwriteChecker'
				},
				{
					type: () => (isValidPackageName(getProjectName()) ? null : 'text'),
					name: 'packageName',
					message: reset('Package name:'),
					initial: () => toValidPackageName(getProjectName()),
					validate: (dir) => isValidPackageName(dir) || 'Invalid package.json name'
				},
				{
					type: template && TEMPLATES.some((t) => t.name == template) ? null : 'select',
					name: 'template',
					message:
						typeof template === 'string' && !TEMPLATES.some((t) => t.name == template)
							? reset(`"${template}" isn't a valid template. Please choose from below: `)
							: reset('Select a template:'),
					initial: 0,
					choices: TEMPLATES.map((t) => ({ title: t.color(t.name), value: t.name }))
				},
				{
					type: 'confirm',
					message: reset('With prebuilt components?'),
					name: 'withComps',
					initial: true
				}
			],
			{
				onCancel: () => {
					throw new Error(red('✖') + ' Operation cancelled')
				}
			}
		)
	} catch (e) {
		console.log(e)
		return
	}
	const { template: _template, packageName, withComps } = result
	const root = path.join(cwd, targetDir)

	console.log(`\nScaffolding project in ${green(root)}...`)

	const templateDir = path.resolve(fileURLToPath(import.meta.url), '..', `templates`, _template)

	fs.emptyDirSync(root)

	fs.copySync(templateDir, root)

	// rename gitignore
	fs.renameSync(path.join(root, '_gitignore'), path.join(root, '.gitignore'))

	// delete prebuilts comps if it's not needed
	if (!withComps) fs.emptyDirSync(path.join(root, 'components'))

	// rename package.json
	const pkg = JSON.parse(fs.readFileSync(path.join(root, `package.json`), 'utf-8'))

	pkg.name = packageName || getProjectName()

	fs.writeFileSync(path.join(root, `package.json`), JSON.stringify(pkg, null, 4), 'utf-8')

	const pkgInfo = pkgFromUserAgent(process.env.npm_config_user_agent)
	const pkgManager = pkgInfo ? pkgInfo.name : 'npm'

	console.log('\nDone. Now install dependencies with your favourite package manager, ex:\n')
	switch (pkgManager) {
		case 'yarn':
			console.log(`  ${yellow(yarn)}`)
			console.log(`  ${yellow(yarn)} start`)
			break
		default:
			console.log(`  ${yellow(pkgManager)} install`)
			console.log(`  ${yellow(pkgManager)} run start`)
			break
	}
	console.log('\nAnd then start building your storyboard.')
	console.log(`\nMake sure to update your ${blue('config.' + _template)} file`)
}

/**
 * @param {string | undefined} targetDir
 */
function formatTargetDir(targetDir) {
	return targetDir?.trim().replace(/\/+$/g, '')
}

/**
 * @param {string} path
 */
function isEmpty(path) {
	const files = fs.readdirSync(path)
	return files.length === 0 || (files.length === 1 && files[0] === '.git')
}

/**
 * @param {string} projectName
 */
function isValidPackageName(projectName) {
	return /^(?:@[a-z0-9-*~][a-z0-9-*._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/.test(projectName)
}

/**
 * @param {string} projectName
 */
function toValidPackageName(projectName) {
	return projectName
		.trim()
		.toLowerCase()
		.replace(/\s+/g, '-')
		.replace(/^[._]/, '')
		.replace(/[^a-z0-9-~]+/g, '-')
}

init().catch((e) => {
	console.log(e)
})

/**
 * @param {string|undefined} userAgent
 */
function pkgFromUserAgent(userAgent) {
	if (!userAgent) return undefined
	const pkgSpec = userAgent.split(' ')[0]
	const pkgSpecArr = pkgSpec.split('/')
	return {
		name: pkgSpecArr[0],
		version: pkgSpecArr[1]
	}
}

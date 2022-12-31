var packs = [];

const onDrop = async (e) => {
	e.preventDefault()
	if(!e.dataTransfer) return

	const promises = []
	for (let i = 0; i < e.dataTransfer.files.length; i++) {
		const file = e.dataTransfer.files[i]
		if (file.type.match(/^application\/(x-)?zip(-compressed)?$/)) {
			promises.push(Pack.fromZip(file))
		}
	}
	if (promises.length === 0) {
		addError('loading', new Error('The dropped files contain no zip files. Please zip the data pack first.'))
	} else {
		const newPacks = await Promise.all(promises.map(async promise => {
			try {
				return await promise
			} catch (error) {
				addError('loading', error)
				console.error(error)
				return
			}
		}))
		var packs = [...packs, ...newPacks.flat().filter((p) => p !== undefined)];
		packs.map(pack => packCard({pack, config, source, target, doDownload})) // config etc
	}
}

async function fromZip(file) {
	const buffer = await file.arrayBuffer()
	const zip = await JSZip.loadAsync(buffer)

	const metaFiles = zip.filter(path => path.endsWith('pack.mcmeta') && !path.startsWith('__MACOSX/'))
	if (metaFiles.length === 0) {
		throw new Error('Cannot find any "pack.mcmeta" files.')
	}
	return Promise.all(metaFiles.map(metaFile => {
		const rootPath = metaFile.name.replace(/\/?pack.mcmeta$/, '')
		const name = rootPath.length === 0
			? file.name.replace(/\.zip$/, '')
			: rootPath.split('/').pop()
		return loadPack(name, zip.folder(rootPath))
	}))
}

async function loadPack(name, root) {
	const pack = {
		id: hexId(),
		name: name,
		root,
		status: 'loaded',
		data: {},
		meta: {
			name: 'pack',
			...await loadJson(root.file('pack.mcmeta')),
		},
	}
	await Promise.all(categories.map(async category => {
		pack.data[category] = await loadCategory(root.folder('data'), category)
	}))
	pack.data.functions = await loadFunctions(root.folder('data'))
	console.log(pack)
	return pack
}

async function loadJson(file) {
	let text = await file.async('text');
	const indent = detectIndent(text).indent // re-adds original indent to files
	try {
		text = text.replaceAll('\u200B', '').replaceAll('\u200C', '').replaceAll('\u200D', '').replaceAll('\uFEFF', '')
		text = text.split('\n').map(l => l.replace(/^([^"\/]+)\/\/.*/, '$1')).join('\n')
		text = text.replace(/\\"|"(?:\\"|[^"])*"|(\/\/.*|\/\*[\s\S]*?\*\/)/g, (m, g) => g ? "" : m)
		return { data: JSON.parse(text), indent }
	} catch (e) {
		throw new Error(`Cannot parse file "${file.name}": ${e.message}.`)
	}
}

async function loadCategory(root, category) {
	const matcher = new RegExp(`^([^\/]+)\/${category}\/(.*)\.json$`)
	const files = []
	root.forEach((path, file) => {
		const match = path.match(matcher)
		if (match && match[1] && match[2]) {
			files.push({ name: `${match[1]}:${match[2]}`, file })
		}
	})
	return Promise.all(files.map(async ({ name, file }) => {
		try {
			const data = await loadJson(file)
			return { name, ...data }
		} catch (e) {
			return { name, data: undefined, error: e.message }
		}
	}))
}

async function loadFunctions(root) {
	const matcher = /([^\/]+)\/functions\/(.*)\.mcfunction$/
	return Promise.all(root.filter((path) => path.match(matcher) !== null)
		.map(async file => {
			const m = file.name.match(matcher)
			return {
				name: `${m[1]}:${m[2]}`,
				data: (await file.async('text')).split('\n'),
			}
		})
	)
}

// ################################################################################

async function packCard({ pack, config, source, target, onError, onRemove, onDone, doDownload }) { // Custom
	await upgrade(pack, { features: config, source, target, onPrompt, onWarning })
	const download = await toZip(pack)
}

const Versions = ['1.16.5', '1.17.1', '1.18.1', '1.18.2', '1.19', '1.19.3']
const PackFormats = [6, 7, 8, 9, 10, 10]

async function upgrade(pack, config) {
	if (pack.status !== 'loaded') {
		throw new Error(`Cannot upgrade pack with status '${pack.status}'.`)
	}

	let source
	const packFormat = pack.meta.data.pack.pack_format
	if (config.source === 'auto') {
		const index = PackFormats.indexOf(packFormat)
		if (index === -1) index = undefined
		detectedVersion = Versions[index]
		
		if (detectedVersion === undefined) {
			if (packFormat < PackFormats[0]) source = Versions[0]
			else source = Versions[Versions.length - 1]

			config.onWarning(`No matching version found for pack format ${packFormat}, using fallback ${source}`)
		} else {
			source = detectedVersion
		}
	} else {
		if (packFormat !== PackFormats[Versions.indexOf(config.source)]) {
			throw new Error(`Found pack format ${packFormat}, which does not match version ${config.source}`)
		}
		source = config.source
	}
	const target = config.target
	if (Versions.indexOf(target) < Versions.indexOf(source)) {
		throw new Error(`Invalid version range: ${source} > ${target}`)
	}

	const ctx = {
		warn: config.onWarning,
		prompt: config.onPrompt,
		source: () => source,
		target: () => target,
		config: (key) => config.features[key],
		read: (category, name) => {
			return pack.data[category].find(f =>
				f.error === undefined &&
				f.name.replace(/^minecraft:/, '') === name.replace(/^minecraft:/, ''))
		},
		create: (category, name, data) => {
			pack.data[category].push({
				name: name,
				indent: pack.meta.indent,
				data,
			})
		},
	}

	await Fixes(pack, ctx) // runs updates
	pack.status = 'upgraded'
}

async function toZip(pack) {
	if (pack.status !== 'upgraded') {
		throw new Error(`Cannot download pack with status ${pack.status}.`)
	}
	categories.forEach(category => {
		writeCategory(pack.root.folder('data'), category, pack.data[category] ?? [])
	})
	writeFunctions(pack.root.folder('data'), pack.data.functions ?? [])
	writeJson(pack.root, 'pack.mcmeta', pack.meta.data, pack.meta.indent)
	const blob = await pack.root.generateAsync({ type: 'blob', compression: 'DEFLATE' })
	const url = URL.createObjectURL(blob)
	pack.status = 'done'
	return url
}
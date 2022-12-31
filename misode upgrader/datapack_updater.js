import { Pack } from './Pack'

// Initialize ZIP file
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
		// addError('loading', new Error('The dropped files contain no zip files. Please zip the data pack first.'))
	} else {
		const newPacks = await Promise.all(promises.map(async promise => {
			try {
				return await promise
			} catch (error) {
				// addError('loading', error)
				console.error(error)
				return
			}
		}))
		var packs = [...packs, ...newPacks.flat().filter((p) => p !== undefined)];
		packs.map(pack => packCard({pack, config, source, target, doDownload})) // config etc
	}
}



// Update file
async function packCard({ pack, config, source, target, onError, onRemove, onDone, doDownload }) { // Custom
	await Pack.upgrade(pack, { features: config, source, target, onPrompt, onWarning })
	const download = await Pack.toZip(pack) // return blob instead of url
}
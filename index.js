const { InstanceBase, InstanceStatus, runEntrypoint } = require('@companion-module/base')

const UpgradeScripts = require('./src/upgrades')

const configFields = require('./src/configFields')
const constants = require('./src/constants')
const api = require('./src/api')
const actions = require('./src/actions')
const feedbacks = require('./src/feedbacks')
const variables = require('./src/variables')
const presets = require('./src/presets')

class PanasonicTVTHInstance extends InstanceBase {
	constructor(internal) {
		super(internal)

		// Assign the methods from the listed files to this class
		Object.assign(this, {
			...configFields,
			...constants,
			...api,
			...actions,
			...feedbacks,
			...variables,
			...presets,
		})

		this.socket = undefined // TCP Socket connection
		this.socketTimer = undefined // Timer for TCP Socket reconnection

		this.INTERVAL = undefined // Polling Interval
	}

	async init(config) {
		this.configUpdated(config)
	}

	async configUpdated(config) {
		this.config = config

		this.setProtocol()

		this.initActions()
		this.initFeedbacks()
		this.initVariables()
		this.initPresets()

		this.initConnection()

		this.checkFeedbacks()
		this.checkVariables()
	}

	async destroy() {
		if (this.socket !== undefined) {
			this.socket.destroy()
		}

		if (this.INTERVAL !== undefined) {
			clearInterval(this.INTERVAL)
		}

		this.debug('destroy', this.id)
	}
}

runEntrypoint(PanasonicTVTHInstance, UpgradeScripts)

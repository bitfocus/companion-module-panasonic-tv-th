const { InstanceStatus, TCPHelper } = require('@companion-module/base')

let crypto = require('crypto')

module.exports = {
	initConnection: function () {
		let self = this

		if (self.socket !== undefined) {
			self.socket.destroy()
			delete self.socket
		}

		if (self.socketTimer) {
			clearInterval(self.socketTimer)
			delete self.socketTimer
		}

		if (self.INTERVAL) {
			clearInterval(self.INTERVAL)
			delete self.INTERVAL
		}

		self.updateStatus(InstanceStatus.Connecting)

		if (self.config.host && self.config.host !== '') {
			self.socket = new TCPHelper(self.config.host, self.config.port)

			self.socket.on('error', function (err) {
				self.updateStatus(InstanceStatus.ConnectionFailure, err.toString())
				self.log('error', 'Network Error: ' + err.message)
			})

			self.socket.on('connect', function (socket) {
				self.updateStatus(InstanceStatus.Ok)
				self.checkPowerStatus()
				self.getData() // get initial data
				self.initPolling()
			})

			self.socket.on('data', function (d) {
				let data = String(d).trim()

				if (self.config.verbose === true) {
					self.log('debug', 'Data received: ' + data)
				}

				self.processData(data)
			})

			self.socket.on('end', function () {
				self.log('error', 'Display Disconnected')
				self.updateStatus(InstanceStatus.ConnectionFailure, 'Display Disconnected')

				if (self.INTERVAL) {
					//stop polling
					self.log('debug', 'Stopping Polling')
					clearInterval(self.INTERVAL)
					delete self.INTERVAL
				}

				// set timer to retry connection in 30 secs
				if (self.socketTimer) {
					clearInterval(self.socketTimer)
					delete self.socketTimer
				}

				self.log('debug', 'Setting timer to retry connection in 30 secs')

				self.socketTimer = setInterval(function () {
					self.updateStatus(InstanceStatus.Connecting)
					self.initConnection()
				}, 30000)
			})
		}
	},

	initPolling: function () {
		let self = this

		if (self.INTERVAL) {
			clearInterval(self.INTERVAL)
			delete self.INTERVAL
		}

		if (self.config.enablePolling) {
			if (self.config.verbose) {
				self.log('debug', 'Initializing Polling')
			}

			self.INTERVAL = setInterval(self.getData.bind(self), self.config.pollTime)
		}
	},

	getData: function () {
		let self = this

		self.checkPowerStatus() // get power status
	},

	checkPowerStatus: function () {
		let self = this
		if (self.protocol === 'new') {
			if (self.socket !== undefined && self.socket.isConnected) {
				if (self.config.verbose) {
					self.log('debug', 'Checking power status...')
				}
				self.socket.send(self.hash + '00QPW' + '\r')
			} else {
				debug('Socket not connected :(')
			}
		} else {
			// old protocol does not have a power status command
		}
	},

	processData: function (data) {
		let self = this

		if (data === 'Login:') {
			self.socket.send(self.config.user + '\r')
			if (self.config.verbose == true) {
				console.log('Response: ' + self.config.user)
			}
		}
		if (data === 'Password:') {
			self.socket.send(self.config.pass + '\r')
			if (self.config.verbose == true) {
				console.log('Response: ' + self.config.pass)
			}
		}
		if (data.match(/NTCONTROL\s1\s\w+/)) {
			self.log('debug', 'New Command Structure Detected')
			let seed = data.split(' ')[2].trim()
			self.hash = crypto
				.createHash('md5')
				.update(self.config.user + ':' + self.config.pass + ':' + seed)
				.digest('hex')
		}

		if (data.match(/PDPCONTROL\s1\s\w+/)) {
			self.log('debug', 'Protect Mode on, Generating Hash from seed and password from config')

			let seed = data.split(' ')[2].trim()
			self.hash = crypto
				.createHash('md5')
				.update(seed + self.config.pass)
				.digest('hex')

			self.log('debug', 'Seed: ' + seed)
			self.log('debug', 'Password: ' + self.config.pass)

			self.log('debug', 'Hash: ' + self.hash)
		}

		if (data === '000' || data === '00POF' || data.indexOf('POF') !== -1) {
			self.log('info', 'TV is Off')
			self.DATA.powerState = 0
		}

		if (data === '001' || data === '00PON' || data.indexOf('PON') !== -1) {
			self.log('info', 'TV is On')
			self.DATA.powerState = 1
		}
	},

	setProtocol: function () {
		let self = this

		let model = self.config.model

		//find model in CHOICES_MODELS to get protocol
		let modelObj = self.CHOICES_MODELS.find((m) => m.id === model)

		self.protocol = 'old' //default to old protocol

		if (modelObj === undefined) {
			//if model not found, default to old protocol
			self.protocol = 'old'
		} else if (model == 'other') {
			//if model is other, use protocolVersion selected in module config
			self.protocol = self.config.protocolVersion
		} else {
			self.protocol = modelObj.protocol
		}

		self.log('debug', 'Protocol set to: ' + self.protocol)
	},

	sendCommand: function (command, params) {
		let self = this
		let cmd = undefined

		if (self.protocol === 'old') {
			cmd = ''
			if (self.hash !== undefined) {
				//if the hash is set, protect mode must be on
				cmd = self.hash
			}

			// old protocol
			cmd += '\x02' + command //STX
			if (params !== undefined) {
				cmd += ':' + params
			}
			cmd += '\x03' //ETX
			cmd += '\r' //CR
		} else {
			// new protocol
			if (command !== undefined) {
				if (params !== undefined) {
					cmd = `${self.hash}00${command}:${params}\r`
				} else {
					cmd = `${self.hash}00${command}\r`
				}
			}
		}

		if (cmd && self.socket && self.socket.isConnected) {
			if (self.config.verbose) {
				self.log('debug', `Sending ${cmd} to ${self.config.host}`)
			}

			const bufferCmd = Buffer.from(cmd)
			self.socket.send(bufferCmd)
		} else {
			self.log('debug', 'Socket not connected :(')
		}
	},
}

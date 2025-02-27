module.exports = {
	initVariables() {
		let self = this

		let variables = []

		if (self.protocol === 'new') {
			variables.push({ variableId: 'powerState', name: 'TV Power Status' })
		} else {
		}

		self.setVariableDefinitions(variables)
	},

	checkVariables() {
		let self = this

		try {
			let variableObj = {}

			if (self.protocol === 'new') {
				variableObj['powerState'] = self.DATA.powerState ? 'On' : 'Off'
			} else {
			}

			this.setVariableValues(variableObj)
		} catch (error) {
			//do something with that error
			if (this.config.verbose) {
				this.log('debug', 'Error Updating Variables: ' + error)
			}
		}
	},
}

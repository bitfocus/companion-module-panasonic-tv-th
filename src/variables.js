module.exports = {
	initVariables() {
		let self = this

		let variables = []

		if (self.protocol === 'new') {
			variables.push({ variableId: 'powerState', name: 'TV Power Status' })
		} else {
			variables.push({ variableId: 'powerLast', name: 'Power - Last Command Sent' })
			variables.push({ variableId: 'volumeLast', name: 'Volume - Last Command Sent' })
			variables.push({ variableId: 'muteLast', name: 'Mute - Last Command Sent' })
			variables.push({ variableId: 'inputLast', name: 'Input - Last Command Sent' })
			variables.push({ variableId: 'viewmodeLast', name: 'View Mode - Last Command Sent' })
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
				variableObj['powerLast'] = self.DATA.powerLast ? 'On' : 'Off'
				variableObj['volumeLast'] = self.DATA.volumeLast
				variableObj['muteLast'] = self.DATA.muteLast ? 'On' : 'Off'
				let inputLast = self.CHOICES_IMS.find((i) => i.id === self.DATA.inputLast)
				if (inputLast !== undefined) {
					variableObj['inputLast'] = inputLast.label
				} else {
					variableObj['inputLast'] = self.DATA.inputLast
				}

				let viewmodeLast = self.CHOICES_DAM.find((v) => v.id === self.DATA.viewmodeLast)
				if (viewmodeLast !== undefined) {
					variableObj['viewmodeLast'] = viewmodeLast.label
				} else {
					variableObj['viewmodeLast'] = self.DATA.viewmodeLast
				}
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

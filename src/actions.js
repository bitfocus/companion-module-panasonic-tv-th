module.exports = {
	initActions() {
		let self = this
		let actions = {}

		actions.PON = {
			name: 'System - Power ON',
			options: [],
			callback: function (action, bank) {
				self.sendCommand('PON')
				self.DATA.powerLast = true
				self.checkVariables()
			},
		}

		actions.POF = {
			name: 'System - Power OFF',
			options: [],
			callback: function (action, bank) {
				self.sendCommand('POF')
				self.DATA.powerLast = false
				self.checkVariables()
			},
		}

		actions.AVL = {
			name: 'Audio - Set Volume',
			options: [
				{
					type: 'textinput',
					id: 'action',
					label: 'Volume 0-100%',
					default: 50,
					useVariables: true,
				},
			],
			callback: async function (action, bank) {
				let volume = await self.parseVariablesInString(action.options.action)
				//make sure volume is a 3 digit value between 000 and 100
				volume = volume.toString().padStart(3, '0')
				self.sendCommand('AVL', volume)
				self.DATA.volumeLast = volume
				self.checkVariables()
			},
		}

		actions.AMT = {
			name: 'Audio - Mute',
			options: [
				{
					type: 'dropdown',
					id: 'action',
					label: 'Mute State',
					default: self.CHOICES_AMT[0].id,
					choices: self.CHOICES_AMT,
				},
			],
			callback: function (action, bank) {
				self.sendCommand('AMT', action.options.action)
				self.DATA.muteLast = action.options.action === '1' ? true : false
				self.checkVariables()
			},
		}

		actions.IMS = {
			name: 'Video - Input Select',
			options: [
				{
					type: 'dropdown',
					id: 'action',
					label: 'Input',
					default: self.CHOICES_IMS[0].id,
					choices: self.CHOICES_IMS,
				},
			],
			callback: function (action, bank) {
				self.sendCommand('IMS', action.options.action)
				self.DATA.inputLast = action.options.action
				self.checkVariables()
			},
		}

		actions.DAM = {
			name: 'Video - View Mode',
			options: [
				{
					type: 'dropdown',
					id: 'action',
					label: 'Mode:',
					default: self.CHOICES_DAM[0].id,
					choices: self.CHOICES_DAM,
				},
			],
			callback: function (action, bank) {
				self.sendCommand('DAM', action.options.action)
				self.DATA.viewmodeLast = action.options.action
				self.checkVariables()
			},
		}

		self.setActionDefinitions(actions)
	},
}

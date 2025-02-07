const { combineRgb } = require('@companion-module/base')

module.exports = {
	initFeedbacks() {
		let self = this
		const feedbacks = {}

		const foregroundColorWhite = combineRgb(255, 255, 255) // White
		const backgroundColorRed = combineRgb(255, 0, 0) // Red

		if (self.config.protocol === 'new') {
			feedbacks['powerState'] = {
				type: 'boolean',
				name: 'Show Power State On Button',
				description: 'Indicate if Display is On or Off',
				defaultStyle: {
					color: foregroundColorWhite,
					bgcolor: backgroundColorRed,
				},
				options: [
					{
						type: 'dropdown',
						label: 'Indicate in X Status',
						id: 'state',
						default: false,
						choices: [
							{ id: false, label: 'Off' },
							{ id: true, label: 'On' },
						],
					},
				],
				callback: function (feedback) {
					let opt = feedback.options

					if (self.DATA.powerState == opt.state) {
						return true
					}

					return false
				},
			}
		} else {
			feedbacks['powerLast'] = {
				type: 'boolean',
				name: 'Show Power State On Button',
				description: 'Indicate if Display is On or Off',
				defaultStyle: {
					bgcolor: backgroundColorRed,
					color: foregroundColorWhite,
				},
				options: [],
				callback: function (feedback) {
					if (self.DATA.powerLast == true) {
						return true
					}
					return false
				},
			}

			feedbacks['muteLast'] = {
				type: 'boolean',
				name: 'Show Mute State On Button',
				description: 'Indicate if Display is Muted',
				defaultStyle: {
					bgcolor: backgroundColorRed,
					color: foregroundColorWhite,
				},
				options: [],
				callback: function (feedback) {
					if (self.DATA.muteLast == true) {
						return true
					}
					return false
				},
			}

			feedbacks['inputLast'] = {
				type: 'boolean',
				label: 'Show Input On Button',
				description: 'Indicate the Current Selected Input',
				defaultStyle: {
					bgcolor: backgroundColorRed,
					color: foregroundColorWhite,
				},
				options: [
					{
						type: 'dropdown',
						label: 'Input',
						id: 'input',
						default: self.CHOICES_IMS[0].id,
						choices: self.CHOICES_IMS,
					},
				],
				callback: function (feedback) {
					if (self.DATA.inputLast !== '') {
						return true
					}
					return false
				},
			}

			feedbacks['viewmodeLast'] = {
				type: 'boolean',
				label: 'Show View Mode On Button',
				description: 'Indicate the Current View Mode',
				defaultStyle: {
					bgcolor: backgroundColorRed,
					color: foregroundColorWhite,
				},
				options: [
					{
						type: 'dropdown',
						label: 'Mode',
						id: 'mode',
						default: self.CHOICES_DAM[0].id,
						choices: self.CHOICES_DAM,
					},
				],
				callback: function (feedback) {
					if (self.DATA.viewmodeLast !== '') {
						return true
					}
					return false
				},
			}
		}

		self.setFeedbackDefinitions(feedbacks)
	},
}

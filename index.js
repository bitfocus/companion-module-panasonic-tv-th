var tcp = require("../../tcp");
var instance_skel = require("../../instance_skel");
var debug;
var log;
var cmd_debug = true;

function instance(system, id, config) {
  var self = this;

  // super-constructor
  instance_skel.apply(this, arguments);

  self.actions(); // export actions
  self.init_presets();

  return self;
}

instance.prototype.updateConfig = function (config) {
  var self = this;
  self.init_presets();

  if (self.socket !== undefined) {
    self.socket.destroy();
    delete self.socket;
  }

  self.config = config;
  self.init_tcp();
};

instance.prototype.init = function () {
  var self = this;

  debug = self.debug;
  log = self.log;
  self.init_presets();
  self.init_tcp();
};

instance.prototype.init_tcp = function () {
  var self = this;

  if (self.socket !== undefined) {
    self.socket.destroy();
    delete self.socket;
  }

  self.status(self.STATE_WARNING, "Connecting");

  if (self.config.host) {
    self.socket = new tcp(self.config.host, self.config.port);

    self.socket.on("status_change", function (status, message) {
      self.status(status, message);
    });

    self.socket.on("error", function (err) {
      debug("Network error", err);
      self.status(self.STATE_ERROR, err);
      self.log("error", "Network error: " + err.message);
    });

    self.socket.on("connect", function (socket) {
      self.status(self.STATE_OK);
      debug("Connected");
      console.log("Connected");

      socket.once("close", function () {
        console.log("Disconnect");
      });
    });

    self.socket.on("data", function (d) {
      if (cmd_debug === true) {
        console.log("Recv:", d);
      }

      if (String(d) === "Login:") {
        self.socket.write(self.config.user + "\r");
        if (cmd_debug == true) {
          console.log("Response: " + self.config.user);
        }
      }
      if (String(d).trim() === "Password:") {
        self.socket.write(self.config.pass + "\r");
        if (cmd_debug == true) {
          console.log("Response: " + self.config.pass);
        }
      }
    });
  }
};

// Return config fields for web config
instance.prototype.config_fields = function () {
  var self = this;

  return [
    {
      type: "textinput",
      id: "host",
      label: "Target IP",
      width: 8,
      regex: self.REGEX_IP,
    },
    {
      type: "textinput",
      id: "port",
      label: "Target Port (Default: 10101)",
      width: 4,
      default: 10101,
      regex: self.REGEX_PORT,
    },
    {
      type: "textinput",
      id: "user",
      label: "Username",
      width: 4,
      default: "dispadmin",
    },
    {
      type: "textinput",
      id: "pass",
      label: "Password",
      width: 4,
      default: "@Panasonic",
    },
  ];
};

instance.prototype.init_variables = function () {
  var self = this
  var variables = []
  if (self.protocol === "new") {
    variables.push({
      label: 'TV Power Status',
      name: 'powerState',
    })

    self.setVariableDefinitions(variables)
  }
}
// When module gets deleted
instance.prototype.destroy = function () {
  var self = this;

  if (self.socket !== undefined) {
    self.socket.destroy();
  }

  if (self.udp !== undefined) {
    self.udp.destroy();
  }

  debug("destroy", self.id);
};

instance.prototype.CHOICES_IMS = [
  { id: "HM1", label: "HDMI 1" },
  { id: "HM2", label: "HDMI 2" },
  { id: "PC1", label: "PC" },
  { id: "UD1", label: "USB" },
];

instance.prototype.CHOICES_DAM = [
  { id: "FULL", label: "Full" },
  { id: "NORM", label: "Normal" },
  { id: "NATV", label: "Native" },
  { id: "ZOOM", label: "Zoom" },
];

instance.prototype.CHOICES_AMT = [
  { id: "0", label: "Mute off" },
  { id: "1", label: "Mute on" },
];

instance.prototype.init_presets = function () {
  var self = this;
  var presets = [];
  var pstSize = "18";

  /*	presets.push({
		category: 'Inputs',
		label: 'TV',
		bank: {
			style: 'text',
			text: 'TV',
			size: pstSize,
			color: '16777215',
			bgcolor: 0
		},
		actions: [{
			action: 'input_tv',
		}]
	});

	for (var input in self.CHOICES_INPUTS) {
		presets.push({
			category: 'Inputs',
			label: self.CHOICES_INPUTS[input].label,
			bank: {
				style: 'text',
				text: self.CHOICES_INPUTS[input].label,
				size: pstSize,
				color: '16777215',
				bgcolor: 0
			},
			actions: [{
				action: 'input',
				options: {
					action: self.CHOICES_INPUTS[input].id,
				}
			}]
		});
	}
	*/
  self.setPresetDefinitions(presets);
};

instance.prototype.actions = function (system) {
  var self = this;

  self.setActions({
    PON: { label: "Power ON" },
    POF: { label: "Power OFF" },
    AVL: {
      label: "Set Volume",
      options: [
        {
          type: "number",
          id: "action",
          label: "Volume 0-100%",
          min: 1,
          max: 100,
          default: 50,
          required: true,
          range: false,
          regex: self.REGEX_NUMBER,
        },
      ],
		},
		AMT: {
      label: "Mute",
      options: [
        {
          type: "dropdown",
          id: "action",
          label: "Input",
          default: "1",
          choices: self.CHOICES_AMT
        },
      ],
    },
    IMS: {
      label: "Input Select",
      options: [
        {
          type: "dropdown",
          id: "action",
          label: "Input",
          default: "IM1",
          choices: self.CHOICES_IMS,
        },
      ],
    },

    DAM: {
      label: "View Mode",
      options: [
        {
          type: "dropdown",
          id: "action",
          label: "Mode:",
          default: "1",
          choices: self.CHOICES_DAM,
        },
      ],
    },
  });
};

instance.prototype.action = function (action) {
  var self = this;
  var cmd;
	console.log("XX", action);

	cmd = "\x02" + action.action
	if (action.options.action !== undefined) {
		cmd = cmd + ":" + action.options.action
	}
	cmd = cmd + "\x03\n"

  if (cmd !== undefined) {
    debug("sending ", cmd, "to", self.config.host);

    if (self.socket !== undefined && self.socket.connected) {
			self.socket.send(Buffer.from(cmd));
			console.log(cmd)
    } else {
      debug("Socket not connected :(");
    }
  }
};

instance.prototype.setProtocol = function () {
  var self = this
  self.protocol = this.isNewProtocol() ? 'new' : 'old';
  debug("Protocol:", self.protocol);
}

instance.prototype.isNewProtocol = function () {
  var self = this
  debug("Checking protocol version");
  switch (self.config.product) {
    case "TH-86CQ1W":
      return false;
    case "TH-75CQ1W":
      return false;
    case "TH-65CQ1W":
      return false;
    case "TH-55CQ1W":
      return false;
    case "TH-43CQ1W":
      return false;
    case "TH-49CQE1W":
      return true;
    default:
      false
  }
}
instance_skel.extendedBy(instance);
exports = module.exports = instance;

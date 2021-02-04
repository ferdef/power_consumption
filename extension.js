'use strict';

// imports.gi.versions.Gtk = '3.0';
// imports.gi.versions.WebKit2 = '4.0';

const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Clutter = imports.gi.Clutter;
const St = imports.gi.St;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;

const Lang = imports.lang;
const Mainloop = imports.mainloop;

const Config = imports.misc.config;
const SHELL_MINOR = parseInt(Config.PACKAGE_VERSION.split('.')[1]);

var label = null;
var indicator = null;

const POWER_SUPPLY_DIR = "/sys/class/power_supply";

var PowerConsumption = class PowerConsumption extends PanelMenu.Button {
  _init() {
    super._init(0.0, `${Me.metadata.name} Indicator`, false);

    label = new St.Label({
      text: get_data(),
      y_align: Clutter.ActorAlign.CENTER,
      style_class: 'power_consumption_label'
    });

    this.add_child(label);

    this._update();
  }

  _update() {
    label.set_text(get_data());
    Mainloop.timeout_add_seconds(1, Lang.bind(this, this._update));
  }
}

if (SHELL_MINOR > 30) {
  PowerConsumption = GObject.registerClass(
    { GTypeName: 'PowerConsumption' },
    PowerConsumption
  );
}

function find_devices(prefix) {
  let dir = Gio.File.new_for_path(POWER_SUPPLY_DIR);
  let fileEnum;
  try {
    fileEnum = dir.enumerate_children('standard::name,standard::type', Gio.FileQueryInfoFlags.NONE, null);
  } catch (e) {
    fileEnum = null;
  }

  let devices = [];

  if (fileEnum != null) {
    let info;
    while ((info = fileEnum.next_file(null))) {
      let child = fileEnum.get_child(info);
      if (child == null)
        continue;

      let basename = child.get_basename();
      if (basename.indexOf(prefix) !== -1)
        devices.push(basename);
    }
  }


  return devices;
}

function find_ac() {
  return find_devices("AC");
}

function find_batteries() {
  return find_devices("BAT");
}

function get_current(battery) {
  var filepath = `${POWER_SUPPLY_DIR}/${battery}/current_now`;
  if (GLib.file_test(filepath, GLib.FileTest.EXISTS)) {
    return parseInt(GLib.file_get_contents(filepath)[1]);
  }

  return -1;
}

function get_voltage(battery) {
  var filepath = `${POWER_SUPPLY_DIR}/${battery}/voltage_now`;
  if (GLib.file_test(filepath, GLib.FileTest.EXISTS)) {
    return parseInt(GLib.file_get_contents(filepath)[1]);
  }

  return -1;
}

function get_power_now(battery) {
  var filepath = `${POWER_SUPPLY_DIR}/${battery}/power_now`;
  if (GLib.file_test(filepath, GLib.FileTest.EXISTS)) {
    return parseInt(GLib.file_get_contents(filepath)[1]);
  }

  return -1;
}

function is_charging() {
  let ac_devices = find_ac();
  let ac_device = ac_devices.length > 0 ? ac_devices[0] : "AC";
  var filepath = `${POWER_SUPPLY_DIR}/${ac_device}/online`;
  if (GLib.file_test(filepath, GLib.FileTest.EXISTS)) {
    return parseInt(GLib.file_get_contents(filepath)[1]);
  }

  return -1;
}

function get_batt_info(battery) {
  var power_str = "N/A";
  var current = get_current(battery);
  var voltage = get_voltage(battery);
  var power_now = get_power_now(battery);
  var charging = is_charging();

  if (current > -1 && voltage > -1) {
    var raw_power = (current * voltage) / 1000000000000;

    var power = (Math.round(raw_power * 100) / 100).toFixed(2);

    power_str = `${String(power)} W`;
  } else if (power_now > -1) {
    var power = (Math.round(power_now) / 1000000).toFixed(2);

    power_str = `${String(power)} W`;
  }

  power_str = ((charging > 0) ? '+' : '-') + power_str;

  return (power_str);
}

function get_data() {
  let batteries = find_batteries();
  let powers = [];
  batteries.forEach((item) => {
    powers.push(get_batt_info(item));
  });
  return powers.join(" - ");
}

function init() {
  log(`initializing ${Me.metadata.name} version ${Me.metadata.version}`);
}

function enable() {

  indicator = new PowerConsumption();

  log(`Enabling ${Me.metadata.name} version ${Me.metadata.version}`);

  Main.panel.addToStatusArea(`${Me.metadata.name}`, indicator);
}

function disable() {
  log(`Disabling ${Me.metadata.name} version ${Me.metadata.version}`);

  if (indicator !== null) {
    indicator.destroy();
    indicator = null;
  }
}

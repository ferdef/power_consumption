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
    {GTypeName: 'PowerConsumption'},
    PowerConsumption
  );
}

function get_wattage_path() {
  return "/sys/class/power_supply/BAT1/power_now";
}

function get_wattage() {
  var filepath = get_wattage_path();
  if(GLib.file_test (filepath, GLib.FileTest.EXISTS)) {
    return parseInt(GLib.file_get_contents(filepath)[1]);
  }
}

function get_data() {
  var power_str = "N/A";
  var wattage = get_wattage();

  if (wattage) {
  
    var power = (Math.round(wattage * 100) / 100000000).toFixed(2);

    power_str = `${String(power)} W`;
  }
  
  return(power_str);
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

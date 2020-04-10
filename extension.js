'use strict';

// imports.gi.versions.Gtk = '3.0';
// imports.gi.versions.WebKit2 = '4.0';

const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
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

var ExampleIndicator = class ExampleIndicator extends PanelMenu.Button {
  _init() {
    super._init(0.0, `${Me.metadata.name} Indicator`, false);
    
    label = new St.Label({
      text: get_data()
    });

    this.add_child(label);
    
    let icon = new St.Icon({
      gicon: new Gio.ThemedIcon({name: 'face-laugh-symbolic'}),
      style_class: 'system-status-icon'
    });
    this.add_child(icon);  
    
    // Add a menu item
    this.menu.addAction("Preferences", this.menuAction, null);
    
    this._update();
  }
  
  _update() {
    label.set_text(get_data());
    Mainloop.timeout_add_seconds(1, Lang.bind(this, this._update));
  }
  
  menuAction() {
    log('Accesing Preferences');
  }
}

if (SHELL_MINOR > 30) {
  ExampleIndicator = GObject.registerClass(
    {GTypeName: 'ExampleIndicator'},
    ExampleIndicator
  );
}

function get_data() {
  var current_path = "/sys/class/power_supply/BAT0/current_now";
  var voltage_path = "/sys/class/power_supply/BAT0/voltage_now";
  var current = GLib.file_get_contents(current_path)[1];
  var voltage = GLib.file_get_contents(voltage_path)[1];
  
  var raw_power = (current * voltage) / 1000000000000;
  
  var power = (Math.round(raw_power * 100) / 100).toFixed(2);
  
  return(`${String(power)} W`);
}

function init() {
  log(`initializing ${Me.metadata.name} version ${Me.metadata.version}`);
}

function enable() {
 
  indicator = new ExampleIndicator();
  
  log(`Enabling ${Me.metadata.name} version ${Me.metadata.version}`);

  Main.panel.addToStatusArea(`${Me.metadata.name} Indicator`, indicator);
}

function disable() {
  log(`Disabling ${Me.metadata.name} version ${Me.metadata.version}`);
  
  if (indicator !== null) {
    indicator.destroy();
    indicator = null;
  }
}

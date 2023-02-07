'use strict';

const St = imports.gi.St;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const ByteArray = imports.byteArray;

const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Me = imports.misc.extensionUtils.getCurrentExtension();

class Extension {
  static get MEETING_MODE() {
    return 'handsfree_head_unit';
  }

  static get QUALITY_MODE() {
    return 'a2dp_sink';
  }

  static get TOP_BAR_LABEL() {
    return 'Headphones';
  }

  constructor() {
    this._menu = null;
    this._menuIcon = null;
    this._menuLabel = null;
    this._toggleProfileMenuItem = null;
    this._updateInterval = null;

    this._giconDisconnected = new Gio.ThemedIcon({
      name: 'action-unavailable-symbolic',
    });
    this._giconMeeting = new Gio.ThemedIcon({
      name: 'audio-input-microphone-symbolic',
    });
    this._giconQuality = new Gio.ThemedIcon({
      name: 'audio-headphones-symbolic',
    });
  }

  enable() {
    log(`enabling ${Me.metadata.name}`);
    this.createMenu();
    this.createToggleProfileMenuItem();
    this.createUpdateInterval();
  }

  disable() {
    log(`disabling ${Me.metadata.name}`);

    this._menu.destroy();
    this._menu = null;

    this._menuIcon.destroy();
    this._menuIcon = null;

    this._menuLabel.destroy();
    this._menuLabel = null;

    this._toggleProfileMenuItem.destroy();
    this._toggleProfileMenuItem = null;

    if (this._updateInterval) {
      clearInterval(this._updateInterval);
    }
    this._updateInterval = null;
  }

  createMenu() {
    log(`creating menu for ${Me.metadata.name}`);

    const panelName = `${Me.metadata.name} Menu`;
    this._menu = new PanelMenu.Button(0.5, panelName, false);

    this._menuIcon = new St.Icon({
      gicon: this._giconDisconnected,
      style_class: 'system-status-icon',
    });

    this._menuLabel = new St.Label({
      text: Extension.TOP_BAR_LABEL,
      y_align: imports.gi.Clutter.ActorAlign.CENTER,
    });

    const topBarContainer = new St.BoxLayout();
    topBarContainer.add_actor(this._menuIcon);
    topBarContainer.add_actor(this._menuLabel);

    this._menu.add_child(topBarContainer);
    Main.panel.addToStatusArea(panelName, this._menu);
  }

  createToggleProfileMenuItem() {
    log(`creating toggle profile menu item for ${Me.metadata.name}`);

    this._toggleProfileMenuItem = new PopupMenu.PopupSwitchMenuItem(
      'Meeting mode',
      false
    );
    this._toggleProfileMenuItem.sensitive = false;
    this._toggleProfileMenuItem.connect(
      'button-press-event',
      this.toggleProfile.bind(this)
    );
    this._menu.menu.addMenuItem(this._toggleProfileMenuItem);
    this.setToggleProfileSwitch();
  }

  setToggleProfileSwitch() {
    log(`setting toggle profile switch for ${Me.metadata.name}`);

    const activeProfile = this.getActiveProfile();

    if (
      (activeProfile === Extension.QUALITY_MODE &&
        this._toggleProfileMenuItem.state === true) ||
      (activeProfile === Extension.MEETING_MODE &&
        this._toggleProfileMenuItem.state === false)
    ) {
      this._toggleProfileMenuItem.toggle();
    }
  }

  toggleProfile() {
    log(`toggling profile for ${Me.metadata.name}`);

    const cardName = this.getCardName();
    const activeProfile = this.getActiveProfile();

    if (activeProfile === Extension.QUALITY_MODE) {
      GLib.spawn_command_line_sync(
        `/bin/bash -c "pactl set-card-profile ${cardName} ${Extension.MEETING_MODE}"`
      );
    } else {
      GLib.spawn_command_line_sync(
        `/bin/bash -c "pactl set-card-profile ${cardName} ${Extension.QUALITY_MODE}"`
      );
    }
  }

  createUpdateInterval() {
    this._updateInterval = setInterval(this.syncStatus.bind(this), 1000);
  }

  syncStatus() {
    log(`syncing icon status for ${Me.metadata.name}`);

    const activeProfile = this.getActiveProfile();

    if (activeProfile === Extension.QUALITY_MODE) {
      this._menuIcon.set_gicon(this._giconQuality);
      this._toggleProfileMenuItem.sensitive = true;
    } else if (activeProfile === Extension.MEETING_MODE) {
      this._menuIcon.set_gicon(this._giconMeeting);
      this._toggleProfileMenuItem.sensitive = true;
    } else {
      this._menuIcon.set_gicon(this._giconDisconnected);
      this._toggleProfileMenuItem.sensitive = false;
    }

    this.setToggleProfileSwitch();
  }

  getActiveProfile() {
    const [, rawActiveProfile] = GLib.spawn_command_line_sync(
      "/bin/bash -c \"pactl list cards | awk -v RS='' '/bluez/' | awk -F': ' '/Active Profile/ { print $2 }'\""
    );
    return ByteArray.toString(rawActiveProfile).trim();
  }

  getCardName() {
    const [, rawCardName] = GLib.spawn_command_line_sync(
      "/bin/bash -c \"pactl list cards | awk -v RS='' '/bluez/' | awk -F': ' '/Name/ { print $2 }'\""
    );
    return ByteArray.toString(rawCardName).trim();
  }
}

function init() {
  log(`initializing ${Me.metadata.name}`);
  return new Extension();
}

import GObject from 'gi://GObject';
import Gio from 'gi://Gio';
import Meta from 'gi://Meta';
import Shell from 'gi://Shell';
import Clutter from 'gi://Clutter';
import St from 'gi://St';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';

export default class MainWindow {
  constructor() {
    this.window = new St.BoxLayout({
      style_class: 'modal-dialog',
      vertical: true,
      reactive: true
    });
    
    this.window.width = 1200;
    this.window.height = 600;
    this.window.visible = false;

    this.window.connect('key-press-event', (object, event) => {
      let code = event.get_key_code();
      let state = event.get_state();

      // close window if ESC is pressed
      if (state === 0 && code === 9) {
          this.window.visible = false;
          return true;
      }

      return false;
    });

    Main.layoutManager.addChrome(this.window, {affectsInputRegion: true});

    // Position the window in the center of the screen
    let monitor = Main.layoutManager.primaryMonitor;
    this.window.set_position(
        monitor.x + Math.floor(monitor.width / 2 - this.window.width / 2),
        monitor.y + Math.floor(monitor.height / 2 - this.window.height / 2)
    );

    this._addInputRow();
  }

  _addInputRow() {
    this.inputRow = new St.BoxLayout({
      style_class: 'input-container',
      vertical: false,
      x_expand: true
    });

    this.input = new St.Entry({
      style_class: 'question-input',
      can_focus: true,
      hint_text: 'Give a task to the AI Assistant',
      track_hover: true,
      x_expand: true
    });

    this.inputRow.add(this.input);

    this.sendButton = new St.Icon({
      icon_name: "object-select-symbolic",
      icon_size: 30
    });

    this.inputRow.add(this.sendButton);
    
    this.window.add_child(this.inputRow);
  }

  toggleVisibility() {
    if(this.window.visible) {
      Main.notify("Hiding");
    } else {
      Main.notify("Showing");
    }
    this.window.visible = !this.window.visible;
  }
}
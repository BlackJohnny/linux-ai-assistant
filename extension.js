/* extension.js
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

import GObject from 'gi://GObject';
import Gio from 'gi://Gio';
import Meta from 'gi://Meta';
import Shell from 'gi://Shell';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';

import {Extension, gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';
import {QuickToggle, SystemIndicator} from 'resource:///org/gnome/shell/ui/quickSettings.js';

import MainWindow from './src/main-window.js';

const AssistantToggle = GObject.registerClass(
class AssistantToggle extends QuickToggle {
    constructor() {
        super({
            title: _('AI Assistant'),
            iconName: 'computer-symbolic',
            toggleMode: true,
        });
    }
});

const AssistantIndicator = GObject.registerClass(
class AssistantIndicator extends SystemIndicator {
    constructor() {
        super();

        this._indicator = this._addIndicator();
        this._indicator.iconName = 'computer-symbolic';

        const toggle = new AssistantToggle();
        toggle.bind_property('checked',
            this._indicator, 'visible',
            GObject.BindingFlags.SYNC_CREATE);
        this.quickSettingsItems.push(toggle);
    }
});

export default class LinuxAIAssistantExtension extends Extension {
    constructor(metadata) {
        super(metadata);
        console.debug(`constructing ${this.metadata.name}`);
    }

    showHelloWorldWindow() {
        this._mainWindow.toggleVisibility();
    }

    enable() {
        this._indicator = new AssistantIndicator();
        this._mainWindow = new MainWindow();

        Main.panel.statusArea.quickSettings.addExternalIndicator(this._indicator);

        const schemaDir = this.metadata.dir.get_child('schemas');
        let source;
        if(schemaDir.query_exists(null)) {
          source = Gio.SettingsSchemaSource.new_from_directory(
            schemaDir.get_path(), Gio.SettingsSchemaSource.get_default(), false);
        } else {
          source = Gio.SettingsSchemaSource.get_default();
        }
    
        const schema =
          source.lookup('org.gnome.shell.extensions.linux-ai-assistant', true);

        Main.wm.addKeybinding(
            'show-linux-ai-assistant-interface',
            new Gio.Settings({ settings_schema: schema }),
            Meta.KeyBindingFlags.NONE,
            Shell.ActionMode.NORMAL,
            this.showHelloWorldWindow.bind(this) // Callback function
        );
    }

    disable() {
        Main.wm.removeKeybinding('show-linux-ai-assistant-interface');

        this._indicator.quickSettingsItems.forEach(item => item.destroy());
        this._indicator.destroy();
    }
}

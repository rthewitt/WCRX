# WheelChair Rx
An app that helps fit wheelchairs to the needs of patients.

## License
This is NOT free software. WheelChair Rx is distributed as shareware. Contact Dr. Jill McNitt-Gray at the University of Southern California for licensing information.

Source code copyright &copy; 2014 Ryan Hewitt, Michael C. Hogan, Dr. Jill McNitt-Gray, Ian Russell. All rights reserved.

Images copyright &copy; 2014 Ramiro Cazaux, Dr. Jill McNitt-Gray, Ian Russell. All rights reserved.

## Install the Chrome Extension
WheelChair Rx is deployed as a Chrome Extension compatible with either the open source Chromium browser or Google Chrome.

1. Open the open source Chromium browser or Google Chrome
2. Navigate to the [Chrome Web Store](https://chrome.google.com/webstore/detail/niichipgdhnoobgnedohkjobikopglnb).
3. Click `Free` and `Add` to install the Chrome app.
4. Navigate to <chrome://apps/> to confirm the extension has been installed.

### Try it first at GitHub.io
Coming soon!

## Use WcRx
1. Open the open source Chromium browser or Google Chrome.
2. Navigate to <chrome://apps/>.
3. Click the WCRX icon to delete the extension.

## Uninstall the Chrome Extension
1. Open the open source Chromium browser or Google Chrome.
2. Navigate to <chrome://extensions/>.
3. Click the Trash Can icon to delete the extension.

## Help make WCRX Better
### Build WCRX for the first time
1. Fork [the primary GitHub repo](https://github.com/rthewitt/WCRX)
2. Clone your forked repository to your local development machine
3. Install [Node.js](http://nodejs.org)
4. Use Node Package Manager (NPM) that is included with Node.js to install [Bower](http://bower.io), and [Grunt](http://gruntjs.com)
```
npm install -g bower # may need to run as sudo
npm install -g grunt-cli # may need to run as sudo
```
5. Navigate to the WCRX directory on your local development machine and run `bower install` and the directoy `js/libs/` will be created with the required dependencies for running WCRX.
6. Run `npm install` to install the Grunt task runner.
7. Run `grunt jst` to compile the WCRX view templates.
8. You may now open `WCRX/index.html` with Chrome or Chromium and use a typical web development workflow to update and test changes to the application.

### Create and Test a Chrome Web App Extension
1. Read all steps below before attempting this the first time. Step 6 will open a full screen window and you'll need to understand how to regain control of Chrome after that window opens.
2. Open Chromium (or Google Chrome).
3. Navigate to chrome://extensions/
4. Enable Developer Mode by checking the corresponding checkbox.
5. Click `Load unpacked extension...` and select the WCRX directory. You will see WCRX added to your list of extensions.
6. Click `Launch` to open the application.
7. Press the `Esc` key to exit full screen.
8. Enlarge the application window to your desired size, while keeping the App in windowed mode.
9. Right click and choose `Inspect element...` to launch Chrome developer tools.
10. Use the Chrome JavaScript console to debug WCRX.

### Submit a Pull Request to the Primary GitHub Repository
Coming soon...

### Sync your copy with the Primary GitHub Repository
See [these helpful responses on Stack Overflow](http://stackoverflow.com/questions/7244321/how-to-update-github-forked-repository)

### Publish to the Chrome Web Application Store
1. Run `WCRX/bin/compile-and-build.sh` to build the Chrome App and a `WCRX/build/` directory will be added to your project space. The directory will include WCRX.zip, the bundled Chrome Application.
2. More steps coming soon...

### Dependencies managed with Bower
* "jquery": "1.11"
* "jquery-ui": "1.11.1"
* "underscore": "1.6.0"
* "backbone": "1.1.2"
* "requirejs": "2.1.6"

### Dependencies included in Repo
* "box2dweb": "2.1.a.3.min"
* "jquery.customSelect": "0.5.1"

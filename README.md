<img src="https://raw.githubusercontent.com/UURAGE/ScenarioEditor/master/logo.svg?sanitize=true" width="50%"/>

# Scenario Editor

[![](https://badge.fury.io/gh/UURAGE%2FScenarioEditor.svg)](https://github.com/UURAGE/ScenarioEditor/releases/latest)

The UURAGE Scenario Editor is a web application component for editing communication scenarios.

## Prerequisites

A server stack that includes PHP >= 5.5.

For online use, any small web hosting package should do; Linux environments are more common and better supported than Windows servers. For offline, local use on Windows, XAMPP and UwAmp are reasonable options.

## Installation

Simply place all files in the web root.

## Configuration

Create a configuration XML file based on the [config language](doc/configLanguage.xsd) with the namespace [http://uurage.github.io/ScenarioEditor/config/namespace](http://uurage.github.io/ScenarioEditor/config/namespace) and put it in the editor directory with the filename `config.xml`. A [tutorial](doc/CONFIG_TUTORIAL.md) is also available.

## Development

### NPM package

The purpose of the NPM package is to manage development dependencies. We use technologies that involve building (transforming) files (see below). The NPM package allows you to build everything at once and to build files that have changed since the last build every time you save a file.

#### Setup

Install [Node.js](https://nodejs.org/) and execute the following commands to install the development dependencies:

```
npm install -g gulp-cli
npm install
```

#### Command-line usage

To build and watch for file changes run:  `gulp`

#### Visual Studio Code

The Scenario Editor has a Visual Studio Code task for executing gulp. After installing the dependencies, this task can be executed with `Ctrl+Shift+B` in the code editing window.

### Sass

The Scenario Editor uses a collection of [Sass](http://sass-lang.com) files for its styling. There are several ways to compile Sass to CSS.

#### Using Node.js

See "NPM package" above. Run `gulp sass` to compile once.

#### Using Sass Compiler

When compiling using the [standard Sass compiler](http://sass-lang.com/install), you need to watch the folder `editor/sass` to compile to `editor/css`.

#### Live-reload

You can live-reload the changes to your stylesheets in your browser by running `gulp stream`, which uses Browsersync and uses `localhost` as the proxy hostname.

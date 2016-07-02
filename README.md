# Scenario Editor

The UURAGE Scenario Editor is a web application component for editing communication scenarios.

## Prerequisites

A server stack that includes PHP >= 5.5.

For online use, any small web hosting package should do; Linux environments are more common and better supported than Windows servers. For offline, local use on Windows, XAMPP and UwAmp are reasonable options.

## Installation

Simply place all files in the web root.

## Configuration

Create a configuration XML file based on the [config language](doc/configLanguage.xsd) with the namespace [http://uurage.github.io/ScenarioEditor/config/namespace](http://uurage.github.io/ScenarioEditor/config/namespace) and put it in the editor directory with the filename `config.xml`. A [tutorial](doc/CONFIG_TUTORIAL.md) is also available.

# Configuration tutorial

This is a tutorial for creating a configuration XML file for initialisation of the Scenario Editor.
I will give a walkthrough, general guidelines to the creation process and keep it as simple as possible.
It is generally a good idea to experiment with the configuration, so you get an intuitive feeling for what goes where.

The Scenario Editor needs to know how many characters should be available, 
which properties the scenario will have and what kind of parameters can be manipulated.
To accommodate for this we created a configuration language in the form of an XSD. 
The namespace for the configuration language is [http://uurage.github.io/ScenarioEditor/config/namespace](http://uurage.github.io/ScenarioEditor/config/namespace).

When you open the XSD in your favorite editor or IDE, you will see our namespace and the definition of the `config` element.
Throughout the XSD you can find documentation annotations, which you can also use if this tutorial does not suffice.
In the same editor or IDE, open a new XML file, name it "config" and put it in the editor directory of the Scenario Editor. 
Now you can begin creating your own configuration, add the `config` element to the XML and refer to the config language namespace.

```
<config xmlns="http://uurage.github.io/ScenarioEditor/config/namespace"/>
```

The config element also has other attributes: `id` and `version`.

`id` is the identifier for the configuration file that is referenced in the scenario XML. 
We recommend using this as a unique identifier for your configurations.

`version` is an integer that can be used for versioning your configurations.
For example you can have a separate git repository for the configuration files and 
increment the version of a configuration each time you change it.

```
<config xmlns="http://uurage.github.io/ScenarioEditor/config/namespace" id="tutorial" version="1"/>
```

## Types
Currently there are four different types that can be used: integer, string, boolean and enumeration.
Suppose we would make an enumeration for size:

```
<type>
  <enumeration>
    <option>Small</option>
    <option>Medium</option>
    <option>Big</option>
    <default>Medium</default>
  <enumeration>
</type>
```

A default can also be specified, which refers to an option previously defined. 
The size enumeration will then default to `Medium` in this case.

The elements for integer, string and boolean are rather straightforward and can also have a default element inside:
```
<type>
  <integer/>
</type>

<type>
  <string/>
</type>

<type>
  <boolean/>
</type>
```

## Settings

The `settings` element currently only contains the optional `statement` element 
in which you can set the maximum length and default of the statement text in the Scenario Editor.
Currently the type for the statement should always be string. If the `maxLength` attribute is left out, 
the statement length is unbounded and by default it is empty, when there is no `default` element.

```
<config xmlns="http://uurage.github.io/ScenarioEditor/config/namespace" id="tutorial" version="1">
  <settings>
    <statement>
      <type>
        <string maxLength="100">
          <default>This is the default text for a statement</default>
        </string>
      </type>
    </statement>
  </settings>
</config>
```

## Properties

A property is a piece of information to be stored in the scenario.
An example of a property is the name of a character.
The author of the scenario can choose a name for the character in the editor if we specify this property in the config.

```
<config xmlns="http://uurage.github.io/ScenarioEditor/config/namespace" id="tutorial" version="1">
  <settings>
    ...
  </settings>
  <properties>
    <property id="characterAge" name="Character age">
      <description xml:space="preserve">A description that preserves 
      space</description>
      <type>
        <string/>
      </type>
    </property>
  </properties>
</config>
```

As you can see a property has the attributes `id` and `name`, the id is used for reference and the name is used in the UI for the property.
We must also specify the type of the property inside. We want the user to specify the name as a string, so we pick the type string. 
Optionally a description of the property can be provided.
XML attributes are allowed on the `description` element by the config language,
so that space is preserved when the configuration is formatted.

## Parameters

A parameter is a piece of state that can be modified by statements. 
The definition in the configuration is very similar to the property definition.
A typical example of a parameter that changes state during the scenario is the environment.
The grassland environment can change to a mountains environment for example.

```
<config xmlns="http://uurage.github.io/ScenarioEditor/config/namespace" id="tutorial" version="1">
  <settings>
    ...
  </settings>
  <properties>
    ...
  </properties>
  <parameters>
    <parameter id="environment" name="Environment">
      <description>Represents the changing environment of the scenario.</description>
      <type>
        <enumeration>
          <option>Grassland</option>
          <option>Mountains</option>
          <option>Ocean</option>
          <default>Grassland</default>
        </enumeration>
      </type>
    </parameter>
  </parameters>
</config>
```

## Characters

In the `characters` element you can specify all your characters or you can specify just one character with the `character` element.

```
<config xmlns="http://uurage.github.io/ScenarioEditor/config/namespace" id="tutorial" version="1">
  <settings>
    ...
  </settings>
  <properties>
    ...
  </properties>
  <parameters>
    ...
  </parameters>
  <!-- Multiple characters -->
  <characters>
  </characters>
  <!-- or                  -->
  <!-- a single character    -->
  <character>
  </character>
</config>
```

Suppose we have multiple characters, the structure would look as follows:

```
<config xmlns="http://uurage.github.io/ScenarioEditor/config/namespace" id="tutorial" version="1">
  <settings>
    ...
  </settings>
  <properties>
    ...
  </properties>
  <parameters>
    ...
  </parameters>
  <characters>
    <character id="Character 1"/>
    <character id="Character 2"/>
  </characters>
</config>
```

The `id` attribute is used to refer to the character and as opposed to the `id` in a property and parameter definition, 
used in the UI of the editor.

Of course we would like to add properties and parameters per character, for example emotion:

```
<config xmlns="http://uurage.github.io/ScenarioEditor/config/namespace" id="tutorial" version="1">
  <settings>
    ...
  </settings>
  <properties>
    ...
  </properties>
  <parameters>
    ...
  </parameters>
  <characters>
    <character id="Character 1">
      <parameters>
        <parameter id="emotion_1" name="Emotion">
          <type>
            <enumeration>
              <option>Angry</option>
              <option>Happy</option>
              <option>Sad</option>
              <option>Neutral</option>
              <default>Neutral</default>
            </enumeration>
          </type>
        </parameter>
      </parameters>
    </character>
    <character id="Character 2">
      <parameters>
        <parameter id="emotion_2" name="Emotion">
          <type>
            <enumeration>
              <option>Angry</option>
              <option>Happy</option>
              <option>Sad</option>
              <option>Neutral</option>
              <default>Neutral</default>
            </enumeration>
          </type>
        </parameter>
      </parameters>
    </character>
  </characters>
</config>
```

Now each character has a separate emotion parameter. 
Fortunately you don't have to copy each emotion parameter for each character if they are the same,
because you can also add a parameter or property for all characters.

```
<config xmlns="http://uurage.github.io/ScenarioEditor/config/namespace" id="tutorial" version="1">
  <settings>
    ...
  </settings>
  <properties>
    ...
  </properties>
  <parameters>
    ...
  </parameters>
  <characters>
    <properties>
      ...
    </properties>
    <parameters>
      <parameter id="emotion" name="Emotion">
        <type>
          <enumeration>
            <option>Angry</option>
            <option>Happy</option>
            <option>Sad</option>
            <option>Neutral</option>
            <default>Neutral</default>
          </enumeration>
        </type>
      </parameter>
    </parameters>
    <character id="Character 1">
      <properties>
        ...
      </properties>
      <parameters>
        ...
      </parameters>
    </character>
    <character id="Character 2"/>
  </characters>
</config>
```

Now all characters have their own emotion parameter. 
The take away here is that each character can have its own properties and parameters inside its element.
In addition it will also have instances of the properties and parameters in the `characters` element.

## Statement scopes

A property or a parameter also has a statement scope. The available statement scopes are 
`independent`, `per`, `per-player`, `per-computer`, `per-situation` and `per-computer-own`.
The following sections will explain each scope and give some examples of possible properties and parameters that fit the scope.

### Independent

The age of the character is a typical example of a property with statement-independent scope: it is not set to a value at each statement or at some statements, just once for the entire scenario.
By default the statement scope of a property is `independent`.

```
<config xmlns="http://uurage.github.io/ScenarioEditor/config/namespace" id="tutorial" version="1">
  <settings>
    ...
  </settings>
  <properties>
    <property id="characterAge" name="Character age" statementScope="independent">
      <type>
        <integer/>
      </type>
    </property>
  </properties>
  <parameters>
    ...
  </parameters>
  <characters>
    ...
  </characters>
</config>
```

### Per

If a property or parameter has the statement scope `per`, its value can be specified per statement for each statement type.
This is the default scope for parameters, parameters can't have the `independent` statement scope.

### Per-player, per-computer and per-situation

The per-statement scopes with a statement type suffix specify that the property can only be set if per-statement of the given type.
The intent of the player is a good example of a per-player-statement property.

```
<config xmlns="http://uurage.github.io/ScenarioEditor/config/namespace" id="tutorial" version="1">
  <settings>
    ...
  </settings>
  <properties>
    <property id="characterAge" name="Character age" statementScope="independent">
      <type>
        <integer/>
      </type>
    </property>
    <property id="playerIntent" name="Intent" statementScope="per-player">
      <type>
        <string/>
      </type>
    </property>
  </properties>
  <parameters>
    ...
  </parameters>
  <characters>
    ...
  </characters>
</config>
```

### Per-computer-own

This scope is useful for limiting character parameters or properties to the scope of a statement by that character.

```
<config xmlns="http://uurage.github.io/ScenarioEditor/config/namespace" id="tutorial" version="1">
  <settings>
    ...
  </settings>
  <properties>
    ...
  </properties>
  <parameters>
    ...
  </parameters>
  <characters>
    <properties>
      <property id="characterIntent" name="Intent" statementScope="per-computer-own">
        <type>
          <string/>
        </type>
      </property>
    </properties>
    <character id="Character 1"/>
    <character id="Character 2"/>
  </characters>
</config>
```

In the above example all the characters will get an instance of the `characterIntent` parameter.
However if we set the scope to `per-computer`, the `characterIntent` of all characters can be set at a computer statement.
To limit the scope to the computer statement of a specific character, use the `per-computer-own` scope.

## Groups

Both parameters and properties can be contained in a `group` element. 

```
<config xmlns="http://uurage.github.io/ScenarioEditor/config/namespace" id="tutorial" version="1">
  <settings>
    ...
  </settings>
  <properties>
    <propertyGroup statementScope="independent">
      <property id="characterAge" name="Character age">
        <type>
          <integer/>
        </type>
      </property>
      <property id="playerIntent" name="Intent" statementScope="per-player">
        <type>
          <string/>
        </type>
      </property>
    </propertyGroup>
  </properties>
  <parameters>
    ...
  </parameters>
  <characters>
    ...
  </characters>
</config>
```

The statement scope specified for the group, will be inherited by its child elements, so the `characterAge` will get statement scope `independent` and the `playerIntent` will get statement scope `per-player`, because it overrides the group statement scope. 

## Sections

Properties and parameters can be put into sections in the editor UI, the `section` element provides the means to do this.

```
<config xmlns="http://uurage.github.io/ScenarioEditor/config/namespace" id="tutorial" version="1">
  <settings>
    ...
  </settings>
  <properties>
    <propertySection name="Property section">
      <propertyGroup statementScope="independent">
        <property id="characterAge" name="Character age">
          <type>
            <integer/>
          </type>
        </property>
        <property id="playerIntent" name="Intent" statementScope="per-player">
          <type>
            <string/>
          </type>
        </property>
      </propertyGroup>
    </propertySection>
  </properties>
  <parameters>
    ...
  </parameters>
  <characters>
    ...
  </characters>
</config>
```

As you can see the previously defined `propertyGroup` is contained by the `propertySection`,
in the UI there will be a header "Property section" for a section with the contained properties inside it.

## Migration

Currently migration from schema version 3 to schema version 4 is supported.
The scenarios previously created by the Scenario Editor without configuration are of version 3.
In version 3 the intent property was a separate feature in the editor, where the intent of the player is a string.
In version 4 the intent property can be defined as a property in the configuration and 
in the `migration` element we can refer to its definition, 
so in this case we refer to the previously defined `playerIntent` property in the properties element.
The intent is then converted from version 3 to a version 4 property. The first intent specified for the player statement is not lost, 
but stored as a property value, if the scope of the property is `per` or `per-player`.

```
<config xmlns="http://uurage.github.io/ScenarioEditor/config/namespace" id="tutorial" version="1">
  <settings>
    ...
  </settings>
  <properties>
    ...
    <property id="playerIntent" name="Intent" statementScope="per-player">
      <type>
        <string/>
      </type>
    </property>
  </properties>
  <parameters>
    ...
  </parameters>
  <characters>
    ...
  </characters>
  <migration>
    <intentProperty idref="playerIntent"/>
  </migration>
</config>
```
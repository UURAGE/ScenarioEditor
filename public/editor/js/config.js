/* © Utrecht University and DialogueTrainer */

/* exported Config */
let Config;

(function()
{
    "use strict";

    // eslint-disable-next-line no-global-assign
    Config =
    {
        additionalNameSpaces: {},
        atLeastOneParameter: atLeastOneParameter,
        container: {},
        findParameterById: findParameterById,
        insertParametersInto: insertParametersInto,
        insertCharactersInto: insertCharactersInto,
        hasParameterWithType: hasParameterWithType,
        isCharacterParameter: isCharacterParameter,
        getNewDefaultParameterEffects: getNewDefaultParameterEffects,
        getNewDefaultPropertyValues: getNewDefaultPropertyValues
    };

    const configNameSpace = "http://uurage.github.io/ScenarioEditor/config/namespace";

    // The default scopes used when there is no statementScope attribute specified for the property in the config
    const defaultPropertyScopes = { statementScope: 'independent' };
    // The default collection used when the property collection is not present in the XML
    const defaultPropertyCollection = { kind: 'toplevel', scopes: defaultPropertyScopes, sequence: [], byId: {} };

    // The default scopes used when there is no statementScope attribute specified for the parameter in the config
    const defaultParameterScopes = { statementScope: 'per' };
    // The default collection used when the parameter collection is not present in the XML
    const defaultParameterCollection = { kind: 'toplevel', scopes: defaultParameterScopes, sequence: [], byId: {} };

    $(loadConfig);

    function loadConfig()
    {
        // The config.xml is loaded into the DOM on the server-side, so we can parse the XML from the DOM
        const configXML = $($.parseXML($('#config').text())).children('config');
        if (!configXML.length)
        {
            Utils.alertDialog("The configuration for the editor was not loaded", 'error');
            return;
        }

        Config.container.id = configXML.attr('id');
        Config.container.version = configXML.attr('version');
        Config.container.settings = loadSettings(configXML.children('settings'));
        Config.container.properties = loadCollection(configXML.children('properties'), 'property', 'toplevel', defaultPropertyScopes);
        Config.container.parameters = loadCollection(configXML.children('parameters'), 'parameter', 'toplevel', defaultParameterScopes);

        if (configXML.children('character').length === 1)
        {
            Config.container.characters = { parameters: $.extend({}, defaultParameterCollection), properties: $.extend({}, defaultPropertyCollection), byId: {} };
            const character = loadCharacterNode(configXML.children('character')[0]);
            Config.container.characters.byId[character.id] = character;
            Config.container.characters.sequence = [character];
        }
        else
        {
            Config.container.characters = loadCharacterCollection(configXML.children('characters'));
        }

        Config.container.migration = loadMigration(configXML.children('migration'));
    }

    function loadSettings(settingsXML)
    {
        const settings = {};

        const loadSettingWithType = function(settingXML)
        {
            if (settingXML.length > 0)
            {
                return { type: loadType(settingXML.children('type').children()) };
            }
            else
            {
                return { type: Types.primitives.string };
            }
        };

        settings.statement = loadSettingWithType(settingsXML.children('statement'));
        settings.description = loadSettingWithType(settingsXML.children('description'));
        settings.evaluationName = loadSettingWithType(settingsXML.children('evaluationName'));
        settings.evaluationDescription = loadSettingWithType(settingsXML.children('evaluationDescription'));

        settings.languages = {};
        settings.languages.sequence = [];
        settings.languages.byCode = {};
        const languageSettingsXML = settingsXML.children('languages');
        if (languageSettingsXML.length > 0)
        {
            languageSettingsXML.children().each(function(index, languageSettingXML)
            {
                let languageName = $(languageSettingXML).text();
                const languageCode = languageSettingXML.getAttribute('code');
                if (!languageName) languageName = i18next.t('configXML:language.' + languageCode);
                const language = { code: languageCode, name: languageName };
                settings.languages.byCode[language.code] = language;
                settings.languages.sequence.push(language);
            });
        }

        settings.colorKeyEntry = loadSettingWithType(settingsXML.children('colourKeyEntry'));

        return settings;
    }

    function loadNode(nodeXML, nodeName, parentScopes)
    {
        if (nodeXML.nodeName === nodeName)
        {
            const nodeScopes = loadScopes(nodeXML);
            mergeScopes(nodeScopes, parentScopes);
            const id = nodeXML.getAttribute('id');
            let name = nodeXML.getAttribute('name');
            if (!name)
            {
                name = i18next.t('configXML:' + nodeName + '.' + id + '.name', { defaultValue: i18next.t('configXML:' + nodeName + '.' + id) });
            }
            let description = $(nodeXML).children('description').text();
            if (!description)
            {
                description = i18next.t('configXML:' + nodeName + '.' + id + '.description', { defaultValue: "" });
            }
            return {
                kind: nodeName,
                id: id,
                name: name,
                description: description,
                scopes: nodeScopes,
                type: loadType($(nodeXML).children('type').children(), id, nodeName, nodeScopes)
            };
        }
        else if (nodeXML.nodeName === nodeName + "Section")
        {
            const subResult = loadCollection($(nodeXML), nodeName, 'section', parentScopes);
            subResult.name = nodeXML.getAttribute('name');
            const sectionId = nodeXML.getAttribute('id');
            if (sectionId) subResult.id = sectionId;
            if (!subResult.name) subResult.name = i18next.t('configXML:section.' + sectionId + '.name', { defaultValue: i18next.t('configXML:section.' + sectionId) });
            return subResult;
        }
        else
        {
            return loadCollection($(nodeXML), nodeName, 'group', parentScopes);
        }
    }

    function loadCollection(collectionXML, nodeName, kind, parentScopes)
    {
        const collectionScopes = loadScopes(collectionXML[0]);
        mergeScopes(collectionScopes, parentScopes);

        let sequence = [];
        const byId = {};
        collectionXML.children().each(function(index, childXML)
        {
            const subResult = loadNode(childXML, nodeName, collectionScopes);
            if (subResult.kind === nodeName)
            {
                sequence.push(subResult);
                byId[subResult.id] = subResult;
            }
            else if (subResult.kind === 'group')
            {
                sequence = sequence.concat(subResult.sequence);
                $.extend(byId, subResult.byId);
            }
            else if (subResult.kind === 'section')
            {
                sequence.push(subResult);
                $.extend(byId, subResult.byId);
            }
        });
        return { kind: kind, scopes: collectionScopes, sequence: sequence, byId: byId };
    }

    function loadScopes(scopedXML)
    {
        return { statementScope: scopedXML.getAttribute('statementScope') };
    }

    // Merges the parent's scopes and it's local scopes
    // The local scope always has precedence over the parent scope
    function mergeScopes(localScopes, parentScopes)
    {
        for (const scopeName in parentScopes)
        {
            if (!localScopes[scopeName])
            {
                localScopes[scopeName] = parentScopes[scopeName];
            }
        }
    }

    function loadType(typeXML, id, kind, scopes)
    {
        const nameSpace = typeXML[0].namespaceURI;
        const type = nameSpace === configNameSpace ?
            Types.primitives[typeXML[0].localName] :
            Types.extensions[nameSpace][typeXML[0].localName];
        return type.loadType(typeXML, id, kind, scopes);
    }

    function loadCharacterCollection(collectionXML)
    {
        const characters = {};
        characters.sequence = [];
        characters.byId = {};
        collectionXML.children('character').each(function(index, childXML)
        {
            const character = loadCharacterNode(childXML);
            characters.sequence.push(character);
            characters.byId[character.id] = character;
        });
        characters.properties = loadCollectionOrDefault($(collectionXML).children('properties'), 'property', defaultPropertyCollection, defaultPropertyScopes);
        characters.parameters = loadCollectionOrDefault($(collectionXML).children('parameters'), 'parameter', defaultParameterCollection, defaultParameterScopes);
        return characters;
    }

    function loadCharacterNode(nodeXML)
    {
        const properties = loadCollectionOrDefault($(nodeXML).children('properties'), 'property', defaultPropertyCollection, defaultPropertyScopes);
        const parameters = loadCollectionOrDefault($(nodeXML).children('parameters'), 'parameter', defaultParameterCollection, defaultParameterScopes);

        const id = nodeXML.getAttribute('id');
        let name = nodeXML.getAttribute('name');
        if (!name && i18next.exists('configXML:character.' + id))
        {
            name = i18next.t('configXML:character.' + id);
        }
        return { id: id, name: name, properties: properties, parameters: parameters };
    }

    function loadCollectionOrDefault(collectionXML, nodeName, defaultCollection, defaultScopes)
    {
        let collection = {};
        if (collectionXML.length > 0)
        {
            collection = loadCollection(collectionXML, nodeName, 'toplevel', defaultScopes);
        }
        else
        {
            $.extend(collection, defaultCollection);
        }
        return collection;
    }

    function loadMigration(migrationXML)
    {
        const migration = {};
        if (migrationXML.length > 0)
        {
            const intentPropertyXML = migrationXML.children('intentProperty').eq(0);
            if (intentPropertyXML.length > 0)
            {
                migration.intentProperty = { idRef: intentPropertyXML[0].getAttribute('idref') };
            }
        }
        return migration;
    }

    function atLeastOneParameter()
    {
        let atLeastOnePerCharacterParameter;
        for (const characterId in Config.container.characters.byId)
        {
            if (Config.container.characters.byId[characterId].parameters.sequence.length > 0)
            {
                atLeastOnePerCharacterParameter = true;
                break;
            }
        }
        return Config.container.parameters.sequence.length > 0 || Config.container.characters.parameters.sequence.length > 0 || atLeastOnePerCharacterParameter;
    }

    function findParameterById(parameterId, characterId)
    {
        let parameter;
        if (!characterId && parameterId in Config.container.parameters.byId)
        {
            parameter = Config.container.parameters.byId[parameterId];
        }
        else if (parameterId in Config.container.characters.parameters.byId)
        {
            parameter = Config.container.characters.parameters.byId[parameterId];
        }
        else
        {
            if (characterId)
            {
                if (parameterId in Config.container.characters.byId[characterId].parameters.byId)
                {
                    parameter = Config.container.characters.byId[characterId].parameters.byId[parameterId];
                }
            }
            else
            {
                Config.container.characters.sequence.some(function(character)
                {
                    if (parameterId in Config.container.characters.byId[character.id].parameters.byId)
                    {
                        parameter = Config.container.characters.byId[character.id].parameters.byId[parameterId];
                        return true;
                    }
                    return false;
                });
            }
        }
        return parameter;
    }

    // If the type is given, only inserts parameters with the same type
    function insertParametersInto(idRefSelect, type)
    {
        const appendParameter = function(parameterItem)
        {
            if (parameterItem.kind !== "parameter")
            {
                parameterItem.sequence.forEach(appendParameter);
            }
            else if (!type || parameterItem.type.equals(type))
            {
                idRefSelect.append($('<option>', { value: parameterItem.id, text: parameterItem.name }));
            }
        };
        Config.container.parameters.sequence.forEach(appendParameter);
        Config.container.characters.parameters.sequence.forEach(appendParameter);
        for (const characterId in Config.container.characters.byId)
        {
            Config.container.characters.byId[characterId].parameters.sequence.forEach(appendParameter);
        }
    }

    function insertCharactersInto(characterIdRefSelect, parameterIdRef)
    {
        const inIndividualCharacter = Config.container.characters.sequence.some(function(character)
        {
            if (parameterIdRef in Config.container.characters.byId[character.id].parameters.byId)
            {
                characterIdRefSelect.append($('<option>', { value: character.id, text: character.name ? character.name : character.id }));
                return true;
            }
            return false;
        });

        if (!inIndividualCharacter)
        {
            Config.container.characters.sequence.forEach(function(character)
            {
                characterIdRefSelect.append($('<option>', { value: character.id, text: character.name ? character.name : character.id }));
            });
        }

        if (Config.container.characters.sequence.length === 1) characterIdRefSelect.hide();
    }

    function hasParameterWithType(type)
    {
        let hasType = false;
        const checkHasType = function(parameterItem)
        {
            if (parameterItem.kind !== "parameter")
            {
                return parameterItem.sequence.some(checkHasType);
            }
            else if (parameterItem.type.equals(type))
            {
                return true;
            }
        };
        hasType = hasType || Config.container.parameters.sequence.some(checkHasType);
        hasType = hasType || Config.container.characters.parameters.sequence.forEach(checkHasType);
        for (const characterId in Config.container.characters.byId)
        {
            hasType = hasType || Config.container.characters.byId[characterId].parameters.sequence.forEach(checkHasType);
        }
        return hasType;
    }

    function isCharacterParameter(parameterId)
    {
        return parameterId in Config.container.characters.parameters.byId ||
        Config.container.characters.sequence.some(function(character)
        {
            return parameterId in Config.container.characters.byId[character.id].parameters.byId;
        });
    }

    function getNewDefaultParameterEffects(characterIdRef)
    {
        const parameterEffects = { userDefined: [], fixed: {} };
        parameterEffects.fixed.characterIndependent = { byId: {}, sequence: [] };
        for (const parameterId in Config.container.parameters.byId)
        {
            parameterEffects.fixed.characterIndependent.byId[parameterId] = [];
        }
        parameterEffects.fixed.perCharacter = { };
        for (const characterId in Config.container.characters.byId)
        {
            parameterEffects.fixed.perCharacter[characterId] = { byId: {}, sequence: [] };

            for (const parameterId in Config.container.characters.parameters.byId)
            {
                const statementScope = Config.container.characters.parameters.byId[parameterId].scopes.statementScope;
                if (statementScope === 'per-computer-own' && characterId !== characterIdRef) continue;
                parameterEffects.fixed.perCharacter[characterId].byId[parameterId] = [];
            }
            for (const parameterId in Config.container.characters.byId[characterId].parameters.byId)
            {
                const statementScope = Config.container.characters.byId[characterId].parameters.byId[parameterId].scopes.statementScope;
                if (statementScope === 'per-computer-own' && characterId !== characterIdRef) continue;
                parameterEffects.fixed.perCharacter[characterId].byId[parameterId] = [];
            }
        }
        return parameterEffects;
    }

    function getNewDefaultPropertyValues(acceptableStatementScopes, characterIdRef)
    {
        const propertyValues = {};

        propertyValues.characterIndependent = {};
        for (const propertyId in Config.container.properties.byId)
        {
            if (acceptableStatementScopes.indexOf(Config.container.properties.byId[propertyId].scopes.statementScope) === -1) continue;
            propertyValues.characterIndependent[propertyId] = Config.container.properties.byId[propertyId].type.defaultValue;
        }

        propertyValues.perCharacter = {};
        for (const characterId in Config.container.characters.byId)
        {
            propertyValues.perCharacter[characterId] = {};
            for (const propertyId in Config.container.characters.properties.byId)
            {
                const statementScope = Config.container.characters.properties.byId[propertyId].scopes.statementScope;
                if (acceptableStatementScopes.indexOf(statementScope) === -1) continue;
                if (statementScope === 'per-computer-own' && characterId !== characterIdRef) continue;
                propertyValues.perCharacter[characterId][propertyId] = Config.container.characters.properties.byId[propertyId].type.defaultValue;
            }
            for (const propertyId in Config.container.characters.byId[characterId].properties.byId)
            {
                const statementScope = Config.container.characters.byId[characterId].properties.byId[propertyId].scopes.statementScope;
                if (acceptableStatementScopes.indexOf(statementScope) === -1) continue;
                if (statementScope === 'per-computer-own' && characterId !== characterIdRef) continue;
                propertyValues.perCharacter[characterId][propertyId] = Config.container.characters.byId[characterId].properties.byId[propertyId].type.defaultValue;
            }
        }

        return propertyValues;
    }
})();

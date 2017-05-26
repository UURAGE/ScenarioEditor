/* ©Copyright Utrecht University (Department of Information and Computing Sciences) */

var Expression;

(function()
{
    "use strict";

    var kinds =
    {
        reference:
        {
            name: 'reference',
            appendControlTo: function(container, type)
            {
                var parameterSelect = $('<select>', { class: "parameter-idref" });
                Parameters.insertInto(parameterSelect, type);
                Config.insertParametersInto(parameterSelect, type);
                parameterSelect.on('change', function()
                {
                    container.children('.character-idref').remove();
                    var parameterIdRef = $(this).val();
                    if (Config.isCharacterParameter(parameterIdRef))
                    {
                        var characterIdRefSelect = $('<select>', { class: "character-idref" });
                        Config.insertCharactersInto(characterIdRefSelect, parameterIdRef);
                        container.append(characterIdRefSelect);
                    }
                });
                parameterSelect.trigger('change');
                container.append(parameterSelect);
            },
            getFromDOM: function(container, type)
            {
                var reference = {};
                reference.parameterIdRef = container.children('.parameter-idref').val();
                if (Config.isCharacterParameter(reference.parameterIdRef))
                {
                    reference.characterIdRef = container.children('.character-idref').val();
                }
                return reference;
            },
            setInDOM: function(container, type, reference)
            {
                container.children('.parameter-idref').val(reference.parameterIdRef).trigger('change');
                if (Config.isCharacterParameter(reference.parameterIdRef))
                {
                     container.children('.character-idref').val(reference.characterIdRef).trigger('change');
                }
            },
            fromXML: function(referenceXML, type)
            {
                var reference = {};
                if (referenceXML.hasAttribute("characteridref"))
                {
                    reference.characterIdRef = referenceXML.attributes.characteridref.value;
                }
                reference.parameterIdRef = referenceXML.attributes.idref.value;
                return reference;
            },
            toXML: function(expressionXML, type, reference)
            {
                var referenceXML;
                if (reference.characterIdRef)
                {
                    referenceXML = Utils.appendChild(expressionXML, "characterParameterReference");
                    referenceXML.setAttribute("characteridref", reference.characterIdRef);
                }
                else
                {
                    referenceXML = Utils.appendChild(expressionXML, "parameterReference");
                }
                referenceXML.setAttribute("idref", reference.parameterIdRef);
            },
            onTypeChange: function(previousType, newType, expression)
            {
                delete expression.kind;
                delete expression.reference;
                expression.kind = kinds.literal;
                expression.literal = newType.defaultValue;
            },
            onParameterTypeChange: function(parameter, type, expression)
            {
                if (expression.reference.parameterIdRef === parameter.id && !parameter.type.equals(type))
                {
                    delete expression.kind;
                    delete expression.reference;
                    expression.kind = kinds.literal;
                    expression.literal = type.defaultValue;
                }
            }
        },
        literal:
        {
            name: 'literal',
            appendControlTo: function(container, type)
            {
                type.appendControlTo(container);
            },
            getFromDOM: function(container, type)
            {
                return type.getFromDOM(container);
            },
            setInDOM: function(container, type, literal)
            {
                type.setInDOM(container, literal);
            },
            fromXML: function(literalXML, type)
            {
                return type.fromXML(literalXML);
            },
            toXML: function(expressionXML, type, literal)
            {
                var literalXML = Utils.appendChild(expressionXML, "literal");
                type.toXML(literalXML, literal);
            },
            onTypeChange: function(previousType, newType, expression)
            {
                expression.literal = newType.castFrom(previousType, expression.literal);
            },
            onParameterTypeChange: function(){}
        }
    };

    Expression =
    {
        kinds: kinds,
        appendControlsTo: appendControlsTo,
        setInDOM: setInDOM,
        getFromDOM: getFromDOM,
        onTypeChange: onTypeChange
    };

    function appendControlsTo(container, type)
    {
        var expressionSelect = $('<select>', { class: "expression-kind" });
        expressionSelect.append($('<option>', { value: kinds.literal.name, text: i18next.t('common:' + kinds.literal.name)}));
        if (Parameters.hasWithType(type) || Config.hasParameterWithType(type))
        {
            expressionSelect.append($('<option>', { value: kinds.reference.name, text: i18next.t('common:' + kinds.reference.name)}));
        }
        expressionSelect.on('change', function()
        {
            container.children('.expression').remove();
            var expressionContainer = $('<span>', { class: "expression" });
            kinds[$(this).val()].appendControlTo(expressionContainer, type);
            container.append(expressionContainer);
        });
        container.append(expressionSelect);
        expressionSelect.trigger('change');
    }

    function setInDOM(container, type, expression)
    {
        container.children('.expression-kind').val(expression.kind.name).trigger('change');
        var expressionContainer = container.children('.expression');
        expression.kind.setInDOM(expressionContainer, type, expression[expression.kind.name]);
    }

    function getFromDOM(container, type)
    {
        var expression = {};
        expression.kind = kinds[container.children('.expression-kind').val()];
        var expressionContainer = container.children('.expression');
        expression[expression.kind.name] = expression.kind.getFromDOM(expressionContainer, type);
        return expression;
    }

    function onTypeChange(container, previousType, newType, userTypeChange)
    {
        if (previousType)
        {
            var expression = getFromDOM(container, previousType);
            expression.kind.onTypeChange(previousType, newType, expression);
            container.empty();
            appendControlsTo(container, newType);
            setInDOM(container, newType, expression);
        }
        else
        {
            container.empty();
            appendControlsTo(container, newType);
        }
    }

})();

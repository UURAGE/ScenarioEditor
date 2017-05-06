/* ©Copyright Utrecht University (Department of Information and Computing Sciences) */

var Expression;

(function()
{
    "use strict";

    Expression =
    {
        appendControlsTo: appendControlsTo,
        onTypeChange: onTypeChange
    };

    var kinds =
    {
        reference: 'reference',
        literal: 'literal'
        setInDOM: setInDOM,
        getFromDOM: getFromDOM,
    };

    function appendControlsTo(container, htmlClass, type)
    {
        var expressionKindContainer = $('<span>', { class: htmlClass });

        var expressionSelect = $('<select>', { class: "expression-kind" });
        expressionSelect.append($('<option>', { value: kinds.literal, text: i18next.t('common:' + kinds.literal)}));
        if (Parameters.hasWithType(type) || Config.hasParameterWithType(type))
        {
            expressionSelect.append($('<option>', { value: kinds.reference, text: i18next.t('common:' + kinds.reference)}));
        }
        expressionSelect.on('change', function()
        {
            expressionKindContainer.children('.expression').remove();
            var expressionContainer = $('<span>', { class: "expression" });
            var kind = $(this).val();
            switch (kind)
            {
                case kinds.reference:
                {
                    var parameterSelect = $('<select>', { class: "parameter-idref" });
                    Parameters.insertInto(parameterSelect, type);
                    Config.insertParametersInto(parameterSelect, type);
                    parameterSelect.on('change', function()
                    {
                        expressionContainer.children('.character-idref').remove();
                        var parameterIdRef = $(this).val();
                        if (Config.isCharacterParameter(parameterIdRef))
                        {
                            var characterIdRefSelect = $('<select>', { class: "character-idref" });
                            Config.insertCharactersInto(characterIdRefSelect, parameterIdRef);
                            expressionContainer.append(characterIdRefSelect);
                        }
                    });
                    parameterSelect.trigger('change');
                    expressionContainer.append(parameterSelect);
                    break;
                }
                case kinds.literal:
                {
                    type.appendControlTo(expressionContainer);
                    break;
                }
            }
            expressionKindContainer.append(expressionContainer);
        });
        expressionKindContainer.append(expressionSelect);
        expressionSelect.trigger('change');

        container.append(expressionKindContainer);
    }

    function setInDOM(container, type, expression)
    {
        container.children('.expression-kind').val(expression.kind).trigger('change');
        var expressionContainer = container.children('.expression');
        switch (expression.kind)
        {
            case kinds.reference:
            {
                expressionContainer.children('.parameter-idref').val(expression.expression.parameterIdRef).trigger('change');
                if (Config.isCharacterParameter(expression.expression.parameterIdRef))
                {
                     expressionContainer.children('.character-idref').val(expression.expression.characterIdRef).trigger('change');
                }
                break;
            }
            case kinds.literal:
            {
                type.setInDOM(expressionContainer, expression.expression);
                break;
            }
            default:
                console.error("No case for expression kind: " + expression.kind);
                break;
        }
    }

    function getFromDOM(container, type)
    {
        var expression = {};
        expression.kind = container.children('.expression-kind').val();
        var expressionContainer = container.children('.expression');
        switch (expression.kind)
        {
            case kinds.reference:
            {
                expression.expression = {};
                expression.expression.parameterIdRef = expressionContainer.children('.parameter-idref').val();
                if (Config.isCharacterParameter(expression.expression.parameterIdRef))
                {
                    expression.expression.characterIdRef = expressionContainer.children('.character-idref').val();
                }
                break;
            }
            case kinds.literal:
            {
                expression.expression = type.getFromDOM(expressionContainer);
                break;
            }
            default:
                console.error("No case for expression kind: " + expression.kind);
                break;
        }
        return expression;
    }

    function onTypeChange(container, htmlClass, previousType, newType, userTypeChange)
    {
        container.empty();
        appendControlsTo(container, htmlClass, newType);
    }

})();

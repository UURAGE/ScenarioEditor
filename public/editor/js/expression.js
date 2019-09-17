/* © Utrecht University and DialogueTrainer */

var Expression;

(function()
{
    "use strict";

    var kinds =
    {
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
                var literalXML = Utils.appendChild(expressionXML, this.name);
                type.toXML(literalXML, literal);
            },
            isAvailableFor: function(type)
            {
                return true;
            },
            handleTypeChange: function(previousType, newType, expression)
            {
                expression.literal = newType.castFrom(previousType, expression.literal);
            },
            handleParameterTypeChange: function(){},
            handleParameterRemoval: function(){}
        },
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

                    container.children('.reference-calculate').remove();
                    var parameter = Config.findParameterById(parameterIdRef);
                    if (!parameter) parameter = Parameters.container.byId[parameterIdRef];
                    if (parameter.type.name === Types.primitives.integer.name &&
                        'maximum' in parameter.type && 'minimum' in parameter.type)
                    {
                        var calculateSelect = $('<select>', { class: "reference-calculate" });
                        calculateSelect.append($('<option>', { value: 'value', text: i18next.t('common:as_value') }));
                        calculateSelect.append($('<option>', { value: 'percentage', text: i18next.t('common:as_percentage') }));
                        container.append(calculateSelect);
                        $(this).attr('title', i18next.t('common:minimum') + ': ' + parameter.type.minimum + ', ' +
                            i18next.t('common:maximum') + ': ' + parameter.type.maximum);
                    }
                });
                container.append(parameterSelect);
                parameterSelect.trigger('change');
            },
            getFromDOM: function(container, type)
            {
                var reference = {};
                reference.parameterIdRef = container.children('.parameter-idref').val();
                if (Config.isCharacterParameter(reference.parameterIdRef))
                {
                    reference.characterIdRef = container.children('.character-idref').val();
                }
                var calculateSelect = container.children('.reference-calculate');
                if (calculateSelect.length > 0)
                {
                    reference.calculate = calculateSelect.val();
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
                var calculateSelect = container.children('.reference-calculate');
                if (reference.calculate && calculateSelect.length > 0)
                {
                    calculateSelect.val(reference.calculate);
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
                if (referenceXML.hasAttribute("calculate"))
                {
                    reference.calculate = referenceXML.attributes.calculate.value;
                }
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
                if (reference.calculate)
                {
                    referenceXML.setAttribute("calculate", reference.calculate);
                }
                referenceXML.setAttribute("idref", reference.parameterIdRef);
            },
            isAvailableFor: function(type)
            {
                return Parameters.hasWithType(type) || Config.hasParameterWithType(type);
            },
            handleTypeChange: function(previousType, newType, expression)
            {
                replaceExpressionWithDefaultLiteral(expression, newType);
            },
            handleParameterTypeChange: function(oldParameter, newParameter, type, expression)
            {
                if (expression.reference.parameterIdRef === oldParameter.id)
                {
                    if (!newParameter.type.equals(type))
                    {
                        replaceExpressionWithDefaultLiteral(expression, type);
                    }
                    else if ('calculate' in expression.reference &&
                        !(newParameter.type.name === Types.primitives.integer.name &&
                            'maximum' in newParameter.type && 'minimum' in newParameter.type))
                    {
                        delete expression.reference.calculate;
                    }
                    else if (newParameter.type.name === Types.primitives.integer.name &&
                        !('calculate' in expression.reference) &&
                        'maximum' in newParameter.type && 'minimum' in newParameter.type)
                    {
                        expression.reference.calculate = 'percentage';
                    }
                }
            },
            handleParameterRemoval: function(parameterId, type, expression)
            {
                if (expression.reference.parameterIdRef === parameterId)
                {
                    replaceExpressionWithDefaultLiteral(expression, type);
                }
            }
        },
        sum:
        {
            name: 'sum',
            appendControlTo: function(container, type)
            {
                var sumExpressionsContainer = $('<ul>');
                var addButton = Parts.addButton("", "add-sum-expression");
                addButton.on('click', function()
                {
                    var sumExpressionAndDeleteButtonContainer = $('<li>');

                    var sumExpressionContainer = $('<span>', { class: "sum-expression" });
                    Expression.appendControlsTo(sumExpressionContainer, type);
                    sumExpressionAndDeleteButtonContainer.append(sumExpressionContainer);

                    var deleteButton = Parts.deleteButton();
                    deleteButton.on('click', function()
                    {
                        sumExpressionAndDeleteButtonContainer.remove();
                    });
                    sumExpressionAndDeleteButtonContainer.append(deleteButton);

                    sumExpressionsContainer.append(sumExpressionAndDeleteButtonContainer);
                });
                container.append(sumExpressionsContainer);

                container.append(addButton);
            },
            getFromDOM: function(container, type)
            {
                return container.children('ul').children('li').map(function()
                {
                    return Expression.getFromDOM($(this).children('.sum-expression'), type);
                }).get();
            },
            setInDOM: function(container, type, sum)
            {
                sum.forEach(function(expression)
                {
                    var addButton = container.children('.add-sum-expression');
                    addButton.trigger('click');
                    var sumExpressionContainer = container.children('ul').children('li').last().children('.sum-expression');
                    Expression.setInDOM(sumExpressionContainer, type, expression);
                });
            },
            fromXML: function(sumXML, type)
            {
                return $(sumXML).children().map(function()
                {
                    return Expression.fromXML(this, type);
                }).get();
            },
            toXML: function(expressionXML, type, sum)
            {
                var sumXML = Utils.appendChild(expressionXML, this.name);
                sum.forEach(function(expression)
                {
                    Expression.toXML(sumXML, type, expression);
                });
            },
            isAvailableFor: function(type)
            {
                return type.name === Types.primitives.integer.name;
            },
            handleTypeChange: function(previousType, newType, expression)
            {
                if (this.isAvailableFor(newType))
                {
                    expression.sum.forEach(function(sumExpression)
                    {
                        sumExpression.kind.handleTypeChange(previousType, newType, sumExpression);
                    });
                }
                else
                {
                    replaceExpressionWithDefaultLiteral(expression, newType);
                }
            },
            handleParameterTypeChange: function(oldParameter, newParameter, type, expression)
            {
                expression.sum.forEach(function(sumExpression)
                {
                    sumExpression.kind.handleParameterTypeChange(oldParameter, newParameter, type, sumExpression);
                });
            },
            handleParameterRemoval: function(parameterId, type, expression)
            {
                expression.sum.forEach(function(sumExpression)
                {
                    sumExpression.kind.handleParameterRemoval(parameterId, type, sumExpression);
                });
            }
        },
        scale:
        {
            name: 'scale',
            appendControlTo: function(container, type)
            {
                var expressionContainer = $('<span>', { class: "scale-expression" });
                Expression.appendControlsTo(expressionContainer, type);
                container.append(expressionContainer);

                var scaleOperatorSelect = $('<select>', { class: "scale-operator"});
                scaleOperatorSelect.append($('<option>', { value: 'scalar', text: '*' }));
                scaleOperatorSelect.append($('<option>', { value: 'divisor', text: '/' }));
                container.append(scaleOperatorSelect);

                var scaleValueContainer = $('<span>', { class: "scale-value" });
                type.appendControlTo(scaleValueContainer);
                container.append(scaleValueContainer);
            },
            getFromDOM: function(container, type)
            {
                return {
                    expression: Expression.getFromDOM(container.children('.scale-expression'), type),
                    operator: container.children('.scale-operator').val(),
                    value: type.getFromDOM(container.children('.scale-value'))
                };
            },
            setInDOM: function(container, type, scale)
            {
                Expression.setInDOM(container.children('.scale-expression'), type, scale.expression);
                container.children('.scale-operator').val(scale.operator).trigger('change');
                type.setInDOM(container.children('.scale-value'), scale.value);
            },
            fromXML: function(scaleXML, type)
            {
                var scale;
                var expression = Expression.fromXML($(scaleXML).children()[0], type);
                if (scaleXML.hasAttribute('divisor'))
                {
                    scale = {
                        expression: expression,
                        operator: 'divisor',
                        value: parseInt(scaleXML.attributes.divisor.value)
                    };
                }

                var scalar = parseInt(scaleXML.attributes.scalar.value);
                if (!scale || scalar !== 1)
                {
                    if (scale)
                    {
                        expression = {
                            kind: this,
                            scale: scale
                        };
                    }
                    scale = {
                        expression: expression,
                        operator: 'scalar',
                        value: scalar
                    };
                }

                return scale;
            },
            toXML: function(expressionXML, type, scale)
            {
                var scaleXML = Utils.appendChild(expressionXML, this.name);
                if (scale.operator !== 'scalar')
                {
                    scaleXML.setAttribute('scalar', 1);
                }
                scaleXML.setAttribute(scale.operator, scale.value);
                Expression.toXML(scaleXML, type, scale.expression);
            },
            isAvailableFor: function(type)
            {
                return type.name === Types.primitives.integer.name;
            },
            handleTypeChange: function(previousType, newType, expression)
            {
                if (this.isAvailableFor(newType))
                {
                    expression.scale.expression.kind.handleTypeChange(previousType, newType, expression.scale.expression);
                    newType.castFrom(previousType, expression.scale.value);
                }
                else
                {
                    replaceExpressionWithDefaultLiteral(expression, newType);
                }
            },
            handleParameterTypeChange: function(oldParameter, newParameter, type, expression)
            {
                expression.scale.expression.kind.handleParameterTypeChange(oldParameter, newParameter, type, expression.scale.expression);
            },
            handleParameterRemoval: function(parameterId, type, expression)
            {
                expression.scale.expression.kind.handleParameterRemoval(parameterId, type, expression.scale.expression);
            }
        },
        choose:
        {
            name: 'choose',
            appendControlTo: function(container, type)
            {
                var whensContainer = $('<ul>');
                var addButton = Parts.addButton("", "add-when");
                addButton.on('click', function()
                {
                    var whenAndDeleteButtonContainer = $('<li>');

                    var whenContainer = $('<span>', { class: "when", text: i18next.t('common:when') + ' ' });
                    Condition.appendControlsTo(whenContainer, true);
                    Expression.appendControlsTo(whenContainer, type);
                    whenAndDeleteButtonContainer.append(whenContainer);

                    var deleteButton = Parts.deleteButton();
                    deleteButton.on('click', function()
                    {
                        whenAndDeleteButtonContainer.remove();
                    });
                    whenAndDeleteButtonContainer.append(deleteButton);

                    whensContainer.append(whenAndDeleteButtonContainer);
                });
                container.append(whensContainer);

                container.append(addButton);

                var otherwiseContainer = $('<div>', { class: "otherwise", text: i18next.t('common:otherwise') + ' ' });
                Expression.appendControlsTo(otherwiseContainer, type);
                container.append(otherwiseContainer);
            },
            getFromDOM: function(container, type)
            {
                var choose =
                {
                    whens: [],
                    otherwise: Expression.getFromDOM(container.children('.otherwise'), type)
                };

                container.children('ul').children('li').each(function()
                {
                    var whenContainer = $(this).children('.when');
                    var condition = Condition.getFromDOM(whenContainer);
                    if (condition)
                    {
                        choose.whens.push(
                        {
                            condition: condition,
                            expression: Expression.getFromDOM(whenContainer, type)
                        });
                    }
                });

                return choose;
            },
            setInDOM: function(container, type, choose)
            {
                choose.whens.forEach(function(when)
                {
                    var addButton = container.children('.add-when');
                    addButton.trigger('click');
                    var whenContainer = container.children('ul').children('li').last().children('.when');
                    Condition.setInDOM(whenContainer, when.condition, true);
                    Expression.setInDOM(whenContainer, type, when.expression);
                });
                Expression.setInDOM(container.children('.otherwise'), type, choose.otherwise);
            },
            fromXML: function(chooseXML, type)
            {
                return {
                    whens: $(chooseXML).children('when').map(function()
                    {
                        return {
                            condition: Condition.fromXML($(this).children('condition').children()[0]),
                            expression: Expression.fromXML($(this).children('expression').children()[0], type)
                        };
                    }).get(),
                    otherwise: Expression.fromXML($(chooseXML).children('otherwise').children()[0], type)
                };
            },
            toXML: function(expressionXML, type, choose)
            {
                var chooseXML = Utils.appendChild(expressionXML, this.name);

                choose.whens.forEach(function(when)
                {
                    var whenXML = Utils.appendChild(chooseXML, 'when');

                    var conditionXML = Utils.appendChild(whenXML, 'condition');
                    Condition.toXML(conditionXML, when.condition);

                    var expressionXML = Utils.appendChild(whenXML, 'expression');
                    Expression.toXML(expressionXML, type, when.expression);
                });

                var otherwiseXML = Utils.appendChild(chooseXML, 'otherwise');
                Expression.toXML(otherwiseXML, type, choose.otherwise);
            },
            isAvailableFor: function(type)
            {
                return true;
            },
            handleTypeChange: function(previousType, newType, expression)
            {
                expression.choose.whens.forEach(function(when)
                {
                    when.expression.kind.handleTypeChange(previousType, newType, when.expression);
                });
                expression.choose.otherwise.kind.handleTypeChange(previousType, newType, expression.choose.otherwise);
            },
            handleParameterTypeChange: function(oldParameter, newParameter, type, expression)
            {
                expression.choose.whens.forEach(function(when)
                {
                    Condition.handleParameterTypeChange(oldParameter, newParameter, when.condition);
                    when.expression.kind.handleParameterTypeChange(oldParameter, newParameter, type, when.expression);
                });
                expression.choose.otherwise.kind.handleParameterTypeChange(oldParameter, newParameter, type, expression.choose.otherwise);
            },
            handleParameterRemoval: function(parameterId, type, expression)
            {
                var doesNotReferToParameterId = function(condition) { return condition.idRef !== parameterId; };
                for (var i = 0; i < expression.choose.whens.length; i++)
                {
                    var when = expression.choose.whens[i];
                    when.condition = Condition.filter(doesNotReferToParameterId, when.condition);
                    when.expression.kind.handleParameterRemoval(parameterId, type, when.expression);
                    if (!when.condition)
                    {
                        expression.choose.whens.splice(i, 1);
                        i--;
                    }
                }
                expression.choose.otherwise.kind.handleParameterRemoval(parameterId, type, expression.choose.otherwise);
            }
        },
        score:
        {
            name: 'score',
            appendControlTo: function(container, type)
            {
                var scoreItemsContainer = $('<ul>');
                var addButton = Parts.addButton("", "add-score-item");
                addButton.on('click', function()
                {
                    var scoreItemAndDeleteButtonContainer = $('<li>');

                    var referenceContainer = $('<span>', { class: "score-reference" });
                    kinds.reference.appendControlTo(referenceContainer, type);
                    scoreItemAndDeleteButtonContainer.append(referenceContainer);

                    var weightContainer = $('<span>', { class: "score-weight" });
                    Types.primitives.integer.appendControlTo(weightContainer);
                    Types.primitives.integer.setInDOM(weightContainer, 1);
                    scoreItemAndDeleteButtonContainer.append(weightContainer);

                    var deleteButton = Parts.deleteButton();
                    deleteButton.on('click', function()
                    {
                        scoreItemAndDeleteButtonContainer.remove();
                    });
                    scoreItemAndDeleteButtonContainer.append(deleteButton);

                    scoreItemsContainer.append(scoreItemAndDeleteButtonContainer);
                });
                container.append(scoreItemsContainer);

                container.append(addButton);
            },
            getFromDOM: function(container, type)
            {
                return container.children('ul').children('li').map(function()
                {
                    return {
                        reference: kinds.reference.getFromDOM($(this).children('.score-reference'), type),
                        weight: Types.primitives.integer.getFromDOM($(this).children('.score-weight'))
                    };
                }).get();
            },
            setInDOM: function(container, type, score)
            {
                score.forEach(function(scoreItem)
                {
                    var addButton = container.children('.add-score-item');
                    addButton.trigger('click');
                    var scoreItemContainer = container.children('ul').children('li').last();
                    kinds.reference.setInDOM(scoreItemContainer.children('.score-reference'), type, scoreItem.reference);
                    Types.primitives.integer.setInDOM(scoreItemContainer.children('.score-weight'), scoreItem.weight);
                });
            },
            adopt: function(expression)
            {
                if (!(expression.kind.name === kinds.scale.name &&
                    expression.scale.operator === 'divisor' &&
                    expression.scale.expression.kind.name === kinds.sum.name)) return null;
                var score = [];
                var divisor = 0;
                expression.scale.expression.sum.forEach(function(itemExpression)
                {
                    if (!(divisor !== null &&
                        itemExpression.kind.name === kinds.scale.name &&
                        itemExpression.scale.operator === 'scalar' &&
                        itemExpression.scale.expression.kind.name === kinds.reference.name))
                    {
                        divisor = null;
                        return;
                    }
                    score.push(
                    {
                        reference: itemExpression.scale.expression.reference,
                        weight: itemExpression.scale.value
                    });
                    divisor += itemExpression.scale.value;
                });
                if (divisor !== expression.scale.value) return null;
                return {
                    kind: this,
                    score: score
                };
            },
            fromXML: function(scoreXML, type)
            {
                return null;
            },
            toXML: function(expressionXML, type, score)
            {
                var itemExpressions = [];
                var divisor = 0;
                score.forEach(function(scoreItem)
                {
                    itemExpressions.push(
                    {
                        kind: kinds.scale,
                        scale:
                        {
                            expression:
                            {
                                kind: kinds.reference,
                                reference: scoreItem.reference
                            },
                            operator: 'scalar',
                            value: scoreItem.weight
                        }
                    });
                    divisor += scoreItem.weight;
                });
                var sumExpression =
                {
                    kind: kinds.scale,
                    scale:
                    {
                        expression:
                        {
                            kind: kinds.sum,
                            sum: itemExpressions
                        },
                        operator: 'divisor',
                        value: divisor
                    }
                };
                Expression.toXML(expressionXML, type, sumExpression);
            },
            isAvailableFor: function(type)
            {
                return type.name === Types.primitives.integer.name &&
                    (Parameters.hasWithType(type) || Config.hasParameterWithType(type));
            },
            handleTypeChange: function(previousType, newType, expression)
            {
                if (!this.isAvailableFor(newType))
                {
                    replaceExpressionWithDefaultLiteral(expression, newType);
                }
            },
            handleParameterTypeChange: function(oldParameter, newParameter, type, expression)
            {
                if (newParameter.type.name !== Types.primitives.integer.name)
                {
                    this.handleParameterRemoval(newParameter.id, type, expression);
                }
                if (expression.kind.name === kinds.score.name)
                {
                    expression.score.forEach(function(scoreItem)
                    {
                        kinds.reference.handleParameterTypeChange(oldParameter, newParameter, type, scoreItem);
                    });
                }
            },
            handleParameterRemoval: function(parameterId, type, expression)
            {
                expression.score = expression.score.filter(function(scoreItem)
                {
                    return scoreItem.reference.parameterIdRef !== parameterId;
                });
                if (expression.score.length === 0)
                {
                    replaceExpressionWithDefaultLiteral(expression, type);
                }
            }
        }
    };

    Expression =
    {
        kinds: kinds,
        appendControlsTo: appendControlsTo,
        getFromDOM: getFromDOM,
        setInDOM: setInDOM,
        fromXML: fromXML,
        toXML: toXML,
        handleTypeChange: handleTypeChange
    };

    function appendControlsTo(container, type)
    {
        var expressionSelect = $('<select>', { class: "expression-kind" });
        for (var kindName in kinds)
        {
            if (kinds[kindName].isAvailableFor(type))
            {
                expressionSelect.append($('<option>', { value: kindName, text: i18next.t('common:kinds.' + kindName)}));
            }
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

    function fromXML(expressionXML, type)
    {
        var kind;
        if (!(expressionXML.nodeName in kinds))
        {
            kind = kinds.reference;
        }
        else
        {
            kind = kinds[expressionXML.nodeName];
        }
        var expression = { kind: kind };
        expression[kind.name] = kind.fromXML(expressionXML, type);

        for (var kindName in kinds)
        {
            if (!kinds[kindName].adopt) continue;
            var newExpression = kinds[kindName].adopt(expression);
            if (newExpression !== null)
            {
                expression = newExpression;
                break;
            }
        }

        return expression;
    }

    function toXML(expressionXML, type, expression)
    {
        expression.kind.toXML(expressionXML, type, expression[expression.kind.name]);
    }

    function handleTypeChange(container, previousType, newType)
    {
        if (previousType)
        {
            var expression = getFromDOM(container, previousType);
            expression.kind.handleTypeChange(previousType, newType, expression);
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

    function replaceExpressionWithDefaultLiteral(expression, type)
    {
        delete expression[expression.kind.name];
        delete expression.kind;
        expression.kind = kinds.literal;
        expression.literal = type.defaultValue;
    }

})();

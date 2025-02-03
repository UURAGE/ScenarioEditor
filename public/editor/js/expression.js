// © DialogueTrainer

/* exported Expression */
let Expression;

(function()
{
    "use strict";

    const kinds =
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
                const literalXML = Utils.appendChild(expressionXML, this.name);
                type.toXML(literalXML, literal);
            },
            isAvailableFor: function()
            {
                return true;
            },
            handleTypeChange: function(previousType, newType, expression)
            {
                expression.literal = newType.castFrom(previousType, expression.literal);
            },
            handleParameterTypeChange: function() {},
            handleParameterRemoval: function() {}
        },
        reference:
        {
            name: 'reference',
            appendControlTo: function(container, type, hideCalculateControl)
            {
                const parameterSelect = $('<select>', { class: "parameter-idref" });
                Parameters.insertInto(parameterSelect, type);
                Config.insertParametersInto(parameterSelect, type);
                parameterSelect.on('change', function()
                {
                    container.children('.character-idref').remove();
                    const parameterIdRef = $(this).val();
                    if (Config.isCharacterParameter(parameterIdRef))
                    {
                        const characterIdRefSelect = $('<select>', { class: "character-idref" });
                        Config.insertCharactersInto(characterIdRefSelect, parameterIdRef);
                        container.append(characterIdRefSelect);
                    }

                    container.children('.reference-calculate').remove();
                    const parameter = Config.findParameterById(parameterIdRef) ??
                        Parameters.container.byId[parameterIdRef];
                    if (!hideCalculateControl && parameter.type.name === Types.primitives.integer.name &&
                        'maximum' in parameter.type && 'minimum' in parameter.type)
                    {
                        const calculateSelect = $('<select>', { class: "reference-calculate" });
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
            getFromDOM: function(container)
            {
                const reference = {};
                reference.parameterIdRef = container.children('.parameter-idref').val();
                if (Config.isCharacterParameter(reference.parameterIdRef))
                {
                    reference.characterIdRef = container.children('.character-idref').val();
                }
                const calculateSelect = container.children('.reference-calculate');
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
                const calculateSelect = container.children('.reference-calculate');
                if (reference.calculate && calculateSelect.length > 0)
                {
                    calculateSelect.val(reference.calculate);
                }
            },
            fromXML: function(referenceXML)
            {
                const reference = {};
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
                let referenceXML;
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
                if (!newType.equals(previousType))
                {
                    replaceExpressionWithDefaultLiteral(expression, newType);
                }
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
                const sumExpressionsContainer = $('<ul>');
                const addButton = Parts.addButton(i18next.t('evaluations:add_to_sum'), "add-sum-expression add");
                addButton.on('click', function()
                {
                    const sumExpressionAndDeleteButtonContainer = $('<li>');

                    const sumExpressionContainer = $('<span>', { class: "sum-expression" });
                    Expression.appendControlsTo(sumExpressionContainer, type);
                    sumExpressionAndDeleteButtonContainer.append(sumExpressionContainer);

                    const deleteButton = Parts.deleteButton();
                    deleteButton.on('click', function()
                    {
                        const expressionKind = Object.keys(kinds).find(kind => sumExpressionContainer.hasClass(kind));
                        const translatedKind = i18next.t(`common:kinds.${expressionKind}`);

                        Utils.showExpressionDeletionWarning(
                            sumExpressionContainer,
                            i18next.t('evaluations:delete_from_sum', { kind: translatedKind })
                        ).then(function(confirmed)
                        {
                            if (confirmed)
                            {
                                sumExpressionAndDeleteButtonContainer.remove();
                            }
                        });
                    });
                    sumExpressionContainer.append(deleteButton);

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
                    const addButton = container.children('.add-sum-expression');
                    addButton.trigger('click');
                    const sumExpressionContainer = container.children('ul').children('li').last().children('.sum-expression');
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
                const sumXML = Utils.appendChild(expressionXML, this.name);
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
                const expressionContainer = $('<span>', { class: "scale-expression" });
                Expression.appendControlsTo(expressionContainer, type);
                container.append(expressionContainer);

                const scaleOperatorSelect = $('<select>', { class: "scale-operator" });
                scaleOperatorSelect.append($('<option>', { value: 'scalar', text: '*' }));
                scaleOperatorSelect.append($('<option>', { value: 'divisor', text: '/' }));
                container.append(scaleOperatorSelect);

                const scaleValueContainer = $('<span>', { class: "scale-value" });
                type.appendControlTo(scaleValueContainer);
                scaleValueContainer.children('input').val(1); // Default scale by 1
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
                let scale;
                let expression = Expression.fromXML($(scaleXML).children()[0], type);
                if (scaleXML.hasAttribute('divisor'))
                {
                    scale = {
                        expression: expression,
                        operator: 'divisor',
                        value: parseInt(scaleXML.attributes.divisor.value)
                    };
                }

                const scalar = parseInt(scaleXML.attributes.scalar.value);
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
                const scaleXML = Utils.appendChild(expressionXML, this.name);
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
        divide:
        {
            name: 'divide',
            appendControlTo: function(container, type)
            {
                const dividendContainer = $('<span>', { class: "dividend" });
                Expression.appendControlsTo(dividendContainer, type);
                container.append(dividendContainer);

                container.append($('<hr>'));

                const divisorContainer = $('<span>', { class: "divisor" });
                Expression.appendControlsTo(divisorContainer, type);
                container.append(divisorContainer);
            },
            getFromDOM: function(container, type)
            {
                return {
                    dividend: Expression.getFromDOM(container.children('.dividend'), type),
                    divisor: Expression.getFromDOM(container.children('.divisor'), type)
                };
            },
            setInDOM: function(container, type, divide)
            {
                Expression.setInDOM(container.children('.dividend'), type, divide.dividend);
                Expression.setInDOM(container.children('.divisor'), type, divide.divisor);
            },
            fromXML: function(divideXML, type)
            {
                return {
                    dividend: Expression.fromXML($(divideXML).children('dividend').children()[0], type),
                    divisor: Expression.fromXML($(divideXML).children('divisor').children()[0], type)
                };
            },
            toXML: function(expressionXML, type, divide)
            {
                const divideXML = Utils.appendChild(expressionXML, this.name);
                Expression.toXML(Utils.appendChild(divideXML, 'dividend'), type, divide.dividend);
                Expression.toXML(Utils.appendChild(divideXML, 'divisor'), type, divide.divisor);
            },
            isAvailableFor: function(type)
            {
                return type.name === Types.primitives.integer.name;
            },
            handleTypeChange: function(previousType, newType, expression)
            {
                if (this.isAvailableFor(newType))
                {
                    expression.divide.dividend.kind.handleTypeChange(previousType, newType, expression.divide.dividend);
                    expression.divide.divisor.kind.handleTypeChange(previousType, newType, expression.divide.divisor);
                }
                else
                {
                    replaceExpressionWithDefaultLiteral(expression, newType);
                }
            },
            handleParameterTypeChange: function(oldParameter, newParameter, type, expression)
            {
                expression.divide.dividend.kind.handleParameterTypeChange(oldParameter, newParameter, type, expression.divide.dividend);
                expression.divide.divisor.kind.handleParameterTypeChange(oldParameter, newParameter, type, expression.divide.divisor);
            },
            handleParameterRemoval: function(parameterId, type, expression)
            {
                expression.divide.dividend.kind.handleParameterRemoval(parameterId, type, expression.divide.dividend);
                expression.divide.divisor.kind.handleParameterRemoval(parameterId, type, expression.divide.divisor);
            }
        },
        choose:
        {
            name: 'choose',
            appendControlTo: function(container, type)
            {
                const whensContainer = $('<ul>');
                const addButton = Parts.addButton(i18next.t('evaluations:add_when'), "add-when");
                addButton.on('click', function()
                {
                    const whenAndDeleteButtonContainer = $('<li>');

                    const whenContainer = $('<div>', { class: "when" });
                    whenContainer.append($('<label>', { text: i18next.t('common:when') }));
                    const deleteButton = Parts.deleteButton();
                    whenContainer.append(deleteButton);

                    Condition.appendControlsTo(whenContainer, true);

                    const thenContainer = $('<div>', { class: 'then' });
                    thenContainer.append($('<label>', { text: i18next.t('common:then') }));
                    const expressionContainer = $('<div>');
                    Expression.appendControlsTo(expressionContainer, type);
                    thenContainer.append(expressionContainer);
                    whenContainer.append(thenContainer);
                    whenAndDeleteButtonContainer.append(whenContainer);

                    deleteButton.on('click', function()
                    {
                        Utils.showExpressionDeletionWarning(
                            whenContainer,
                            i18next.t('evaluations:delete_when')
                        ).then(function(confirmed)
                        {
                            if (confirmed)
                            {
                                whenAndDeleteButtonContainer.remove();
                            }
                        });
                    });

                    whensContainer.append(whenAndDeleteButtonContainer);
                });
                container.append(whensContainer);

                container.append(addButton);

                const otherwiseContainer = $('<div>', { class: "otherwise" }).append($('<label>', { text: i18next.t('common:otherwise') + ' ' }));

                const expressionContainer = $('<div>');
                Expression.appendControlsTo(expressionContainer, type);
                otherwiseContainer.append(expressionContainer);
                container.append(otherwiseContainer);
            },
            getFromDOM: function(container, type)
            {
                const choose =
                {
                    whens: [],
                    otherwise: Expression.getFromDOM(container.children('.otherwise').children('div'), type)
                };

                container.children('ul').children('li').each(function()
                {
                    const whenContainer = $(this).children('.when');
                    const condition = Condition.getFromDOM(whenContainer);
                    if (condition)
                    {
                        choose.whens.push(
                        {
                            condition: condition,
                            expression: Expression.getFromDOM(whenContainer.children('.then').children('div'), type)
                        });
                    }
                });

                return choose;
            },
            setInDOM: function(container, type, choose)
            {
                choose.whens.forEach(function(when)
                {
                    const addButton = container.children('.add-when');
                    addButton.trigger('click');
                    const whenContainer = container.children('ul').children('li').last().children('.when');
                    Condition.setInDOM(whenContainer, when.condition, true);
                    Expression.setInDOM(whenContainer.children('.then').children('div'), type, when.expression);
                });
                Expression.setInDOM(container.children('.otherwise').children('div'), type, choose.otherwise);
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
                const chooseXML = Utils.appendChild(expressionXML, this.name);

                choose.whens.forEach(function(when)
                {
                    const whenXML = Utils.appendChild(chooseXML, 'when');

                    const conditionXML = Utils.appendChild(whenXML, 'condition');
                    Condition.toXML(conditionXML, when.condition);

                    const expressionXML = Utils.appendChild(whenXML, 'expression');
                    Expression.toXML(expressionXML, type, when.expression);
                });

                const otherwiseXML = Utils.appendChild(chooseXML, 'otherwise');
                Expression.toXML(otherwiseXML, type, choose.otherwise);
            },
            isAvailableFor: function()
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
                const doesNotReferToParameterId = function(condition) { return condition.idRef !== parameterId; };
                for (let i = 0; i < expression.choose.whens.length; i++)
                {
                    const when = expression.choose.whens[i];
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
                const scoreItemsContainer = $('<ul>');
                const addButton = Parts.addButton(i18next.t('evaluations:add_to_score'), "add-score-item");
                addButton.on('click', function()
                {
                    const scoreItemAndDeleteButtonContainer = $('<li>');

                    const referenceContainer = $('<span>', { class: "score-reference" });
                    kinds.reference.appendControlTo(referenceContainer, type);
                    scoreItemAndDeleteButtonContainer.append(referenceContainer);

                    const weightContainer = $('<span>', { class: "score-weight" });
                    weightContainer.append($('<span>', { text: "*" }));
                    Types.primitives.integer.appendControlTo(weightContainer);
                    Types.primitives.integer.setInDOM(weightContainer, 1);
                    scoreItemAndDeleteButtonContainer.append(weightContainer);

                    const deleteButton = Parts.deleteButton();
                    deleteButton.on('click', function()
                    {
                        Utils.showExpressionDeletionWarning(
                            scoreItemAndDeleteButtonContainer,
                            i18next.t('evaluations:delete_from_score')
                        ).then(function(confirmed)
                        {
                            if (confirmed)
                            {
                                scoreItemAndDeleteButtonContainer.remove();
                            }
                        });
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
                    const addButton = container.children('.add-score-item');
                    addButton.trigger('click');
                    const scoreItemContainer = container.children('ul').children('li').last();
                    kinds.reference.setInDOM(scoreItemContainer.children('.score-reference'), type, scoreItem.reference);
                    Types.primitives.integer.setInDOM(scoreItemContainer.children('.score-weight'), scoreItem.weight);
                });
            },
            adopt: function(expression)
            {
                if (!(expression.kind.name === kinds.scale.name &&
                    expression.scale.operator === 'divisor' &&
                    expression.scale.expression.kind.name === kinds.sum.name)) return null;
                const score = [];
                let divisor = 0;
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
            fromXML: function()
            {
                return null;
            },
            toXML: function(expressionXML, type, score)
            {
                const itemExpressions = [];
                let divisor = 0;
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
                const sumExpression =
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
        },
        profileScore:
        {
            name: 'profileScore',
            appendControlTo: function(container, type)
            {
                const referenceContainer = $('<span>', { class: "profile-reference" });
                kinds.reference.appendControlTo(referenceContainer, type, true);
                container.append(referenceContainer);

                container.append($('<span>', { text: i18next.t('common:compared_with') }));

                const comparisonReferencesContainer = $('<ul>');
                const addButton = Parts.addButton(i18next.t('evaluations:add_to_profile_score'), "add-profile-comparison-reference");
                const appendComparisonReferenceContainer = function()
                {
                    const comparisonReferenceContainer = $('<li>');

                    const referenceContainer = $('<span>', { class: "profile-comparison-reference" });
                    kinds.reference.appendControlTo(referenceContainer, type, true);
                    comparisonReferenceContainer.append(referenceContainer);

                    if (comparisonReferencesContainer.children().length >= 1)
                    {
                        const deleteButton = Parts.deleteButton();
                        deleteButton.on('click', function()
                        {
                            Utils.showExpressionDeletionWarning(
                                comparisonReferenceContainer,
                                i18next.t('evaluations:delete_from_profile_score')
                            ).then(function(confirmed)
                            {
                                if (confirmed)
                                {
                                    comparisonReferenceContainer.remove();
                                }
                            });
                        });
                        comparisonReferenceContainer.append(deleteButton);
                    }

                    comparisonReferencesContainer.append(comparisonReferenceContainer);
                };
                addButton.on('click', appendComparisonReferenceContainer);
                container.append(comparisonReferencesContainer);
                container.append(addButton);
                appendComparisonReferenceContainer();
            },
            getFromDOM: function(container, type)
            {
                return {
                    reference: kinds.reference.getFromDOM(container.children('.profile-reference'), type),
                    comparisonReferences: container.children('ul').children('li').map(function()
                    {
                        return {
                            reference: kinds.reference.getFromDOM($(this).children('.profile-comparison-reference'), type)
                        };
                    }).get()
                };
            },
            setInDOM: function(container, type, profileScore)
            {
                kinds.reference.setInDOM(container.children('.profile-reference'), type, profileScore.reference);
                const comparisonReferencesContainer = container.children('ul').empty();
                profileScore.comparisonReferences.forEach(function(comparisonReference)
                {
                    const addButton = container.children('.add-profile-comparison-reference');
                    addButton.trigger('click');
                    const comparisonReferenceContainer = comparisonReferencesContainer.children('li').last();
                    kinds.reference.setInDOM(comparisonReferenceContainer.children('.profile-comparison-reference'), type, comparisonReference.reference);
                });
            },
            adopt: function(expression)
            {
                if (!(expression.kind.name === kinds.divide.name &&
                    expression.divide.dividend.kind.name === kinds.scale.name &&
                    expression.divide.dividend.scale.expression.kind.name === kinds.reference.name &&
                    expression.divide.dividend.scale.operator === 'scalar' &&
                    expression.divide.dividend.scale.value === 100 &&
                    expression.divide.divisor.kind.name === kinds.sum.name &&
                    expression.divide.divisor.sum.every(item => item.kind.name === kinds.reference.name) &&
                    expression.divide.divisor.sum.some(item =>
                        item.reference.parameterIdRef === expression.divide.dividend.scale.expression.reference.parameterIdRef &&
                        item.reference.characterIdRef === expression.divide.dividend.scale.expression.reference.characterIdRef
                    )))
                {
                    return null;
                }

                return {
                    kind: this,
                    profileScore: {
                        reference: expression.divide.dividend.scale.expression.reference,
                        comparisonReferences: expression.divide.divisor.sum.slice(1)
                    }
                };
            },
            fromXML: function()
            {
                return null;
            },
            toXML: function(expressionXML, type, profileScore)
            {
                const profileScoreReferenceExpression = {
                    kind: kinds.reference,
                    reference: profileScore.reference
                };
                const divideExpression =
                {
                    kind: kinds.divide,
                    divide: {
                        dividend: {
                            kind: kinds.scale,
                            scale:
                            {
                                expression: profileScoreReferenceExpression,
                                operator: 'scalar',
                                value: 100
                            }
                        },
                        divisor:
                        {
                            kind: kinds.sum,
                            sum: [
                                profileScoreReferenceExpression,
                                ...profileScore.comparisonReferences.map(comparisonReference =>
                                    ({
                                        kind: kinds.reference,
                                        reference: comparisonReference.reference
                                    }))
                            ]
                        }
                    }
                };
                Expression.toXML(expressionXML, type, divideExpression);
            },
            isAvailableFor: function(type)
            {
                return kinds.divide.isAvailableFor(type) && kinds.sum.isAvailableFor(type) && kinds.reference.isAvailableFor(type);
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
                if (expression.kind.name === kinds.profileScore.name)
                {
                    kinds.reference.handleParameterTypeChange(oldParameter, newParameter, type, expression.profileScore);
                    expression.profileScore.comparisonReferences.forEach(function(comparisonReference)
                    {
                        kinds.reference.handleParameterTypeChange(oldParameter, newParameter, type, comparisonReference);
                    });
                }
            },
            handleParameterRemoval: function(parameterId, type, expression)
            {
                if (expression.profileScore.reference.parameterIdRef === parameterId)
                {
                    replaceExpressionWithDefaultLiteral(expression, type);
                    return;
                }

                expression.profileScore.comparisonReferences = expression.profileScore.comparisonReferences.filter(function(comparisonReference)
                {
                    return comparisonReference.reference.parameterIdRef !== parameterId;
                });
                if (expression.profileScore.comparisonReferences.length === 0)
                {
                    replaceExpressionWithDefaultLiteral(expression, type);
                }
            }
        }
    };

    // eslint-disable-next-line no-global-assign
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
        container.addClass('expressionWrapper').addClass(type.name);
        const expressionSelect = $('<select>', { class: "expression-kind" });
        for (const kindName in kinds)
        {
            if (kinds[kindName].isAvailableFor(type))
            {
                expressionSelect.append($('<option>', { value: kindName, text: i18next.t('common:kinds.' + kindName) }));
            }
        }
        expressionSelect.on('change', function()
        {
            const existingExpressionContainer = container.children('.expression');
            const expressionContainer = existingExpressionContainer.length ?
                existingExpressionContainer.empty() :
                $('<span>', { class: "expression" }).appendTo(container);
            kinds[$(this).val()].appendControlTo(expressionContainer, type);
            const classes = Object.keys(kinds);
            expressionContainer.parent().removeClass(classes).addClass($(this).val());
        });
        container.append(expressionSelect);
        expressionSelect.trigger('change');
    }

    function setInDOM(container, type, expression)
    {
        container.children('.expression-kind').val(expression.kind.name).trigger('change');
        const expressionContainer = container.children('.expression');
        expression.kind.setInDOM(expressionContainer, type, expression[expression.kind.name]);
    }

    function getFromDOM(container, type)
    {
        const expression = {};
        expression.kind = kinds[container.children('.expression-kind').val()];
        const expressionContainer = container.children('.expression');
        expression[expression.kind.name] = expression.kind.getFromDOM(expressionContainer, type);
        return expression;
    }

    function fromXML(expressionXML, type)
    {
        let kind;
        if (!(expressionXML.nodeName in kinds))
        {
            kind = kinds.reference;
        }
        else
        {
            kind = kinds[expressionXML.nodeName];
        }
        let expression = { kind: kind };
        expression[kind.name] = kind.fromXML(expressionXML, type);

        for (const kindName in kinds)
        {
            if (!kinds[kindName].adopt) continue;
            const newExpression = kinds[kindName].adopt(expression);
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
            const expression = getFromDOM(container, previousType);
            expression.kind.handleTypeChange(previousType, newType, expression);
            container.removeClass(previousType.name);
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

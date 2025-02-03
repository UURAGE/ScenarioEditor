import globals from "globals";
import js from "@eslint/js";
import stylistic from "@stylistic/eslint-plugin";

export default [
    {
        ignores: ["lib/"]
    },
    js.configs.recommended,
    stylistic.configs.customize({
        indent: 4,
        quotes: "double",
        semi: true,
        jsx: false,
        braceStyle: "allman"
    }),
    {
        languageOptions: {
            ecmaVersion: 2021,
            sourceType: "script",
            globals: {
                ...globals.browser,
                ...globals.jquery,
                Selectable: "readonly",
                Sortable: "readonly",
                i18next: "readonly",
                jsPlumb: "readonly",
                makeDialogDraggable: "readonly",
                saveAs: "readonly",
                tippy: "readonly",
                Utils: "readonly",
                Types: "readonly",
                Config: "readonly",
                DragBox: "readonly",
                MiniMap: "readonly",
                Main: "readonly",
                Parameters: "readonly",
                Enumeration: "readonly",
                Parts: "readonly",
                PlumbGenerator: "readonly",
                Load: "readonly",
                Load1: "readonly",
                Load3: "readonly",
                Save: "readonly",
                Metadata: "readonly",
                Condition: "readonly",
                Expression: "readonly",
                Evaluations: "readonly",
                TabDock: "readonly",
                Validator: "readonly",
                KeyControl: "readonly",
                Print: "readonly",
                Zoom: "readonly",
                Clipboard: "readonly",
                ColorPicker: "readonly",
                SaveIndicator: "readonly",
                ElementList: "readonly",
                SnapToGrid: "readonly",
                Resize: "readonly",
                site_url: "readonly",
                editor_url: "readonly",
                languageCode: "readonly"
            }
        },
        rules: {
            "@stylistic/arrow-parens": [
                "off"
            ],
            "@stylistic/comma-dangle": [
                "error",
                "only-multiline"
            ],
            "@stylistic/func-call-spacing": [
                "error"
            ],
            "@stylistic/indent": [
                "error",
                4,
                {
                    CallExpression: {
                        arguments: "off",
                    },
                    SwitchCase: 1
                }
            ],
            "@stylistic/max-statements-per-line": [
                "off"
            ],
            "@stylistic/multiline-ternary": [
                "off"
            ],
            "@stylistic/no-extra-parens": [
                "error",
                "all",
                {
                    nestedBinaryExpressions: false
                }
            ],
            "@stylistic/no-floating-decimal": [
                "off"
            ],
            "@stylistic/no-mixed-operators": [
                "error",
                {
                    groups: [
                        ["&", "|", "^", "~", "<<", ">>", ">>>"],
                        ["==", "!=", "===", "!==", ">", ">=", "<", "<="],
                        ["&&", "||"],
                        ["in", "instanceof"]
                    ]
                }
            ],
            "@stylistic/operator-linebreak": [
                "error",
                "after"
            ],
            "@stylistic/padding-line-between-statements": [
                "error",
                {
                    blankLine: "always",
                    prev: "directive",
                    next: "*"
                },
                {
                    blankLine: "any",
                    prev: "directive",
                    next: "directive"
                }
            ],
            "@stylistic/quote-props": [
                "off"
            ],
            "@stylistic/quotes": [
                "off"
            ],
            "@stylistic/semi-style": [
                "error"
            ],
            "@stylistic/space-before-function-paren": [
                "error", {
                    named: "never",
                    anonymous: "never"
                }
            ],
            "@stylistic/spaced-comment": [
                "error",
                "always",
                {
                    block: {
                        balanced: true
                    }
                }
            ],
            "@stylistic/wrap-iife": [
                "error",
                "inside"
            ],
            "block-scoped-var": [
                "error"
            ],
            "camelcase": [
                "error", {
                    properties: "always",
                    allow: [
                        "site_url",
                        "editor_url"
                    ]
                }
            ],
            "capitalized-comments": [
                "error",
                "always",
                {
                    ignoreConsecutiveComments: true
                }
            ],
            "curly": [
                "error",
                "multi-line"
            ],
            "dot-notation": [
                "error"
            ],
            "no-bitwise": [
                "error"
            ],
            "no-empty-function": [
                "error",
                {
                    allow: ["functions"]
                }
            ],
            "no-eval": [
                "error"
            ],
            "no-implied-eval": [
                "error"
            ],
            "no-new-func": [
                "error"
            ],
            "no-proto": [
                "error"
            ],
            "no-redeclare": [
                "error",
                {
                    builtinGlobals: false
                }
            ],
            "no-restricted-globals": [
                "error",
                {
                    name: "jQuery",
                    message: "Use '$' instead."
                }
            ],
            "no-restricted-syntax": [
                "error",
                {
                    selector: "MemberExpression[property.type='Identifier'][property.name='ready'][object.type='CallExpression'][object.callee.type='Identifier'][object.callee.name='$']",
                    message: "'$(...).ready(f)' is deprecated. Use '$(f)' instead."
                },
                {
                    selector: "MemberExpression[object.type='Identifier'][object.name='$'][property.type='Identifier'][property.name='Deferred']",
                    message: "Use Promise instead of $.Deferred."
                }
            ],
            "no-return-assign": [
                "error"
            ],
            "no-unneeded-ternary": [
                "error"
            ],
            "no-use-before-define": [
                "error",
                {
                    functions: false,
                    classes: false,
                    variables: true
                }
            ],
            "no-var": [
                "error"
            ],
            "prefer-const": [
                "error"
            ],
            "strict": [
                "error"
            ]
        }
    },
    {
        files: ["**/*.mjs"],
        languageOptions: {
            sourceType: "module"
        }
    }
];

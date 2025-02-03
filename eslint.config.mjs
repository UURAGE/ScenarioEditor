import js from "@eslint/js";
import stylistic from "@stylistic/eslint-plugin";
import ts from "typescript-eslint";

export default ts.config({
    files: ["**/*.mts"],
    languageOptions: {
        ecmaVersion: 2021
    },
    extends: [
        js.configs.recommended,
        stylistic.configs.customize({
            indent: 4,
            quotes: "double",
            semi: true,
            jsx: false,
            braceStyle: "allman"
        }),
        ts.configs.strict,
        ts.configs.stylistic
    ],
    rules: {
        "@stylistic/arrow-parens": "off",
        "@stylistic/comma-dangle": [
            "error",
            "only-multiline"
        ],
        "@stylistic/function-call-spacing": "error",
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
        "@stylistic/max-statements-per-line": "off",
        "@stylistic/multiline-ternary": "off",
        "@stylistic/no-extra-parens": [
            "error",
            "all",
            {
                nestedBinaryExpressions: false
            }
        ],
        "@stylistic/no-floating-decimal": "off",
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
        "@stylistic/object-curly-newline": "error",
        "@stylistic/object-property-newline": [
            "error",
            {
                "allowAllPropertiesOnSameLine": true
            }
        ],
        "@stylistic/operator-linebreak": [
            "error",
            "after"
        ],
        "@stylistic/padding-line-between-statements": [
            "error",
            {
                "blankLine": "always",
                "prev": "directive",
                "next": "*"
            },
            {
                "blankLine": "any",
                "prev": "directive",
                "next": "directive"
            }
        ],
        "@stylistic/quote-props": "off",
        "@stylistic/quotes": "off",
        "@stylistic/semi-style": "error",
        "@stylistic/space-before-function-paren": [
            "error",
            {
                "named": "never",
                "anonymous": "never"
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
        "@typescript-eslint/naming-convention": "error",
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-non-null-assertion": "off",
        "arrow-body-style": "error",
        "capitalized-comments": [
            "error",
            "always",
            {
                "ignoreConsecutiveComments": true
            }
        ],
        "curly": [
            "error",
            "multi-line"
        ],
        "dot-notation": "error",
        "eqeqeq": [
            "error",
            "smart"
        ],
        "guard-for-in": "error",
        "id-blacklist": [
            "error",
            "any",
            "Number",
            "number",
            "String",
            "string",
            "Boolean",
            "boolean",
            "Undefined"
        ],
        "new-parens": "error",
        "no-bitwise": "error",
        "no-caller": "error",
        "no-eval": "error",
        "no-new-wrappers": "error",
        "no-shadow": [
            "error",
            {
                hoist: "all"
            }
        ],
        "no-throw-literal": "error",
        "no-undef-init": "error",
        "no-underscore-dangle": "error",
        "no-unneeded-ternary": "error",
        "no-use-before-define": [
            "error",
            {
                "functions": false,
                "classes": false,
                "variables": true
            }
        ],
        "no-useless-computed-key": "error",
        "object-shorthand": "error",
        "one-var": [
            "error",
            "never"
        ],
        "radix": "error"
    }
});

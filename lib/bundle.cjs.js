var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __markAsModule = (target) => __defProp(target, "__esModule", { value: true });
var __export = (target, all) => {
  __markAsModule(target);
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __reExport = (target, module2, desc) => {
  if (module2 && typeof module2 === "object" || typeof module2 === "function") {
    for (let key of __getOwnPropNames(module2))
      if (!__hasOwnProp.call(target, key) && key !== "default")
        __defProp(target, key, { get: () => module2[key], enumerable: !(desc = __getOwnPropDesc(module2, key)) || desc.enumerable });
  }
  return target;
};
var __toModule = (module2) => {
  return __reExport(__markAsModule(__defProp(module2 != null ? __create(__getProtoOf(module2)) : {}, "default", module2 && module2.__esModule && "default" in module2 ? { get: () => module2.default, enumerable: true } : { value: module2, enumerable: true })), module2);
};

// src/index.ts
__export(exports, {
  check: () => check,
  default: () => src_default,
  filter: () => filter,
  propType: () => propType
});

// src/utilities.ts
var import_apollo_utilities2 = __toModule(require("apollo-utilities"));

// src/graphql.ts
var import_apollo_utilities = __toModule(require("apollo-utilities"));
function graphql(resolver, document, rootValue, contextValue, variableValues = {}, execOptions = {}) {
  const mainDefinition = (0, import_apollo_utilities.getMainDefinition)(document);
  const fragments = (0, import_apollo_utilities.getFragmentDefinitions)(document);
  const fragmentMap = (0, import_apollo_utilities.createFragmentMap)(fragments);
  const resultMapper = execOptions.resultMapper;
  const fragmentMatcher = execOptions.fragmentMatcher || (() => true);
  const execContext = {
    fragmentMap,
    contextValue,
    variableValues,
    resultMapper,
    resolver,
    fragmentMatcher
  };
  return executeSelectionSet(mainDefinition.selectionSet, rootValue, execContext);
}
function executeSelectionSet(selectionSet, rootValue, execContext) {
  const { fragmentMap, contextValue, variableValues: variables } = execContext;
  const result = {};
  selectionSet.selections.forEach((selection) => {
    if (variables && !(0, import_apollo_utilities.shouldInclude)(selection, variables)) {
      return;
    }
    if ((0, import_apollo_utilities.isField)(selection)) {
      const fieldResult = executeField(selection, rootValue, execContext);
      const resultFieldKey = (0, import_apollo_utilities.resultKeyNameFromField)(selection);
      if (fieldResult !== void 0) {
        if (result[resultFieldKey] === void 0) {
          result[resultFieldKey] = fieldResult;
        } else {
          merge(result[resultFieldKey], fieldResult);
        }
      }
    } else {
      let fragment;
      if ((0, import_apollo_utilities.isInlineFragment)(selection)) {
        fragment = selection;
      } else {
        fragment = fragmentMap[selection.name.value];
        if (!fragment) {
          throw new Error(`No fragment named ${selection.name.value}`);
        }
      }
      const typeCondition = fragment.typeCondition.name.value;
      if (execContext.fragmentMatcher(rootValue, typeCondition, contextValue)) {
        const fragmentResult = executeSelectionSet(fragment.selectionSet, rootValue, execContext);
        merge(result, fragmentResult);
      }
    }
  });
  if (execContext.resultMapper) {
    return execContext.resultMapper(result, rootValue);
  }
  return result;
}
function executeField(field, rootValue, execContext) {
  const { variableValues: variables, contextValue, resolver } = execContext;
  const fieldName = field.alias?.value || field.name.value;
  const args = (0, import_apollo_utilities.argumentsObjectFromField)(field, variables);
  const info = {
    isLeaf: !field.selectionSet,
    resultKey: (0, import_apollo_utilities.resultKeyNameFromField)(field),
    directives: (0, import_apollo_utilities.getDirectiveInfoFromField)(field, variables),
    field
  };
  const result = resolver(fieldName, rootValue, args, contextValue, info);
  if (!field.selectionSet) {
    return result;
  }
  if (result == null) {
    return result;
  }
  if (Array.isArray(result)) {
    return executeSubSelectedArray(field, result, execContext);
  }
  return executeSelectionSet(field.selectionSet, result, execContext);
}
function executeSubSelectedArray(field, result, execContext) {
  return result.map((item) => {
    if (item === null) {
      return null;
    }
    if (Array.isArray(item)) {
      return executeSubSelectedArray(field, item, execContext);
    }
    return executeSelectionSet(field.selectionSet, item, execContext);
  });
}
var hasOwn = Object.prototype.hasOwnProperty;
function merge(dest, src) {
  if (src !== null && typeof src === "object") {
    Object.keys(src).forEach((key) => {
      const srcVal = src[key];
      if (!hasOwn.call(dest, key)) {
        dest[key] = srcVal;
      } else {
        merge(dest[key], srcVal);
      }
    });
  }
}

// src/utilities.ts
var import_ts_invariant = __toModule(require("ts-invariant"));
var { hasOwnProperty } = Object.prototype;
function filter(doc, data, variableValues = {}) {
  if (data === null)
    return data;
  const resolver = (fieldName, root, args, context, info) => {
    return root[info.resultKey];
  };
  return Array.isArray(data) ? data.map((dataObj) => graphql(resolver, doc, dataObj, null, variableValues)) : graphql(resolver, doc, data, null, variableValues);
}
function check(doc, data, variables = {}) {
  const resolver = (fieldName, root, args, context, info) => {
    (0, import_ts_invariant.invariant)(hasOwnProperty.call(root, info.resultKey) || !variables && hasVariableInclusions(info.field.directives), `${info.resultKey} missing on ${JSON.stringify(root)}`);
    return root[info.resultKey];
  };
  graphql(resolver, doc, data, {}, variables, {
    fragmentMatcher: () => false
  });
}
function hasVariableInclusions(directives) {
  return (0, import_apollo_utilities2.getInclusionDirectives)(directives).some(({ ifArgument }) => ifArgument.value && ifArgument.value.kind === "Variable");
}
var ANONYMOUS = "<<anonymous>>";
function PropTypeError(message) {
  this.message = message;
  this.stack = "";
}
PropTypeError.prototype = Error.prototype;
var reactPropTypeLocationNames = {
  prop: "prop",
  context: "context",
  childContext: "child context"
};
function createChainableTypeChecker(validate) {
  function checkType(isRequired, props, propName, componentName, location, propFullName) {
    componentName = componentName || ANONYMOUS;
    propFullName = propFullName || propName;
    if (props[propName] == null) {
      const locationName = reactPropTypeLocationNames[location];
      if (isRequired) {
        if (props[propName] === null) {
          return new PropTypeError(`The ${locationName} \`${propFullName}\` is marked as required in \`${componentName}\`, but its value is \`null\`.`);
        }
        return new PropTypeError(`The ${locationName} \`${propFullName}\` is marked as required in \`${componentName}\`, but its value is \`undefined\`.`);
      }
      return null;
    } else {
      return validate(props, propName, componentName, location, propFullName);
    }
  }
  const chainedCheckType = checkType.bind(null, false);
  chainedCheckType.isRequired = checkType.bind(null, true);
  return chainedCheckType;
}
function propType(doc, mapPropsToVariables = (props) => null) {
  return createChainableTypeChecker((props, propName) => {
    const prop = props[propName];
    try {
      if (!prop.loading) {
        check(doc, prop, mapPropsToVariables(props));
      }
      return null;
    } catch (e) {
      return e;
    }
  });
}

// src/index.ts
var src_default = graphql;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  check,
  filter,
  propType
});

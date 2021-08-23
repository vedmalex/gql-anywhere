// src/utilities.ts
import { getInclusionDirectives } from "apollo-utilities";

// src/graphql.ts
import {
  getMainDefinition,
  getFragmentDefinitions,
  createFragmentMap,
  shouldInclude,
  getDirectiveInfoFromField,
  isField,
  isInlineFragment,
  resultKeyNameFromField,
  argumentsObjectFromField
} from "apollo-utilities";
function graphql(resolver, document, rootValue, contextValue, variableValues = {}, execOptions = {}) {
  const mainDefinition = getMainDefinition(document);
  const fragments = getFragmentDefinitions(document);
  const fragmentMap = createFragmentMap(fragments);
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
    if (variables && !shouldInclude(selection, variables)) {
      return;
    }
    if (isField(selection)) {
      const fieldResult = executeField(selection, rootValue, execContext);
      const resultFieldKey = resultKeyNameFromField(selection);
      if (fieldResult !== void 0) {
        if (result[resultFieldKey] === void 0) {
          result[resultFieldKey] = fieldResult;
        } else {
          merge(result[resultFieldKey], fieldResult);
        }
      }
    } else {
      let fragment;
      if (isInlineFragment(selection)) {
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
  const args = argumentsObjectFromField(field, variables);
  const info = {
    isLeaf: !field.selectionSet,
    resultKey: resultKeyNameFromField(field),
    directives: getDirectiveInfoFromField(field, variables),
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
import { invariant } from "ts-invariant";
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
    invariant(hasOwnProperty.call(root, info.resultKey) || !variables && hasVariableInclusions(info.field.directives), `${info.resultKey} missing on ${JSON.stringify(root)}`);
    return root[info.resultKey];
  };
  graphql(resolver, doc, data, {}, variables, {
    fragmentMatcher: () => false
  });
}
function hasVariableInclusions(directives) {
  return getInclusionDirectives(directives).some(({ ifArgument }) => ifArgument.value && ifArgument.value.kind === "Variable");
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
export {
  check,
  src_default as default,
  filter,
  propType
};

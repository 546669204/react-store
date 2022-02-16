import React, { DispatchWithoutAction } from "react"
import ReactDom from "react-dom"

// @ts-ignore
const ReactSharedInternals = React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;

const { ReactCurrentOwner } = ReactSharedInternals

function isObject(val: any) {
  return val != null && typeof val === 'object';
};

function getFiberHookCount(fiber: any) {
  let hook = fiber.memoizedState;
  let count = 0;
  while (hook) {
    count++;
    hook = hook.next;
  }
  return count;
}
function getCurrentOwnerHookCount() {
  return getFiberHookCount(ReactCurrentOwner.current);
}

const depSymbol = Symbol.for("dep");
const storeSymbol = Symbol.for("store");

class Dep {
  key: string = ""
  renders: Set<Function> = new Set();
}
type targetObject = object & { [depSymbol]?: Dep[] }

const functionHookCountMap = new WeakMap();
const functionUpdateMap = new WeakMap<Function, Set<DispatchWithoutAction>>();

function track(target: targetObject, key: PropertyKey, update: DispatchWithoutAction | null, render: Function) {
  if (update) {
    let updateByRender = functionUpdateMap.get(render);
    if (updateByRender) {
      updateByRender.add(update);
      functionUpdateMap.set(render, updateByRender);
    } else {
      functionUpdateMap.set(render, new Set([update]));
    }
  }

  target[depSymbol] = target[depSymbol] || [] as Dep[];
  const findKey = target[depSymbol]?.find(d => d.key == String(key));
  if (findKey) {
    findKey.renders.add(render);
  } else {
    const dep = new Dep();
    dep.key = String(key);
    dep.renders.add(render);
    target[depSymbol]?.push(dep);
  }
}

function trigger(target: targetObject, key: PropertyKey) {
  ReactDom.unstable_batchedUpdates(() => {
    (target[depSymbol] || []).forEach((dep: Dep) => {
      if (dep.key == key) {
        dep.renders.forEach(render => {
          const updateByRender = functionUpdateMap.get(render);
          updateByRender?.forEach(update => update());
        })
      }
    })
  })
}

export function useForceUpdate() {
  const [_, update] = React.useReducer(() => ({}), 0);
  return update;
}

export function createStore<T extends object>(target: T): T {
  const handler = {
    get(target: object, key: PropertyKey, receiver?: any): any {
      if (key == storeSymbol) {
        return true;
      }
      if (ReactCurrentOwner.current) {
        let update = null;
        const type = ReactCurrentOwner.current.type;
        if (functionHookCountMap.has(type)) {
          if (functionHookCountMap.get(type) == getCurrentOwnerHookCount()) {
            update = useForceUpdate();
          }
        } else {
          functionHookCountMap.set(type, getCurrentOwnerHookCount());
          update = useForceUpdate();
        }
        track(target, key, update, type);
      }
      const value = Reflect.get(target, key, receiver);
      if (isObject(value)) {
        if (value[storeSymbol]) {
          return value;
        }
        return new Proxy(value, handler);
      }
      return value;
    },
    set(target: object, key: PropertyKey, value: any) {
      const ret = Reflect.set(target, key, value);
      trigger(target, key);
      return ret;
    }
  }
  return new Proxy(target, handler) as T;
}

export function useStore<T extends object>(initValue: T) {
  const [store] = React.useState(() => createStore(initValue));
  return store;
}
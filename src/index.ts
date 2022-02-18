import React from "react"
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
  updates: Set<Function | object> = new Set();
}
type targetObject = object & { [depSymbol]?: Dep[] }

const functionHookCountMap = new WeakMap<Function, number>();
const functionUpdateMap = new WeakMap<object, Set<Function>>();
const updateToDep = new WeakMap<object, Dep>();

function track(target: targetObject, key: PropertyKey) {
  const fiber = ReactCurrentOwner.current;
  if (fiber) {
    let update = null;
    const type = fiber.type;
    if (!functionHookCountMap.has(type) || functionHookCountMap.get(type) == getCurrentOwnerHookCount()) {
      functionHookCountMap.set(type, getCurrentOwnerHookCount());
      update = useForceUpdate();
    }
    if (update) {
      let updateByFiber = functionUpdateMap.get(fiber) || new Set();
      updateByFiber.add(update);
      functionUpdateMap.set(fiber, updateByFiber);
    }
  }

  if (currentObserver || fiber) {
    target[depSymbol] = target[depSymbol] || [] as Dep[];
    let dep = target[depSymbol]?.find(d => d.key == String(key));
    if (!dep) {
      dep = new Dep();
      dep.key = String(key);
      target[depSymbol]?.push(dep);
    }
    dep.updates.add(currentObserver || fiber);
    updateToDep.set(currentObserver || fiber, dep)
  }
}

function trigger(target: targetObject, key: PropertyKey) {
  ReactDom.unstable_batchedUpdates(() => {
    (target[depSymbol] || []).forEach((dep: Dep) => {
      dep.key == key && dep.updates.forEach(updateOrFiber => {
        if (typeof updateOrFiber == "function") {
          updateOrFiber();
        } else {
          const updateByRender = functionUpdateMap.get(updateOrFiber);
          updateByRender?.forEach(update => update());
        }
      })
    })
  })
}

function destroy(watchOrFiber: object) {
  const dep = updateToDep.get(watchOrFiber);
  dep && dep.updates.delete(watchOrFiber);
}

export function useForceUpdate() {
  const [_, update] = React.useReducer(() => ({}), 0);
  React.useEffect(() => () => { destroy(ReactCurrentOwner.current) }, []);
  return update;
}

export function createStore<T extends object>(target: T): T {
  const handler = {
    get(target: object, key: PropertyKey, receiver?: any): any {
      if (key == storeSymbol) return true;
      track(target, key);
      const value = Reflect.get(target, key, receiver);
      if (isObject(value) && !value[storeSymbol]) {
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

type destroyWatchFunction = () => void;
let currentObserver: Function | null = null;
export function createWatch(fn: Function): destroyWatchFunction {
  currentObserver = fn;
  fn();
  currentObserver = null;
  return () => {
    destroy(fn)
  }
}

export function useWatch(fn: Function) {
  React.useEffect(() => createWatch(fn), [fn])
}
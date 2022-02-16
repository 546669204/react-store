
export class Stack extends Array {
  peek() {
    return this.length ? this[this.length - 1] : undefined
  }
}

export class StackMap<T> extends Stack {
  private __map: Map<T, number>;
  constructor(props?: any) {
    super(props)
    this.__map = new Map();
  }
  push(item: T): number {
    const ret = super.push(item);
    this.__map.set(item, ret)
    return ret
  }
  has(item: T) {
    return this.__map.has(item);
  }
  getIndex(item: T) {
    return this.__map.has(item) && this.__map.get(item);
  }
  setLength(val: number) {
    for (let [key, value] of this.__map.entries()) {
      if (value >= val) {
        this.__map.delete(key)
      }
    }
    super.length = val;
  }
}
import React, { useState } from "react"
import { createStore } from "../src/index"

function useFourceUpdate() {
  const [_, update] = React.useReducer((state) => {
    return { ...state }
  }, 0)
  return update;
}
function Child2(props) {
  const update = useFourceUpdate();
  globalUpdateQueue.add(update)
  console.log("子组件被更新", props.data.count, props)
  return <span>count:{props.data.count} <button onClick={() => props.data.count++}>++</button></span>
}

const globalUpdateQueue = new Set();
const data2 = {
  __count: 0,
  set count(value) {
    this.__count = value;
    globalUpdateQueue.forEach((it:any) => it())
  },
  get count() {
    return this.__count
  }
}
export default function App() {
  console.log("父组件被更新", data2)
  return (
    <div>
      <Child2 data={data2} />
    </div>
  )
}
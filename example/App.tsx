import React from "react"
import { createStore, useStore } from "../src/index"

function TodoInput({ data }) {
  console.log("TodoInput被更新", data)
  return (
    <div>
      <input type="text" value={data.inputData} onChange={(e) => data.inputData = e.target.value} />
      <button onClick={() => { data.todoList.push(data.inputData); data.inputData = "" }}>add</button>
    </div>
  )
}
function TodoList({ data }) {
  console.log("TodoList被更新", data)
  data.todoList.length;
  return (
    <div>
      <ul>
        {data.todoList.map((todo, index) => (
          <li key={todo}>{todo} <a href="javascript:void" onClick={() => data.todoList.splice(index, 1)}>X</a> </li>
        ))}
      </ul>
    </div>
  )
}

// const data = createStore({
//   count: 0,
//   render: 0
// })
export default function App() {
  const data = useStore({
    count: 0,
    render: 0,
    todoList: ["1", "2", "3"]
  })
  console.log("父组件被更新", data)
  return (
    <div>
      <TodoInput data={data}></TodoInput>
      <TodoList data={data} />
    </div>
  )
}
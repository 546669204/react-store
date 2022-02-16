# React-Store

React State Manager

## Feature

1. reactive
2. no extra re-render
3. 100 line

## Usage

```js
import { createStore, useStore } from 'react-store';

const data = useStore({ count: 0 });

function App() {
  return (
    <span>
      count:{data.count} 
      <button onClick={() => data.count++}>++</button>
    </span>
  );
}
```

[more example](./example)


## License

[MIT](LICENSE) © xiaoming


# @flowlist/react-flowlist

## Install

``` sh
yarn add @flowlist/react-flowlist
```

## Usage

``` js
const someQuery = {
  count: 10
}
const getList = (params) => new Promise((resolve, reject) => {
  try {
    console.log('params contain someQuery', params)
    const list = await fetch('/get/data/route')

    resolve({
      total: 0,
      noMore: false,
      result: list
    })
  } catch (err) {
    reject(err)
  }
})
```

``` jsx
<FlowList
  func={getList}
  query={someQuery}
  mainSlot={(({ result }) => {
    return result.map((item) => {
      return <ListItem item={item} key={item.id}></ListItem>
    })
  })}
  firstloadingSlot={() => {
    return <>launch loading slot</>
  }}
  firstErrorSlot={() => {
    return <>launch error slot</>
  }}
  nothingSlot={() => {
    return <>list empty slot</>
  }}
  loadingSlot={() => {
    return <>load more loading slot</>
  }}
></FlowList>
```

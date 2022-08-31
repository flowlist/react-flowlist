# @flowlist/react-flowlist

## Install

``` sh
yarn add @flowlist/react-flowlist
```

## Usage

``` tsx
<FlowList
  func={getPostData}
  prefetchData={{
    result: posts.result,
    noMore: posts.no_more,
    total: posts.total,
    fetched: true,
    nothing: posts.result.length === 0
  }}
  mainSlot={(({ result }: any) => {
    return result.map((item: any) => {
      if (item.utmType === 'twitter') {
        return <TwitterItem item={item} key={item.id}></TwitterItem>
      }
      return <YoutubeItem item={item} key={item.id}></YoutubeItem>
    })
  })}
  firstloadingSlot={() => {
    return <>
      <img src="/img/flow/loading.svg" style={{ marginBottom: '1px' }} alt="loading" />
      <img src="/img/flow/loading.svg" style={{ marginBottom: '1px' }} alt="loading" />
      <img src="/img/flow/loading.svg" alt="loading" />
    </>
  }}
  nothingSlot={() => {
    return <img src="/img/flow/nothing.svg" alt="nothing" />
  }}
  loadingSlot={() => {
    return <img src="/img/flow/loading.svg" alt="loading" />
  }}
  firstErrorSlot={() => {
    return <img src="/img/flow/error.svg" alt="error" />
  }}
></FlowList>
```

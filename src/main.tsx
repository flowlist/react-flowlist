import { useEffect, useState, useMemo, useRef, ReactNode } from "react";
import * as jsCore from '@flowlist/js-core'
import {
  checkInView,
  getObserver,
  addEvent,
  getScrollParentDom,
  isServer,
  requestIdleCallback
} from './utils'

export default function FlowList({
  refVal,
  func,
  type = jsCore.ENUM.FETCH_TYPE.AUTO,
  query = {},
  autoload = -1,
  preload = 200,
  uniqueKey = jsCore.ENUM.DEFAULT_UNIQUE_KEY_NAME,
  scrollX = false,
  headerSlot,
  mainSlot,
  footerSlot,
  errorSlot,
  firstErrorSlot,
  loadingSlot,
  firstloadingSlot,
  nothingSlot,
  noMoreSlot,
  slotLoadMore,
  onError,
  onSuccess,
  prefetchData,
  className
}: {
  refVal?: any
  func: String | Function
  type?: string
  query?: Record<string, any>
  autoload?: number
  preload?: number
  uniqueKey?: string
  scrollX?: boolean
  headerSlot?: Function
  mainSlot?: Function
  footerSlot?: Function
  errorSlot?: Function
  firstErrorSlot?: Function
  loadingSlot?: Function
  firstloadingSlot?: Function
  nothingSlot?: Function
  noMoreSlot?: Function
  slotLoadMore?: Function
  onError?: Function
  onSuccess?: Function
  children?: ReactNode
  prefetchData?: any
  className?: string
}) {
  const [store, setStore] = useState<{
    result: Record<string, any> | any[]
    noMore: boolean
    nothing: boolean
    loading: boolean
    error: null | Error
    extra: null | any
    fetched: boolean
    page: number
    total: number
  }>(jsCore.utils.generateDefaultField(prefetchData))
  const shimRef = useRef(null)

  const _dataReducer = (name: string, data: any) => {
    return (jsCore as any)[name]({
      getter: () => store,
      setter: ({ value, callback }: { value: Record<string, any>, callback?: any }) => {
        setStore({
          ...store,
          ...value
        })
        if (value.loading === false && shimRef && shimRef.current) {
          setTimeout(() => {
            ; (shimRef.current as any)._loading = false
          }, 200)
        }
        callback && callback()
      },
      ...data
    })
  }

  const _detectLoadMore = () => {
    if (store.loading || store.nothing || store.noMore || store.error) {
      return
    }
    setStore({
      ...store,
      loading: true
    })
    setTimeout(() => {
      if (isAuto && shimRef && checkInView(shimRef.current)) {
        loadMore()
      } else {
        setStore({
          ...store,
          loading: false
        })
      }
    }, 200)
  }

  const _handleAsyncError = (data: any) => {
    if (isServer()) {
      return
    }
    onError && onError(data)
  }

  const _successCallback = (data: any) => {
    if (isServer()) {
      return
    }
    onSuccess && onSuccess(data)
  }

  const _initFlowLoader = () => {
    if (
      autoload === 0 ||
      !shimRef ||
      !shimRef.current
    ) {
      return
    }

    if (observer) {
      (shimRef.current as any).__lazy_handler__ = _fetchDataFn
      observer.observe(shimRef.current)
    }

    addEvent(
      getScrollParentDom(shimRef.current, scrollX),
      'scroll',
      _scrollFn
    )
  }

  const _scrollFn = (event: any, force = false) => {
    if (!shimRef || !shimRef.current) {
      return
    }
    if (!force) {
      if ((shimRef.current as any)._throttle) {
        return
      }
      (shimRef.current as any)._throttle = true
      setTimeout(() => {
        (shimRef.current as any)._throttle = false
        _scrollFn(null, true)
      }, 500)
      return
    }
    if (!checkInView(shimRef.current)) {
      return
    }
    _fetchDataFn()
  }

  const _fetchDataFn = () => {
    if (!isAuto || store.loading || store.error || store.noMore) {
      return
    }
    if (
      store.fetched &&
      (store.noMore || store.nothing || isPagination)
    ) {
      return
    }
    requestIdleCallback && requestIdleCallback(() => {
      if (!shimRef || !shimRef.current) {
        return
      }
      if ((shimRef.current as any)._loading) {
        return
      }
      ; (shimRef.current as any)._loading = true
      store.fetched ? loadMore() : initData()
    })
  }

  const _callMethod = ({ method, id, key, value }: any) => {
    _dataReducer('updateState', {
      ...params,
      id,
      value,
      method,
      changeKey: key,
      uniqueKey
    })
  }

  const shimStyle = useMemo(() => {
    let result = {
      zIndex: -1,
      display: 'block !important',
      userSelect: 'none',
      position: 'absolute',
      pointerEvents: 'none',
      background: 'transparent',
    } as any
    if (scrollX) {
      result.height = '100%'
      result.width = `${preload}px`
      result.top = 0
      result.left = 0
      result.bottom = 0
    } else {
      result.height = `${preload}px`
      result.width = '100%'
      result.left = 0
      result.right = 0
      result.bottom = 0
    }
    return result
  }, [scrollX, preload])

  const params = useMemo(() => {
    return {
      func,
      type,
      query,
      callback: _successCallback,
      uniqueKey
    }
  }, [func, type, query, uniqueKey])

  const isPagination = useMemo(
    () => type === jsCore.ENUM.FETCH_TYPE.PAGINATION,
    [type]
  )

  const isAuto = useMemo(() => {
    if (isPagination) {
      return false
    }
    return autoload === -1 || autoload > store.page
  }, [autoload, store, isPagination])

  const observer = useMemo(() => getObserver(), [])

  const initData = (obj = {}) => {
    return new Promise(async (resolve) => {
      try {
        await _dataReducer('initData', {
          ...params,
          query: {
            ...query,
            ...obj
          }
        })
        _detectLoadMore()
        resolve(null)
      } catch (e) {
        _handleAsyncError(e)
        resolve(null)
      }
    })
  }

  const loadMore = (obj = {}) => {
    return new Promise(async (resolve) => {
      try {
        await _dataReducer('loadMore', {
          ...params,
          query: {
            ...query,
            is_up: 0,
            ...obj
          }
        })
        resolve(null)
      } catch (e) {
        _handleAsyncError(e)
        resolve(null)
      }
    })
  }

  const loadBefore = (obj = {}) => {
    return loadMore({ ...obj, is_up: 1 })
  }

  const refresh = (showLoading = true) => {
    return new Promise(async (resolve) => {
      try {
        await _dataReducer('initData', {
          ...params,
          query: {
            ...query,
            __refresh__: true,
            __reload__: !showLoading
          }
        })
        _initFlowLoader()
        resolve(null)
      } catch (e) {
        _handleAsyncError(e)
        resolve(null)
      }
    })
  }

  const retry = (showLoading = true) => {
    if (store && store.fetched) {
      return loadMore()
    } else {
      return initData({
        __refresh__: true,
        __reload__: !showLoading
      })
    }
  }

  const reset = (key: any, value: any) => {
    _callMethod({ key, value, method: jsCore.ENUM.CHANGE_TYPE.RESET_FIELD })
  }

  const push = (value: any) => {
    _callMethod({ value, method: jsCore.ENUM.CHANGE_TYPE.RESULT_ADD_AFTER })
  }

  const unshift = (value: any) => {
    _callMethod({ value, method: jsCore.ENUM.CHANGE_TYPE.RESULT_ADD_BEFORE })
  }

  const patch = (value: any) => {
    _callMethod({ value, method: jsCore.ENUM.CHANGE_TYPE.RESULT_LIST_MERGE })
  }

  const insertBefore = (id: any, value: any) => {
    _callMethod({
      id,
      value,
      method: jsCore.ENUM.CHANGE_TYPE.RESULT_INSERT_TO_BEFORE
    })
  }

  const insertAfter = (id: any, value: any) => {
    _callMethod({
      id,
      value,
      method: jsCore.ENUM.CHANGE_TYPE.RESULT_INSERT_TO_AFTER
    })
  }

  const remove = (id: any) => {
    _callMethod({ id, method: jsCore.ENUM.CHANGE_TYPE.RESULT_REMOVE_BY_ID })
  }

  const search = (id: any) => {
    if (!store) {
      return undefined
    }
    return jsCore.utils.searchValueByKey(
      store.result,
      id,
      uniqueKey
    )
  }

  const update = (id: any, key: any, value: any) => {
    _callMethod({
      id,
      key,
      value,
      method: jsCore.ENUM.CHANGE_TYPE.RESULT_UPDATE_KV
    })
  }

  const merge = (id: any, value: any) => {
    _callMethod({
      id,
      value,
      method: jsCore.ENUM.CHANGE_TYPE.RESULT_ITEM_MERGE
    })
  }

  const jump = (page: number) => {
    return _dataReducer('loadMore', {
      ...params,
      query: { ...query, page }
    })
  }

  useEffect(() => {
    if (refVal !== undefined) {
      refVal.current = {
        reset,
        push,
        unshift,
        patch,
        insertBefore,
        insertAfter,
        remove,
        search,
        update,
        merge,
        jump,
        retry,
        refresh,
        loadBefore,
        loadMore,
        initData
      }
    }
  }, [])

  useEffect(() => {
    setStore(jsCore.utils.generateDefaultField(prefetchData))
  }, [prefetchData])

  useEffect(() => {
    if (!shimRef.current) {
      return
    }

    _initFlowLoader()
  }, [shimRef])

  return <div className={className ? `list-view ${className}` : 'list-view'} style={{ position: 'relative' }}>
    {
      store.fetched && headerSlot && headerSlot(store)
    }
    {
      store.fetched && mainSlot && mainSlot(store)
    }
    {
      store.fetched && footerSlot && footerSlot(store)
    }
    <div ref={shimRef} style={shimStyle} />
    {
      store.error ? <>
        {
          store.result.length
            ? errorSlot ? errorSlot(store.error) : 'ops..'
            : firstErrorSlot ? firstErrorSlot(store.error) : 'ops..'
        }
      </> : <>
        {
          store.loading ? <>
            {
              store.result.length
                ? loadingSlot ? loadingSlot() : 'loading...'
                : firstloadingSlot ? firstloadingSlot() : 'landing...'
            }
          </> : <>
            {
              store.nothing ? <>
                {
                  nothingSlot ? nothingSlot() : 'there empty'
                }
              </> : <>
                {
                  store.noMore ? <>
                    {
                      noMoreSlot && noMoreSlot()
                    }
                  </> : <>
                    {
                      !isPagination && !isAuto && <>
                        {
                          slotLoadMore ? slotLoadMore() : <button onClick={loadMore}>click to loadmore</button>
                        }
                      </>
                    }
                  </>
                }
              </>
            }
          </>
        }
      </>
    }
  </div>
}
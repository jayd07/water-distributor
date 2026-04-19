import { createContext, useContext, useEffect, useState } from "react"
import { getCustomers, getErrorMessage, getInventory, getScopedCacheKey } from "../services/api"

const AppDataContext = createContext(null)

const initialResourceState = {
  isLoading: true,
  error: "",
  showingCachedData: false
}

const readCachedArray = (key) => {
  try {
    return JSON.parse(localStorage.getItem(getScopedCacheKey(key)) || "[]")
  } catch {
    return []
  }
}

const writeCachedArray = (key, value) => {
  localStorage.setItem(getScopedCacheKey(key), JSON.stringify(value))
}

const addActiveItem = (customer, itemType, quantity) => {
  if (itemType === "cooler") {
    return {
      ...customer,
      activeCoolers: Number(customer.activeCoolers || 0) + Number(quantity)
    }
  }

  return {
    ...customer,
    activeJars: Number(customer.activeJars || 0) + Number(quantity)
  }
}

const removeActiveItem = (customer, itemType, quantity) => {
  if (itemType === "cooler") {
    return {
      ...customer,
      activeCoolers: Number(customer.activeCoolers || 0) - Number(quantity)
    }
  }

  return {
    ...customer,
    activeJars: Number(customer.activeJars || 0) - Number(quantity)
  }
}

export function AppDataProvider({ children }) {
  const [customers, setCustomers] = useState([])
  const [inventory, setInventory] = useState([])
  const [customersState, setCustomersState] = useState(initialResourceState)
  const [inventoryState, setInventoryState] = useState(initialResourceState)
  const [financialActivityVersion, setFinancialActivityVersion] = useState(0)

  const persistCustomers = (updater) => {
    setCustomers((current) => {
      const next = typeof updater === "function" ? updater(current) : updater
      writeCachedArray("customers", next)
      return next
    })
  }

  const persistInventory = (updater) => {
    setInventory((current) => {
      const next = typeof updater === "function" ? updater(current) : updater
      writeCachedArray("inventory", next)
      return next
    })
  }

  const appendLedgerPreview = ({ customerId, transactionType, description, quantity, amount }) => {
    const cacheKey = `ledger:${customerId}`
    const currentLedger = readCachedArray(cacheKey)
    const previewEntry = {
      ledgerId: `preview-${Date.now()}`,
      customerId: Number(customerId),
      transactionType,
      description,
      quantity: Number(quantity),
      amount: Number(amount),
      createdAt: new Date().toISOString()
    }

    writeCachedArray(cacheKey, [previewEntry, ...currentLedger])
  }

  const applyBorrowLocally = ({ customerId, itemType, quantity, depositPerUnit }) => {
    persistCustomers((current) =>
      current.map((customer) =>
        String(customer.customerId) === String(customerId)
          ? {
              ...addActiveItem(customer, itemType, quantity),
              depositBalance:
                Number(customer.depositBalance || 0) +
                Number(quantity) * Number(depositPerUnit)
            }
          : customer
      )
    )

    persistInventory((current) =>
      current.map((item) =>
        item.itemType === itemType
          ? {
              ...item,
              availableStock: Number(item.availableStock || 0) - Number(quantity),
              borrowedStock: Number(item.borrowedStock || 0) + Number(quantity)
            }
          : item
      )
    )

    appendLedgerPreview({
      customerId,
      transactionType: "BORROW",
      description: `Borrowed ${quantity} ${itemType}`,
      quantity,
      amount: Number(quantity) * Number(depositPerUnit)
    })
  }

  const applyReturnLocally = ({ customerId, itemType, quantity, depositRefunded }) => {
    persistCustomers((current) =>
      current.map((customer) =>
        String(customer.customerId) === String(customerId)
          ? {
              ...removeActiveItem(customer, itemType, quantity),
              depositBalance:
                Number(customer.depositBalance || 0) - Number(depositRefunded)
            }
          : customer
      )
    )

    persistInventory((current) =>
      current.map((item) =>
        item.itemType === itemType
          ? {
              ...item,
              availableStock: Number(item.availableStock || 0) + Number(quantity),
              borrowedStock: Number(item.borrowedStock || 0) - Number(quantity)
            }
          : item
      )
    )

    appendLedgerPreview({
      customerId,
      transactionType: "RETURN",
      description: `Returned ${quantity} ${itemType}`,
      quantity,
      amount: -Number(depositRefunded)
    })
  }

  const applyRefillLocally = ({ customerId, quantity, pricePerUnit, totalAmount, items = [] }) => {
    const amount =
      Number.isFinite(Number(totalAmount)) && totalAmount !== ""
        ? Number(totalAmount)
        : Number(quantity) * Number(pricePerUnit)
    const itemSummary = items.length
      ? items
          .map((item) => `${item.quantity} ${item.itemType} @ ${item.pricePerUnit}`)
          .join(", ")
      : `${quantity} units`

    persistCustomers((current) =>
      current.map((customer) =>
        String(customer.customerId) === String(customerId)
          ? {
              ...customer,
              depositBalance: Number(customer.depositBalance || 0) - amount
            }
          : customer
      )
    )

    appendLedgerPreview({
      customerId,
      transactionType: "REFILL",
      description: `Refilled ${itemSummary}, adjusted against deposit`,
      quantity,
      amount
    })
  }

  const notifyFinancialActivity = () => {
    setFinancialActivityVersion((current) => current + 1)
  }

  const applySettlementLocally = ({ customerId, amount, note }) => {
    persistCustomers((current) =>
      current.map((customer) =>
        String(customer.customerId) === String(customerId)
          ? {
              ...customer,
              depositBalance: Number(customer.depositBalance || 0) + Number(amount)
            }
          : customer
      )
    )

    appendLedgerPreview({
      customerId,
      transactionType: "SETTLEMENT",
      description: note?.trim() || "Customer settled balance",
      quantity: 0,
      amount
    })
  }

  const loadCustomers = async (showLoader = true) => {
    if (showLoader) {
      setCustomersState({ isLoading: true, error: "", showingCachedData: false })
    }

    const result = await getCustomers()
    setCustomers(result.data)
    setCustomersState({
      isLoading: false,
      error:
        result.error && result.data.length === 0
          ? getErrorMessage(result.error, "Unable to load customer data.")
          : "",
      showingCachedData: result.fromCache && result.data.length > 0
    })

    return result
  }

  const loadInventory = async (showLoader = true) => {
    if (showLoader) {
      setInventoryState({ isLoading: true, error: "", showingCachedData: false })
    }

    const result = await getInventory()
    setInventory(result.data)
    setInventoryState({
      isLoading: false,
      error:
        result.error && result.data.length === 0
          ? getErrorMessage(result.error, "Unable to load inventory data.")
          : "",
      showingCachedData: result.fromCache && result.data.length > 0
    })

    return result
  }

  const refreshAll = async () => {
    await Promise.all([loadCustomers(false), loadInventory(false)])
  }

  useEffect(() => {
    loadCustomers()
    loadInventory()
  }, [])

  return (
    <AppDataContext.Provider
      value={{
        customers,
        customersState,
        inventory,
        inventoryState,
        refreshCustomers: () => loadCustomers(false),
        refreshInventory: () => loadInventory(false),
        refreshAll,
        applyBorrowLocally,
        applyReturnLocally,
        applyRefillLocally,
        applySettlementLocally,
        financialActivityVersion,
        notifyFinancialActivity
      }}
    >
      {children}
    </AppDataContext.Provider>
  )
}

export function useAppData() {
  const context = useContext(AppDataContext)

  if (!context) {
    throw new Error("useAppData must be used within an AppDataProvider")
  }

  return context
}

import { Alert, Box, Button, IconButton, MenuItem, Stack, Tab, Tabs, TextField, Typography } from "@mui/material"
import { useEffect, useState } from "react"
import CustomerSearch from "../components/CustomerSearch"
import EmptyState from "../components/EmptyState"
import SectionCard from "../components/SectionCard"
import { useAppData } from "../context/AppDataContext"
import { createBorrow, createRefill, createReturn, getErrorMessage } from "../services/api"
import { formatCurrency, formatItemType, formatNumber, getActiveItemCount } from "../utils/formatters"

const depositDefaults = {
  jar: "200",
  cooler: "500"
}

const getDefaultDeposit = (itemType) => depositDefaults[itemType] || "0"

const getCustomerItemCount = (customer, itemType) => {
  if (!customer) return 0
  return itemType === "cooler"
    ? Number(customer.activeCoolers || 0)
    : Number(customer.activeJars || 0)
}

const blankRefillItem = (itemType = "", pricePerUnit = "0") => ({
  itemType,
  quantity: "1",
  pricePerUnit
})

function Operations() {
  const {
    customers,
    inventory,
    refreshAll,
    applyBorrowLocally,
    applyReturnLocally,
    applyRefillLocally,
    notifyFinancialActivity
  } = useAppData()

  const [tab, setTab] = useState("borrow")

  const [borrowForm, setBorrowForm] = useState({
    customerId: "",
    itemType: "",
    quantity: "1",
    depositPerUnit: "0"
  })

  /**
   * refillForm now holds:
   *   customerId  – string
   *   items       – array of { itemType, quantity, pricePerUnit }
   */
  const [refillForm, setRefillForm] = useState({
    customerId: "",
    items: [blankRefillItem()]
  })

  const [returnForm, setReturnForm] = useState({
    customerId: "",
    itemType: "",
    quantity: "1",
    depositRefunded: "0"
  })

  const [isSubmitting, setIsSubmitting] = useState({
    borrow: false,
    refill: false,
    return: false
  })

  const [feedback, setFeedback] = useState({
    borrow: { type: "", text: "" },
    refill: { type: "", text: "" },
    return: { type: "", text: "" }
  })

  // ── Seed customer / inventory defaults ───────────────────────────────────
  useEffect(() => {
    if (!customers.length) return
    const first = String(customers[0].customerId)
    setBorrowForm((c) => c.customerId ? c : { ...c, customerId: first })
    setRefillForm((c) => c.customerId ? c : { ...c, customerId: first })
    setReturnForm((c) => c.customerId ? c : { ...c, customerId: first })
  }, [customers])

  useEffect(() => {
    if (!inventory.length) return
    const firstType = inventory[0].itemType

    setBorrowForm((c) =>
      c.itemType ? c : { ...c, itemType: firstType, depositPerUnit: getDefaultDeposit(firstType) }
    )
    setReturnForm((c) => c.itemType ? c : { ...c, itemType: firstType })

    setRefillForm((c) => {
      const items = c.items.map((item, i) =>
        i === 0 && !item.itemType
          ? {
              ...item,
              itemType: firstType,
              pricePerUnit: String(inventory[0].refillPricePerUnit || 0)
            }
          : item
      )
      return { ...c, items }
    })
  }, [inventory])

  // ── Shared helpers ────────────────────────────────────────────────────────
  const updateSelectedCustomer = (customerId) => {
    setBorrowForm((c) => ({ ...c, customerId }))
    setRefillForm((c) => ({ ...c, customerId }))
    setReturnForm((c) => ({ ...c, customerId }))
  }

  const setMessage = (key, type, text) =>
    setFeedback((c) => ({ ...c, [key]: { type, text } }))

  const setPending = (key, value) =>
    setIsSubmitting((c) => ({ ...c, [key]: value }))

  // ── Refill item-line helpers ──────────────────────────────────────────────
  const addRefillItem = () => {
    const defaultItem = inventory[0]
    const defaultType = defaultItem?.itemType || ""
    const defaultPrice = String(defaultItem?.refillPricePerUnit || 0)
    setRefillForm((c) => ({
      ...c,
      items: [...c.items, blankRefillItem(defaultType, defaultPrice)]
    }))
  }

  const removeRefillItem = (index) => {
    setRefillForm((c) => ({
      ...c,
      items: c.items.filter((_, i) => i !== index)
    }))
  }

  const updateRefillItem = (index, field, value) => {
    setRefillForm((c) => {
      const items = c.items.map((item, i) =>
        i === index
          ? field === "itemType"
            ? {
                ...item,
                itemType: value,
                pricePerUnit: String(
                  inventory.find((inventoryItem) => inventoryItem.itemType === value)
                    ?.refillPricePerUnit || 0
                )
              }
            : { ...item, [field]: value }
          : item
      )
      return { ...c, items }
    })
  }

  // ── Derived values ────────────────────────────────────────────────────────
  const selectedBorrowCustomer  = customers.find((c) => String(c.customerId) === borrowForm.customerId)
  const selectedBorrowItem      = inventory.find((i) => i.itemType === borrowForm.itemType)
  const selectedRefillCustomer  = customers.find((c) => String(c.customerId) === refillForm.customerId)
  const selectedReturnCustomer  = customers.find((c) => String(c.customerId) === returnForm.customerId)
  const selectedReturnItem      = inventory.find((i) => i.itemType === returnForm.itemType)

  /** Live total of all refill lines */
  const refillGrandTotal = refillForm.items.reduce((sum, item) => {
    const qty   = Number(item.quantity)
    const price = Number(item.pricePerUnit)
    return sum + (Number.isFinite(qty) && Number.isFinite(price) ? qty * price : 0)
  }, 0)

  const refillTotalQty = refillForm.items.reduce((sum, item) => {
    const qty = Number(item.quantity)
    return sum + (Number.isInteger(qty) && qty > 0 ? qty : 0)
  }, 0)

  // ── Submit handlers ───────────────────────────────────────────────────────
  const handleBorrowItemChange = (event) => {
    const nextItemType = event.target.value
    setBorrowForm((c) => ({ ...c, itemType: nextItemType, depositPerUnit: getDefaultDeposit(nextItemType) }))
  }

  const submitBorrow = async () => {
    const quantity      = Number(borrowForm.quantity)
    const depositPerUnit = Number(borrowForm.depositPerUnit)

    if (!borrowForm.customerId) { setMessage("borrow", "error", "Choose a customer first."); return }
    if (!borrowForm.itemType)   { setMessage("borrow", "error", "Choose an inventory item."); return }
    if (!Number.isInteger(quantity) || quantity <= 0) {
      setMessage("borrow", "error", "Borrow quantity must be a whole number greater than zero."); return
    }
    if (!Number.isFinite(depositPerUnit) || depositPerUnit < 0) {
      setMessage("borrow", "error", "Deposit per unit must be zero or greater."); return
    }
    if (selectedBorrowItem && quantity > Number(selectedBorrowItem.availableStock || 0)) {
      setMessage("borrow", "error", "Borrow quantity cannot exceed available stock."); return
    }

    setPending("borrow", true)
    setMessage("borrow", "", "")
    try {
      await createBorrow(borrowForm)
      applyBorrowLocally({ customerId: borrowForm.customerId, itemType: borrowForm.itemType, quantity, depositPerUnit })
      await refreshAll()
      setBorrowForm((c) => ({ ...c, quantity: "1", depositPerUnit: getDefaultDeposit(c.itemType) }))
      setMessage("borrow", "success", "Borrow recorded successfully.")
    } catch (error) {
      setMessage("borrow", "error", getErrorMessage(error, "Unable to record the borrow."))
    } finally {
      setPending("borrow", false)
    }
  }

  const submitRefill = async () => {
    if (!refillForm.customerId) {
      setMessage("refill", "error", "Choose a customer first."); return
    }
    if (!refillForm.items.length) {
      setMessage("refill", "error", "Add at least one item to refill."); return
    }

    // Validate every line
    for (let i = 0; i < refillForm.items.length; i++) {
      const item = refillForm.items[i]
      const qty   = Number(item.quantity)
      const price = Number(item.pricePerUnit)
      const label = item.itemType ? formatItemType(item.itemType) : `Row ${i + 1}`

      if (!item.itemType) {
        setMessage("refill", "error", `Choose an item type for row ${i + 1}.`); return
      }
      if (!Number.isInteger(qty) || qty <= 0) {
        setMessage("refill", "error", `Quantity for ${label} must be a whole number > 0.`); return
      }
      if (!Number.isFinite(price) || price < 0) {
        setMessage("refill", "error", `Price per unit for ${label} must be zero or greater.`); return
      }
    }

    setPending("refill", true)
    setMessage("refill", "", "")
    try {
      const payload = {
        customerId: refillForm.customerId,
        items: refillForm.items.map((item) => ({
          itemType: item.itemType,
          quantity: Number(item.quantity),
          pricePerUnit: Number(item.pricePerUnit)
        }))
      }
      await createRefill(payload)

      applyRefillLocally({
        customerId: refillForm.customerId,
        quantity: refillTotalQty,
        totalAmount: refillGrandTotal,
        items: payload.items
      })
      notifyFinancialActivity()
      await refreshAll()

      const defaultItem = inventory[0]
      const defaultType = defaultItem?.itemType || ""
      const defaultPrice = String(defaultItem?.refillPricePerUnit || 0)
      setRefillForm((c) => ({ ...c, items: [blankRefillItem(defaultType, defaultPrice)] }))
      setMessage("refill", "success", "Refill recorded successfully.")
    } catch (error) {
      setMessage("refill", "error", getErrorMessage(error, "Unable to record the refill."))
    } finally {
      setPending("refill", false)
    }
  }

  const submitReturn = async () => {
    const quantity       = Number(returnForm.quantity)
    const depositRefunded = Number(returnForm.depositRefunded)

    if (!returnForm.customerId) { setMessage("return", "error", "Choose a customer first."); return }
    if (!returnForm.itemType)   { setMessage("return", "error", "Choose which item is being returned."); return }
    if (!Number.isInteger(quantity) || quantity <= 0) {
      setMessage("return", "error", "Return quantity must be a whole number greater than zero."); return
    }
    if (!Number.isFinite(depositRefunded) || depositRefunded < 0) {
      setMessage("return", "error", "Deposit refund must be zero or greater."); return
    }
    if (selectedReturnCustomer && quantity > getCustomerItemCount(selectedReturnCustomer, returnForm.itemType)) {
      setMessage("return", "error", "Return quantity cannot exceed the customer's active count for that item."); return
    }
    if (selectedReturnItem && quantity > Number(selectedReturnItem.borrowedStock || 0)) {
      setMessage("return", "error", "Return quantity cannot exceed borrowed stock for that item."); return
    }
    if (selectedReturnCustomer && depositRefunded > Number(selectedReturnCustomer.depositBalance || 0)) {
      setMessage("return", "error", "Refund cannot exceed the customer's deposit balance."); return
    }

    setPending("return", true)
    setMessage("return", "", "")
    try {
      await createReturn(returnForm)
      applyReturnLocally({ customerId: returnForm.customerId, itemType: returnForm.itemType, quantity, depositRefunded })
      await refreshAll()
      setReturnForm((c) => ({ ...c, quantity: "1", depositRefunded: "0" }))
      setMessage("return", "success", "Return recorded successfully.")
    } catch (error) {
      setMessage("return", "error", getErrorMessage(error, "Unable to record the return."))
    } finally {
      setPending("return", false)
    }
  }

  const renderCustomerOptions = () =>
    customers.map((customer) => (
      <MenuItem key={customer.customerId} value={String(customer.customerId)}>
        {customer.name}
      </MenuItem>
    ))

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Box className="content-grid">
      <SectionCard
        eyebrow="Transaction desk"
        title="Run daily operations"
        description="Borrow, refill, and return all live here, with quick validation so the desk can work faster and safer."
      >
        {!customers.length ? (
          <EmptyState
            title="Customers are required first"
            description="Create at least one customer profile before processing operations."
          />
        ) : (
          <Stack spacing={2}>
            <CustomerSearch
              customers={customers}
              selectedCustomerId={
                borrowForm.customerId || refillForm.customerId || returnForm.customerId || ""
              }
              onSelect={updateSelectedCustomer}
              label="Find customer"
              placeholder="Search before recording borrow, refill, or return"
            />

            <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="fullWidth">
              <Tab value="borrow" label="Borrow" />
              <Tab value="refill" label="Refill" />
              <Tab value="return" label="Return" />
            </Tabs>

            {/* ── BORROW ── */}
            {tab === "borrow" &&
              (!inventory.length ? (
                <EmptyState
                  title="Inventory is required first"
                  description="Add at least one inventory item before you process borrows."
                />
              ) : (
                <Stack spacing={2}>
                  {feedback.borrow.text && (
                    <Alert severity={feedback.borrow.type || "info"}>{feedback.borrow.text}</Alert>
                  )}
                  <TextField select label="Customer" value={borrowForm.customerId} disabled>
                    {renderCustomerOptions()}
                  </TextField>
                  <TextField
                    select
                    label="Item type"
                    value={borrowForm.itemType}
                    onChange={handleBorrowItemChange}
                  >
                    {inventory.map((item) => (
                      <MenuItem key={item.itemType} value={item.itemType}>
                        {formatItemType(item.itemType)}
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    label="Quantity"
                    type="number"
                    inputProps={{ min: 1, step: 1 }}
                    value={borrowForm.quantity}
                    onChange={(e) => setBorrowForm((c) => ({ ...c, quantity: e.target.value }))}
                  />
                  <TextField
                    label="Deposit per unit"
                    type="number"
                    inputProps={{ min: 0, step: 0.01 }}
                    value={borrowForm.depositPerUnit}
                    onChange={(e) => setBorrowForm((c) => ({ ...c, depositPerUnit: e.target.value }))}
                    helperText="Defaults to Rs 200 for jar and Rs 500 for cooler, but you can override it."
                  />
                  <Button variant="contained" onClick={submitBorrow} disabled={isSubmitting.borrow}>
                    {isSubmitting.borrow ? "Saving..." : "Record borrow"}
                  </Button>
                </Stack>
              ))}

            {/* ── REFILL ── */}
            {tab === "refill" && (
              <Stack spacing={2}>
                {feedback.refill.text && (
                  <Alert severity={feedback.refill.type || "info"}>{feedback.refill.text}</Alert>
                )}

                <TextField select label="Customer" value={refillForm.customerId} disabled>
                  {renderCustomerOptions()}
                </TextField>

                {/* Item lines */}
                <div className="refill-items-header">
                  <span className="refill-col-label">Item type</span>
                  <span className="refill-col-label">Qty</span>
                  <span className="refill-col-label">Price / unit</span>
                  <span className="refill-col-label refill-col-subtotal">Subtotal</span>
                  <span />
                </div>

                {refillForm.items.map((item, index) => {
                  const qty      = Number(item.quantity)
                  const price    = Number(item.pricePerUnit)
                  const subtotal = Number.isFinite(qty) && Number.isFinite(price) ? qty * price : 0

                  return (
                    <div key={index} className="refill-item-row">
                      <TextField
                        select
                        size="small"
                        label="Item"
                        value={item.itemType}
                        onChange={(e) => updateRefillItem(index, "itemType", e.target.value)}
                        className="refill-cell-type"
                      >
                        {inventory.map((inv) => (
                          <MenuItem key={inv.itemType} value={inv.itemType}>
                            {formatItemType(inv.itemType)}
                          </MenuItem>
                        ))}
                      </TextField>

                      <TextField
                        size="small"
                        label="Qty"
                        type="number"
                        inputProps={{ min: 1, step: 1 }}
                        value={item.quantity}
                        onChange={(e) => updateRefillItem(index, "quantity", e.target.value)}
                        className="refill-cell-qty"
                      />

                      <TextField
                        size="small"
                        label="Rs / unit"
                        type="number"
                        inputProps={{ min: 0, step: 0.01 }}
                        value={item.pricePerUnit}
                        disabled
                        helperText="Set in stock"
                        className="refill-cell-price"
                      />

                      <div className="refill-cell-subtotal">
                        <span className="refill-subtotal-label">Subtotal</span>
                        <span className="refill-subtotal-value">{formatCurrency(subtotal)}</span>
                      </div>

                      <IconButton
                        size="small"
                        onClick={() => removeRefillItem(index)}
                        disabled={refillForm.items.length === 1}
                        className="refill-remove-btn"
                        aria-label="Remove item"
                        title="Remove this item line"
                      >
                        x
                      </IconButton>
                    </div>
                  )
                })}

                {/* Add line + grand total */}
                <div className="refill-footer">
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={addRefillItem}
                    className="refill-add-btn"
                  >
                    + Add item type
                  </Button>

                  <div className="refill-grand-total">
                    <span className="refill-grand-label">
                      {refillForm.items.length} item type{refillForm.items.length !== 1 ? "s" : ""}
                      {" - "}
                      {refillTotalQty} unit{refillTotalQty !== 1 ? "s" : ""}
                    </span>
                    <span className="refill-grand-value">{formatCurrency(refillGrandTotal)}</span>
                  </div>
                </div>

                <Button variant="contained" onClick={submitRefill} disabled={isSubmitting.refill}>
                  {isSubmitting.refill ? "Saving..." : "Record refill"}
                </Button>
              </Stack>
            )}

            {/* ── RETURN ── */}
            {tab === "return" &&
              (!inventory.length ? (
                <EmptyState
                  title="Inventory is required first"
                  description="Add inventory before you process returns so stock can be updated correctly."
                />
              ) : (
                <Stack spacing={2}>
                  {feedback.return.text && (
                    <Alert severity={feedback.return.type || "info"}>{feedback.return.text}</Alert>
                  )}
                  <TextField select label="Customer" value={returnForm.customerId} disabled>
                    {renderCustomerOptions()}
                  </TextField>
                  <TextField
                    select
                    label="Item type"
                    value={returnForm.itemType}
                    onChange={(e) => setReturnForm((c) => ({ ...c, itemType: e.target.value }))}
                  >
                    {inventory.map((item) => (
                      <MenuItem key={item.itemType} value={item.itemType}>
                        {formatItemType(item.itemType)}
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    label="Quantity"
                    type="number"
                    inputProps={{ min: 1, step: 1 }}
                    value={returnForm.quantity}
                    onChange={(e) => setReturnForm((c) => ({ ...c, quantity: e.target.value }))}
                  />
                  <TextField
                    label="Deposit refunded"
                    type="number"
                    inputProps={{ min: 0, step: 0.01 }}
                    value={returnForm.depositRefunded}
                    onChange={(e) => setReturnForm((c) => ({ ...c, depositRefunded: e.target.value }))}
                  />
                  <Button variant="contained" onClick={submitReturn} disabled={isSubmitting.return}>
                    {isSubmitting.return ? "Saving..." : "Record return"}
                  </Button>
                </Stack>
              ))}
          </Stack>
        )}
      </SectionCard>

      {/* ── RIGHT PANEL ── */}
      <Stack spacing={2}>
        <SectionCard
          eyebrow="Live context"
          title="What the current action touches"
          description="This side panel keeps the operator grounded in customer balances and available stock before they submit."
        >
          {tab === "borrow" && selectedBorrowCustomer && (
            <Stack spacing={1.5}>
              <Typography variant="h6">{selectedBorrowCustomer.name}</Typography>
              <Typography color="text.secondary">
                Active items: {formatNumber(getActiveItemCount(selectedBorrowCustomer))}
              </Typography>
              <Typography color="text.secondary">
                Jars: {formatNumber(selectedBorrowCustomer.activeJars)} | Coolers: {formatNumber(selectedBorrowCustomer.activeCoolers)}
              </Typography>
              <Typography color="text.secondary">
                Deposit balance: {formatCurrency(selectedBorrowCustomer.depositBalance)}
              </Typography>
              <Typography color="text.secondary">
                Stock ready in {formatItemType(borrowForm.itemType)}:{" "}
                {formatNumber(selectedBorrowItem?.availableStock || 0)}
              </Typography>
            </Stack>
          )}

          {tab === "refill" && selectedRefillCustomer && (
            <Stack spacing={1.5}>
              <Typography variant="h6">{selectedRefillCustomer.name}</Typography>
              <Typography color="text.secondary">
                Active items: {formatNumber(getActiveItemCount(selectedRefillCustomer))}
              </Typography>
              <Typography color="text.secondary">
                Deposit balance: {formatCurrency(selectedRefillCustomer.depositBalance)}
              </Typography>

              {/* Per-item breakdown in live panel */}
              {refillForm.items.length > 0 && (
                <div className="refill-live-breakdown">
                  <span className="refill-live-title">This refill</span>
                  {refillForm.items.map((item, i) => {
                    const qty      = Number(item.quantity)
                    const price    = Number(item.pricePerUnit)
                    const subtotal = Number.isFinite(qty) && Number.isFinite(price) ? qty * price : 0
                    return (
                      <div key={i} className="refill-live-row">
                        <span>{item.itemType ? formatItemType(item.itemType) : "-"}</span>
                        <span>{qty > 0 ? `x${qty}` : "-"}</span>
                        <span className="refill-live-amount">{formatCurrency(subtotal)}</span>
                      </div>
                    )
                  })}
                  <div className="refill-live-total">
                    <span>Total deduction</span>
                    <span>{formatCurrency(refillGrandTotal)}</span>
                  </div>
                  <div className="refill-live-after">
                    <span>Balance after</span>
                    <span
                      style={{
                        color: (selectedRefillCustomer.depositBalance - refillGrandTotal) < 0
                          ? "#c0392b"
                          : "inherit"
                      }}
                    >
                      {formatCurrency(selectedRefillCustomer.depositBalance - refillGrandTotal)}
                    </span>
                  </div>
                </div>
              )}

              <Typography color="text.secondary" variant="caption">
                Negative balance means this customer now owes money to Krishna RO.
              </Typography>
            </Stack>
          )}

          {tab === "return" && selectedReturnCustomer && (
            <Stack spacing={1.5}>
              <Typography variant="h6">{selectedReturnCustomer.name}</Typography>
              <Typography color="text.secondary">
                Jars: {formatNumber(selectedReturnCustomer.activeJars)} | Coolers: {formatNumber(selectedReturnCustomer.activeCoolers)}
              </Typography>
              <Typography color="text.secondary">
                Refundable deposit balance: {formatCurrency(selectedReturnCustomer.depositBalance)}
              </Typography>
              <Typography color="text.secondary">
                Borrowed stock in {formatItemType(returnForm.itemType)}:{" "}
                {formatNumber(selectedReturnItem?.borrowedStock || 0)}
              </Typography>
            </Stack>
          )}
        </SectionCard>

        <SectionCard
          eyebrow="Desk notes"
          title="Useful operating rules"
          description="A quick reminder of the checks built into this screen."
        >
          <Stack spacing={1}>
            <Typography color="text.secondary">
              Borrow defaults the deposit to Rs 200 for jars and Rs 500 for coolers, but the operator can override it.
            </Typography>
            <Typography color="text.secondary">
              Refill supports multiple item types in one transaction. Each line has its own quantity and unit price, with subtotals calculated live.
              Refill price is fixed per item type and can be changed from the Stock page.
            </Typography>
            <Typography color="text.secondary">
              Return supports both jars and coolers and checks both customer holdings and borrowed stock for the selected item.
            </Typography>
          </Stack>
        </SectionCard>
      </Stack>
    </Box>
  )
}

export default Operations

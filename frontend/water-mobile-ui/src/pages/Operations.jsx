import { Alert, Box, Button, MenuItem, Stack, Tab, Tabs, TextField, Typography } from "@mui/material"
import { useEffect, useState } from "react"
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
  if (!customer) {
    return 0
  }

  return itemType === "cooler"
    ? Number(customer.activeCoolers || 0)
    : Number(customer.activeJars || 0)
}

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
  const [refillForm, setRefillForm] = useState({
    customerId: "",
    quantity: "1",
    pricePerUnit: "0"
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

  useEffect(() => {
    if (!customers.length) {
      return
    }

    setBorrowForm((current) =>
      current.customerId ? current : { ...current, customerId: String(customers[0].customerId) }
    )
    setRefillForm((current) =>
      current.customerId ? current : { ...current, customerId: String(customers[0].customerId) }
    )
    setReturnForm((current) =>
      current.customerId ? current : { ...current, customerId: String(customers[0].customerId) }
    )
  }, [customers])

  useEffect(() => {
    if (!inventory.length) {
      return
    }

    setBorrowForm((current) =>
      current.itemType
        ? current
        : {
            ...current,
            itemType: inventory[0].itemType,
            depositPerUnit: getDefaultDeposit(inventory[0].itemType)
          }
    )

    setReturnForm((current) =>
      current.itemType ? current : { ...current, itemType: inventory[0].itemType }
    )
  }, [inventory])

  const setMessage = (key, type, text) => {
    setFeedback((current) => ({
      ...current,
      [key]: { type, text }
    }))
  }

  const setPending = (key, value) => {
    setIsSubmitting((current) => ({
      ...current,
      [key]: value
    }))
  }

  const selectedBorrowCustomer = customers.find(
    (customer) => String(customer.customerId) === borrowForm.customerId
  )
  const selectedBorrowItem = inventory.find((item) => item.itemType === borrowForm.itemType)
  const selectedRefillCustomer = customers.find(
    (customer) => String(customer.customerId) === refillForm.customerId
  )
  const selectedReturnCustomer = customers.find(
    (customer) => String(customer.customerId) === returnForm.customerId
  )
  const selectedReturnItem = inventory.find((item) => item.itemType === returnForm.itemType)

  const handleBorrowItemChange = (event) => {
    const nextItemType = event.target.value

    setBorrowForm((current) => ({
      ...current,
      itemType: nextItemType,
      depositPerUnit: getDefaultDeposit(nextItemType)
    }))
  }

  const submitBorrow = async () => {
    const quantity = Number(borrowForm.quantity)
    const depositPerUnit = Number(borrowForm.depositPerUnit)

    if (!borrowForm.customerId) {
      setMessage("borrow", "error", "Choose a customer first.")
      return
    }

    if (!borrowForm.itemType) {
      setMessage("borrow", "error", "Choose an inventory item.")
      return
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      setMessage("borrow", "error", "Borrow quantity must be a whole number greater than zero.")
      return
    }

    if (!Number.isFinite(depositPerUnit) || depositPerUnit < 0) {
      setMessage("borrow", "error", "Deposit per unit must be zero or greater.")
      return
    }

    if (selectedBorrowItem && quantity > Number(selectedBorrowItem.availableStock || 0)) {
      setMessage("borrow", "error", "Borrow quantity cannot exceed available stock.")
      return
    }

    setPending("borrow", true)
    setMessage("borrow", "", "")

    try {
      await createBorrow(borrowForm)
      applyBorrowLocally({
        customerId: borrowForm.customerId,
        itemType: borrowForm.itemType,
        quantity,
        depositPerUnit
      })
      await refreshAll()
      setBorrowForm((current) => ({
        ...current,
        quantity: "1",
        depositPerUnit: getDefaultDeposit(current.itemType)
      }))
      setMessage("borrow", "success", "Borrow recorded successfully.")
    } catch (error) {
      setMessage("borrow", "error", getErrorMessage(error, "Unable to record the borrow."))
    } finally {
      setPending("borrow", false)
    }
  }

  const submitRefill = async () => {
    const quantity = Number(refillForm.quantity)
    const pricePerUnit = Number(refillForm.pricePerUnit)

    if (!refillForm.customerId) {
      setMessage("refill", "error", "Choose a customer first.")
      return
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      setMessage("refill", "error", "Refill quantity must be a whole number greater than zero.")
      return
    }

    if (!Number.isFinite(pricePerUnit) || pricePerUnit < 0) {
      setMessage("refill", "error", "Price per unit must be zero or greater.")
      return
    }

    setPending("refill", true)
    setMessage("refill", "", "")

    try {
      await createRefill(refillForm)
      applyRefillLocally({
        customerId: refillForm.customerId,
        quantity,
        pricePerUnit
      })
      notifyFinancialActivity()
      await refreshAll()
      setRefillForm((current) => ({
        ...current,
        quantity: "1",
        pricePerUnit: "0"
      }))
      setMessage("refill", "success", "Refill recorded successfully.")
    } catch (error) {
      setMessage("refill", "error", getErrorMessage(error, "Unable to record the refill."))
    } finally {
      setPending("refill", false)
    }
  }

  const submitReturn = async () => {
    const quantity = Number(returnForm.quantity)
    const depositRefunded = Number(returnForm.depositRefunded)

    if (!returnForm.customerId) {
      setMessage("return", "error", "Choose a customer first.")
      return
    }

    if (!returnForm.itemType) {
      setMessage("return", "error", "Choose which item is being returned.")
      return
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      setMessage("return", "error", "Return quantity must be a whole number greater than zero.")
      return
    }

    if (!Number.isFinite(depositRefunded) || depositRefunded < 0) {
      setMessage("return", "error", "Deposit refund must be zero or greater.")
      return
    }

    if (selectedReturnCustomer && quantity > getCustomerItemCount(selectedReturnCustomer, returnForm.itemType)) {
      setMessage("return", "error", "Return quantity cannot exceed the customer's active count for that item.")
      return
    }

    if (selectedReturnItem && quantity > Number(selectedReturnItem.borrowedStock || 0)) {
      setMessage("return", "error", "Return quantity cannot exceed borrowed stock for that item.")
      return
    }

    if (selectedReturnCustomer && depositRefunded > Number(selectedReturnCustomer.depositBalance || 0)) {
      setMessage("return", "error", "Refund cannot exceed the customer's deposit balance.")
      return
    }

    setPending("return", true)
    setMessage("return", "", "")

    try {
      await createReturn(returnForm)
      applyReturnLocally({
        customerId: returnForm.customerId,
        itemType: returnForm.itemType,
        quantity,
        depositRefunded
      })
      await refreshAll()
      setReturnForm((current) => ({
        ...current,
        quantity: "1",
        depositRefunded: "0"
      }))
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
            <Tabs value={tab} onChange={(_, nextValue) => setTab(nextValue)} variant="fullWidth">
              <Tab value="borrow" label="Borrow" />
              <Tab value="refill" label="Refill" />
              <Tab value="return" label="Return" />
            </Tabs>

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
                  <TextField
                    select
                    label="Customer"
                    value={borrowForm.customerId}
                    onChange={(event) =>
                      setBorrowForm((current) => ({ ...current, customerId: event.target.value }))
                    }
                  >
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
                    onChange={(event) =>
                      setBorrowForm((current) => ({ ...current, quantity: event.target.value }))
                    }
                  />
                  <TextField
                    label="Deposit per unit"
                    type="number"
                    inputProps={{ min: 0, step: 0.01 }}
                    value={borrowForm.depositPerUnit}
                    onChange={(event) =>
                      setBorrowForm((current) => ({
                        ...current,
                        depositPerUnit: event.target.value
                      }))
                    }
                    helperText="Defaults to Rs 200 for jar and Rs 500 for cooler, but you can override it."
                  />
                  <Button variant="contained" onClick={submitBorrow} disabled={isSubmitting.borrow}>
                    {isSubmitting.borrow ? "Saving..." : "Record borrow"}
                  </Button>
                </Stack>
              ))}

            {tab === "refill" && (
              <Stack spacing={2}>
                {feedback.refill.text && (
                  <Alert severity={feedback.refill.type || "info"}>{feedback.refill.text}</Alert>
                )}
                <TextField
                  select
                  label="Customer"
                  value={refillForm.customerId}
                  onChange={(event) =>
                    setRefillForm((current) => ({ ...current, customerId: event.target.value }))
                  }
                >
                  {renderCustomerOptions()}
                </TextField>
                <TextField
                  label="Quantity"
                  type="number"
                  inputProps={{ min: 1, step: 1 }}
                  value={refillForm.quantity}
                  onChange={(event) =>
                    setRefillForm((current) => ({ ...current, quantity: event.target.value }))
                  }
                />
                <TextField
                  label="Price per unit"
                  type="number"
                  inputProps={{ min: 0, step: 0.01 }}
                  value={refillForm.pricePerUnit}
                  onChange={(event) =>
                    setRefillForm((current) => ({
                      ...current,
                      pricePerUnit: event.target.value
                    }))
                  }
                  helperText="If this pushes deposit below zero, the negative balance is what the customer owes the client."
                />
                <Button variant="contained" onClick={submitRefill} disabled={isSubmitting.refill}>
                  {isSubmitting.refill ? "Saving..." : "Record refill"}
                </Button>
              </Stack>
            )}

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
                  <TextField
                    select
                    label="Customer"
                    value={returnForm.customerId}
                    onChange={(event) =>
                      setReturnForm((current) => ({ ...current, customerId: event.target.value }))
                    }
                  >
                    {renderCustomerOptions()}
                  </TextField>
                  <TextField
                    select
                    label="Item type"
                    value={returnForm.itemType}
                    onChange={(event) =>
                      setReturnForm((current) => ({ ...current, itemType: event.target.value }))
                    }
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
                    onChange={(event) =>
                      setReturnForm((current) => ({ ...current, quantity: event.target.value }))
                    }
                  />
                  <TextField
                    label="Deposit refunded"
                    type="number"
                    inputProps={{ min: 0, step: 0.01 }}
                    value={returnForm.depositRefunded}
                    onChange={(event) =>
                      setReturnForm((current) => ({
                        ...current,
                        depositRefunded: event.target.value
                      }))
                    }
                  />
                  <Button variant="contained" onClick={submitReturn} disabled={isSubmitting.return}>
                    {isSubmitting.return ? "Saving..." : "Record return"}
                  </Button>
                </Stack>
              ))}
          </Stack>
        )}
      </SectionCard>

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
                Remaining deposit balance: {formatCurrency(selectedRefillCustomer.depositBalance)}
              </Typography>
              <Typography color="text.secondary">
                Negative balance means this customer now owes money to the client.
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
              Refill deducts quantity x price per unit from the customer's deposit balance, even if that creates a negative balance.
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

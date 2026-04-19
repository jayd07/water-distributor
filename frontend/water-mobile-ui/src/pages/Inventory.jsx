import AddBusinessRoundedIcon from "@mui/icons-material/AddBusinessRounded"
import { Alert, Box, Button, LinearProgress, Stack, TextField, Typography } from "@mui/material"
import { useState } from "react"
import EmptyState from "../components/EmptyState"
import SectionCard from "../components/SectionCard"
import { useAppData } from "../context/AppDataContext"
import { addInventory, getErrorMessage, updateInventoryRefillPrice } from "../services/api"
import { formatCurrency, formatItemType, formatNumber } from "../utils/formatters"

function Inventory() {
  const { inventory, inventoryState, refreshInventory } = useAppData()
  const [itemType, setItemType] = useState("jar")
  const [quantity, setQuantity] = useState("1")
  const [refillPricePerUnit, setRefillPricePerUnit] = useState("0")
  const [priceEdits, setPriceEdits] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [updatingPriceFor, setUpdatingPriceFor] = useState("")
  const [feedback, setFeedback] = useState({ type: "", text: "" })

  const submitInventory = async () => {
    const parsedQuantity = Number(quantity)
    const parsedRefillPrice = Number(refillPricePerUnit)

    if (!itemType.trim()) {
      setFeedback({ type: "error", text: "Item type is required." })
      return
    }

    if (!Number.isInteger(parsedQuantity) || parsedQuantity <= 0) {
      setFeedback({ type: "error", text: "Quantity must be a whole number greater than zero." })
      return
    }

    if (!Number.isFinite(parsedRefillPrice) || parsedRefillPrice < 0) {
      setFeedback({ type: "error", text: "Refill price per unit must be zero or greater." })
      return
    }

    setIsSubmitting(true)
    setFeedback({ type: "", text: "" })

    try {
      await addInventory({
        itemType,
        quantity: parsedQuantity,
        refillPricePerUnit: parsedRefillPrice
      })
      await refreshInventory()
      setQuantity("1")
      setFeedback({ type: "success", text: "Inventory updated successfully." })
    } catch (error) {
      setFeedback({
        type: "error",
        text: getErrorMessage(error, "Unable to update inventory right now.")
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const submitRefillPrice = async (item) => {
    const nextPrice = Number(priceEdits[item.itemType] ?? item.refillPricePerUnit ?? 0)

    if (!Number.isFinite(nextPrice) || nextPrice < 0) {
      setFeedback({ type: "error", text: "Refill price per unit must be zero or greater." })
      return
    }

    setUpdatingPriceFor(item.itemType)
    setFeedback({ type: "", text: "" })

    try {
      await updateInventoryRefillPrice({
        itemType: item.itemType,
        refillPricePerUnit: nextPrice
      })
      await refreshInventory()
      setPriceEdits((current) => ({ ...current, [item.itemType]: String(nextPrice) }))
      setFeedback({ type: "success", text: "Refill price updated successfully." })
    } catch (error) {
      setFeedback({
        type: "error",
        text: getErrorMessage(error, "Unable to update refill price right now.")
      })
    } finally {
      setUpdatingPriceFor("")
    }
  }

  return (
    <Box className="split-grid">
        <SectionCard
          eyebrow="Stock entry"
          title="Add or top up stock"
          description="Use the same form to create a new stock line or increase an existing one."
        >
          <Stack spacing={2}>
            {feedback.text && <Alert severity={feedback.type || "info"}>{feedback.text}</Alert>}

            <TextField
              label="Item type"
              value={itemType}
              onChange={(event) => setItemType(event.target.value)}
              helperText="Use simple names like jar or cooler."
            />

            <TextField
              label="Quantity"
              type="number"
              inputProps={{ min: 1, step: 1 }}
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
            />

            <TextField
              label="Refill price per unit"
              type="number"
              inputProps={{ min: 0, step: 0.01 }}
              value={refillPricePerUnit}
              onChange={(event) => setRefillPricePerUnit(event.target.value)}
              helperText="This fixed price is used automatically on the refill screen."
            />

            <Button
              variant="contained"
              startIcon={<AddBusinessRoundedIcon />}
              onClick={submitInventory}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Add inventory"}
            </Button>
          </Stack>
        </SectionCard>

        <SectionCard
          eyebrow="Current stock"
          title="Inventory lines"
          description="See what is total, available, and currently out with customers."
        >
          {inventoryState.error && <Alert severity="warning">{inventoryState.error}</Alert>}
          {inventoryState.showingCachedData && !inventoryState.error && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Showing saved inventory while the backend reconnects.
            </Alert>
          )}

          {inventory.length ? (
            <Box className="list-grid">
              {inventory.map((item) => {
                const progressValue =
                  Number(item.totalStock) > 0
                    ? (Number(item.availableStock) / Number(item.totalStock)) * 100
                    : 0

                return (
                  <Box key={item.itemType} className="mini-card">
                    <Stack direction="row" justifyContent="space-between" alignItems="center" gap={2}>
                      <Box>
                        <Typography variant="h6">{formatItemType(item.itemType)}</Typography>
                        <Typography color="text.secondary">
                          Total {formatNumber(item.totalStock)} units
                        </Typography>
                        <Typography color="text.secondary">
                          Refill price {formatCurrency(item.refillPricePerUnit || 0)} / unit
                        </Typography>
                      </Box>
                      <Typography variant="body2">
                        {formatNumber(item.availableStock)} ready
                      </Typography>
                    </Stack>

                    <LinearProgress
                      variant="determinate"
                      value={progressValue}
                      sx={{ mt: 2, height: 8, borderRadius: 999 }}
                    />

                    <Box className="status-row" sx={{ mt: 1.5 }}>
                      <Typography variant="body2">
                        Borrowed {formatNumber(item.borrowedStock)}
                      </Typography>
                      <Typography variant="body2">
                        Available {formatNumber(item.availableStock)}
                      </Typography>
                    </Box>

                    <div className="stock-price-editor">
                      <TextField
                        label="Change refill price"
                        type="number"
                        size="small"
                        inputProps={{ min: 0, step: 0.01 }}
                        value={priceEdits[item.itemType] ?? String(item.refillPricePerUnit || 0)}
                        onChange={(event) =>
                          setPriceEdits((current) => ({
                            ...current,
                            [item.itemType]: event.target.value
                          }))
                        }
                      />
                      <Button
                        className="stock-price-button"
                        variant="outlined"
                        onClick={() => submitRefillPrice(item)}
                        disabled={updatingPriceFor === item.itemType}
                      >
                        {updatingPriceFor === item.itemType ? "Saving..." : "Update"}
                      </Button>
                    </div>
                  </Box>
                )
              })}
            </Box>
          ) : (
            <EmptyState
              title="Inventory is empty"
              description="Add a stock line to unlock borrow and return operations."
            />
          )}
        </SectionCard>
    </Box>
  )
}

export default Inventory

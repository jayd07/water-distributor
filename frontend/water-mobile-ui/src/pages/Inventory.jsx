import AddBusinessRoundedIcon from "@mui/icons-material/AddBusinessRounded"
import { Alert, Box, Button, LinearProgress, Stack, TextField, Typography } from "@mui/material"
import { useState } from "react"
import EmptyState from "../components/EmptyState"
import SectionCard from "../components/SectionCard"
import { useAppData } from "../context/AppDataContext"
import { addInventory, getErrorMessage } from "../services/api"
import { formatItemType, formatNumber } from "../utils/formatters"

function Inventory() {
  const { inventory, inventoryState, refreshInventory } = useAppData()
  const [itemType, setItemType] = useState("jar")
  const [quantity, setQuantity] = useState("1")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedback, setFeedback] = useState({ type: "", text: "" })

  const submitInventory = async () => {
    const parsedQuantity = Number(quantity)

    if (!itemType.trim()) {
      setFeedback({ type: "error", text: "Item type is required." })
      return
    }

    if (!Number.isInteger(parsedQuantity) || parsedQuantity <= 0) {
      setFeedback({ type: "error", text: "Quantity must be a whole number greater than zero." })
      return
    }

    setIsSubmitting(true)
    setFeedback({ type: "", text: "" })

    try {
      await addInventory({ itemType, quantity: parsedQuantity })
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

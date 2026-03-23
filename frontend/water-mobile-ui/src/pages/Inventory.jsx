import AddBusinessRoundedIcon from "@mui/icons-material/AddBusinessRounded"
import { Alert, Box, Button, LinearProgress, Stack, TextField, Typography } from "@mui/material"
import { useState } from "react"
import EmptyState from "../components/EmptyState"
import MetricCard from "../components/MetricCard"
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

  const totalStock = inventory.reduce((sum, item) => sum + Number(item.totalStock || 0), 0)
  const availableStock = inventory.reduce((sum, item) => sum + Number(item.availableStock || 0), 0)
  const borrowedStock = inventory.reduce((sum, item) => sum + Number(item.borrowedStock || 0), 0)

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
    <Stack spacing={2.5}>
      <Box className="dashboard-grid">
        <MetricCard
          label="Stock lines"
          value={formatNumber(inventory.length)}
          note="Distinct item types tracked"
          tone="night"
        />
        <MetricCard
          label="Total stock"
          value={formatNumber(totalStock)}
          note="Cumulative units recorded"
          tone="ocean"
        />
        <MetricCard
          label="Available now"
          value={formatNumber(availableStock)}
          note="Ready for the next operation"
          tone="sage"
        />
        <MetricCard
          label="Borrowed stock"
          value={formatNumber(borrowedStock)}
          note="Currently out with customers"
          tone="sun"
        />
      </Box>

      <Box className="split-grid">
        <SectionCard
          eyebrow="Stock intake"
          title="Add or top up inventory"
          description="Use the same form for brand new items or to increase stock on an existing item type."
        >
          <Stack spacing={2}>
            {feedback.text && <Alert severity={feedback.type || "info"}>{feedback.text}</Alert>}

            <TextField
              label="Item type"
              value={itemType}
              onChange={(event) => setItemType(event.target.value)}
              helperText="For this setup, 'jar' is the main operational item."
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
          eyebrow="Live stock"
          title="Inventory lines"
          description="See total, available, and borrowed stock at a glance so the desk can act confidently."
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
    </Stack>
  )
}

export default Inventory

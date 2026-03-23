import Inventory2RoundedIcon from "@mui/icons-material/Inventory2Rounded"
import PaidRoundedIcon from "@mui/icons-material/PaidRounded"
import PersonAddAlt1RoundedIcon from "@mui/icons-material/PersonAddAlt1Rounded"
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded"
import SwapHorizRoundedIcon from "@mui/icons-material/SwapHorizRounded"
import { Alert, Box, Button, Chip, Stack, Typography } from "@mui/material"
import { useNavigate } from "react-router-dom"
import EmptyState from "../components/EmptyState"
import MetricCard from "../components/MetricCard"
import SectionCard from "../components/SectionCard"
import { useAppData } from "../context/AppDataContext"
import { formatCurrency, formatItemType, formatNumber, getActiveItemCount } from "../utils/formatters"

function Dashboard() {
  const navigate = useNavigate()
  const { customers, customersState, inventory, inventoryState } = useAppData()

  const totalActiveItems = customers.reduce((sum, customer) => sum + getActiveItemCount(customer), 0)
  const totalDeposit = customers.reduce((sum, customer) => sum + Number(customer.depositBalance || 0), 0)
  const totalAvailable = inventory.reduce((sum, item) => sum + Number(item.availableStock || 0), 0)
  const totalBorrowed = inventory.reduce((sum, item) => sum + Number(item.borrowedStock || 0), 0)

  const focusCustomers = [...customers]
    .sort((left, right) => getActiveItemCount(right) - getActiveItemCount(left))
    .slice(0, 4)

  return (
    <Stack spacing={2.5}>
      {(customersState.showingCachedData || inventoryState.showingCachedData) && (
        <Alert severity="info" className="reveal">
          Showing saved data because the backend is temporarily unavailable.
        </Alert>
      )}

      <Box className="dashboard-grid">
        <MetricCard
          label="Households"
          value={formatNumber(customers.length)}
          note="Active customers in your base"
          tone="ocean"
        />
        <MetricCard
          label="Items in circulation"
          value={formatNumber(totalActiveItems)}
          note={`${formatNumber(totalBorrowed)} marked as borrowed in stock`}
          tone="sun"
        />
        <MetricCard
          label="Deposit balance"
          value={formatCurrency(totalDeposit)}
          note="Current remaining customer deposit balance"
          tone="sage"
        />
        <MetricCard
          label="Ready stock"
          value={formatNumber(totalAvailable)}
          note={`${formatNumber(inventory.length)} inventory lines live`}
          tone="night"
        />
      </Box>

      <Box className="content-grid">
        <SectionCard
          eyebrow="Command center"
          title="Move the day forward"
          description="Use these shortcuts to onboard customers, add stock, process operations, and review ledgers without hunting through the app."
        >
          <Box className="button-cluster">
            <Button
              variant="contained"
              startIcon={<PersonAddAlt1RoundedIcon />}
              onClick={() => navigate("/customers")}
            >
              Add customer
            </Button>
            <Button
              variant="outlined"
              startIcon={<Inventory2RoundedIcon />}
              onClick={() => navigate("/inventory")}
            >
              Add inventory
            </Button>
            <Button
              variant="outlined"
              startIcon={<SwapHorizRoundedIcon />}
              onClick={() => navigate("/operations")}
            >
              Process ops
            </Button>
            <Button
              variant="text"
              startIcon={<ReceiptLongRoundedIcon />}
              onClick={() => navigate("/ledger")}
            >
              Open ledger
            </Button>
            <Button
              variant="text"
              startIcon={<PaidRoundedIcon />}
              onClick={() => navigate("/earnings")}
            >
              View earnings
            </Button>
          </Box>
        </SectionCard>

        <SectionCard
          eyebrow="Stock line"
          title="Inventory snapshot"
          description="A quick read on what is ready, borrowed, and total across the items you track."
        >
          {inventory.length ? (
            <Stack spacing={1.5}>
              {inventory.map((item) => (
                <Box key={item.itemType} className="mini-card">
                  <Stack direction="row" justifyContent="space-between" alignItems="center" gap={2}>
                    <Box>
                      <Typography variant="h6">{formatItemType(item.itemType)}</Typography>
                      <Typography color="text.secondary">
                        Total {formatNumber(item.totalStock)} units
                      </Typography>
                    </Box>
                    <Chip
                      label={`${formatNumber(item.availableStock)} ready`}
                      color="primary"
                      variant="outlined"
                    />
                  </Stack>
                  <Box className="status-row" sx={{ mt: 1.5 }}>
                    <Chip label={`Borrowed ${formatNumber(item.borrowedStock)}`} size="small" />
                    <Chip label={`Available ${formatNumber(item.availableStock)}`} size="small" />
                  </Box>
                </Box>
              ))}
            </Stack>
          ) : (
            <EmptyState
              title="No inventory yet"
              description="Add your first stock line to start processing borrows and returns."
              actionLabel="Add stock"
              onAction={() => navigate("/inventory")}
            />
          )}
        </SectionCard>
      </Box>

      <SectionCard
        eyebrow="Priority watch"
        title="Customers to keep an eye on"
        description="These accounts currently hold the most active items, so they are the fastest way to check exposure and open ledger items."
      >
        {focusCustomers.length ? (
          <Box className="list-grid">
            {focusCustomers.map((customer) => (
              <Box key={customer.customerId} className="mini-card">
                <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={1.5}>
                  <Box>
                    <Typography variant="h6">{customer.name}</Typography>
                    <Typography color="text.secondary">
                      {customer.phone || "Phone not added"} | {customer.address || "Address not added"}
                    </Typography>
                  </Box>
                  <Box className="status-row">
                    <Chip label={`${formatNumber(customer.activeJars)} jars`} color="secondary" />
                    <Chip label={`${formatNumber(customer.activeCoolers)} coolers`} color="secondary" />
                    <Chip label={formatCurrency(customer.depositBalance)} variant="outlined" />
                  </Box>
                </Stack>
              </Box>
            ))}
          </Box>
        ) : (
          <EmptyState
            title="No customers yet"
            description="Create your first customer profile to unlock operations and ledger views."
            actionLabel="Create customer"
            onAction={() => navigate("/customers")}
          />
        )}
      </SectionCard>
    </Stack>
  )
}

export default Dashboard

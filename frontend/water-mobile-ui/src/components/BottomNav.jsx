import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded"
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded"
import Inventory2RoundedIcon from "@mui/icons-material/Inventory2Rounded"
import PaidRoundedIcon from "@mui/icons-material/PaidRounded"
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded"
import SwapHorizRoundedIcon from "@mui/icons-material/SwapHorizRounded"
import { BottomNavigation, BottomNavigationAction, Paper } from "@mui/material"
import { useLocation, useNavigate } from "react-router-dom"

const navItems = [
  {
    label: "Home",
    path: "/",
    icon: <DashboardRoundedIcon />,
    matches: (pathname) => pathname === "/"
  },
  {
    label: "Clients",
    path: "/customers",
    icon: <GroupsRoundedIcon />,
    matches: (pathname) => pathname.startsWith("/customers")
  },
  {
    label: "Stock",
    path: "/inventory",
    icon: <Inventory2RoundedIcon />,
    matches: (pathname) => pathname.startsWith("/inventory")
  },
  {
    label: "Ops",
    path: "/operations",
    icon: <SwapHorizRoundedIcon />,
    matches: (pathname) => pathname.startsWith("/operations") || pathname.startsWith("/borrow")
  },
  {
    label: "Money",
    path: "/earnings",
    icon: <PaidRoundedIcon />,
    matches: (pathname) => pathname.startsWith("/earnings")
  },
  {
    label: "Ledger",
    path: "/ledger",
    icon: <ReceiptLongRoundedIcon />,
    matches: (pathname) => pathname.startsWith("/ledger")
  }
]

function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()

  const currentPath = navItems.find((item) => item.matches(location.pathname))?.path || "/"

  return (
    <div className="nav-wrap">
      <Paper className="nav-inner" elevation={0}>
        <BottomNavigation
          value={currentPath}
          onChange={(_, nextValue) => navigate(nextValue)}
          showLabels
          sx={{
            bgcolor: "transparent",
            "& .MuiBottomNavigationAction-root": {
              minWidth: 0,
              color: "text.secondary",
              py: 1.2
            },
            "& .Mui-selected": {
              color: "primary.main"
            }
          }}
        >
          {navItems.map((item) => (
            <BottomNavigationAction
              key={item.path}
              value={item.path}
              label={item.label}
              icon={item.icon}
            />
          ))}
        </BottomNavigation>
      </Paper>
    </div>
  )
}

export default BottomNav

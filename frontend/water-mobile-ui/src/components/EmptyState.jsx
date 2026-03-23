import { Box, Button, Typography } from "@mui/material"

function EmptyState({ title, description, actionLabel, onAction }) {
  return (
    <Box className="empty-state">
      <Typography variant="h6">{title}</Typography>
      <Typography color="text.secondary" sx={{ mt: 0.75 }}>
        {description}
      </Typography>
      {actionLabel && onAction && (
        <Button variant="contained" sx={{ mt: 2 }} onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </Box>
  )
}

export default EmptyState

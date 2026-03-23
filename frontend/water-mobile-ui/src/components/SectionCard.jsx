import { Box, Paper, Stack, Typography } from "@mui/material"

function SectionCard({ eyebrow, title, description, action, children }) {
  return (
    <Paper className="panel-card reveal" elevation={0} sx={{ p: { xs: 2.25, md: 3 } }}>
      {(eyebrow || title || description || action) && (
        <Stack
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          alignItems={{ md: "flex-start" }}
          gap={1.5}
          sx={{ mb: 2.5 }}
        >
          <Box>
            {eyebrow && <Typography className="section-eyebrow">{eyebrow}</Typography>}
            {title && <Typography variant="h5">{title}</Typography>}
            {description && (
              <Typography color="text.secondary" sx={{ mt: 0.75, maxWidth: 700 }}>
                {description}
              </Typography>
            )}
          </Box>
          {action && <Box sx={{ flexShrink: 0 }}>{action}</Box>}
        </Stack>
      )}
      {children}
    </Paper>
  )
}

export default SectionCard

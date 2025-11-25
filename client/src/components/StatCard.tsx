import { Box, Card, CardContent, Typography, useTheme, type SxProps, type Theme } from '@mui/material';
import { TrendingUp as TrendingUpIcon, TrendingDown as TrendingDownIcon } from '@mui/icons-material';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  sx?: SxProps<Theme>;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = 'primary',
  sx,
}: StatCardProps) {
  const theme = useTheme();

  const colorMap = {
    primary: theme.palette.primary,
    secondary: theme.palette.secondary,
    success: theme.palette.success,
    warning: theme.palette.warning,
    error: theme.palette.error,
    info: theme.palette.info,
  };

  const selectedColor = colorMap[color];

  return (
    <Card
      sx={{
        height: '100%',
        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows[8],
        },
        ...sx,
      }}
      role="region"
      aria-label={`${title}: ${value}`}
    >
      <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="overline"
              sx={{
                color: theme.palette.text.secondary,
                fontWeight: 600,
                fontSize: '0.75rem',
              }}
            >
              {title}
            </Typography>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                mt: 1,
                color: theme.palette.text.primary,
              }}
            >
              {value}
            </Typography>
            {(trend || subtitle) && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, gap: 1 }}>
                {trend && (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      color: trend.isPositive
                        ? theme.palette.success.main
                        : theme.palette.error.main,
                    }}
                  >
                    {trend.isPositive ? (
                      <TrendingUpIcon sx={{ fontSize: 18 }} aria-hidden="true" />
                    ) : (
                      <TrendingDownIcon sx={{ fontSize: 18 }} aria-hidden="true" />
                    )}
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 600 }}
                      aria-label={`${trend.isPositive ? 'Increased' : 'Decreased'} by ${Math.abs(trend.value)}%`}
                    >
                      {trend.value > 0 ? '+' : ''}
                      {trend.value}%
                    </Typography>
                  </Box>
                )}
                {subtitle && (
                  <Typography variant="body2" color="text.secondary">
                    {subtitle}
                  </Typography>
                )}
              </Box>
            )}
          </Box>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: selectedColor.main + '14',
              color: selectedColor.main,
            }}
            aria-hidden="true"
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

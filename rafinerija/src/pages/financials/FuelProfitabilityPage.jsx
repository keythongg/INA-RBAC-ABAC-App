import React from 'react';
import { Box, Typography, Card, CardContent, Grid } from '@mui/material';
import { IconTrendingUp } from '@tabler/icons-react';

const FuelProfitabilityPage = () => {
    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 2 }}>
                <IconTrendingUp size={32} /> Profitabilnost Goriva
            </Typography>
            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <Card>
                        <CardContent sx={{ minHeight: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                            <img
                                src="https://cdn-icons-png.flaticon.com/512/1628/1628445.png"
                                alt="Profit"
                                style={{ width: 120, marginBottom: 20, opacity: 0.7 }}
                            />
                            <Typography variant="h6" color="textSecondary">
                                Analiza profitabilnosti po vrstama goriva.
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

export default FuelProfitabilityPage;

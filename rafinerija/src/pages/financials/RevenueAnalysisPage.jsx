import React from 'react';
import { Box, Typography, Card, CardContent, Grid } from '@mui/material';
import { IconCoin } from '@tabler/icons-react';

const RevenueAnalysisPage = () => {
    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 2 }}>
                <IconCoin size={32} /> Analiza Prihoda
            </Typography>
            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <Card>
                        <CardContent sx={{ minHeight: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                            <img
                                src="https://cdn-icons-png.flaticon.com/512/2910/2910791.png"
                                alt="Revenue"
                                style={{ width: 120, marginBottom: 20, opacity: 0.7 }}
                            />
                            <Typography variant="h6" color="textSecondary">
                                Financijski izvještaji dolaze uskoro.
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

export default RevenueAnalysisPage;

import React from 'react';
import { Box, Typography, Card, CardContent, Grid } from '@mui/material';
import { IconChartLine } from '@tabler/icons-react';

const FuelForecastPage = () => {
    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 2 }}>
                <IconChartLine size={32} /> Prognoza Potrošnje
            </Typography>
            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <Card>
                        <CardContent sx={{ minHeight: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                            <img
                                src="https://cdn-icons-png.flaticon.com/512/2936/2936758.png"
                                alt="Forecast"
                                style={{ width: 120, marginBottom: 20, opacity: 0.7 }}
                            />
                            <Typography variant="h6" color="textSecondary">
                                AI Modul za prognozu je u pripremi.
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                                Koristit ćemo povijesne podatke za predviđanje buduće potrošnje i proizvodnje.
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

export default FuelForecastPage;

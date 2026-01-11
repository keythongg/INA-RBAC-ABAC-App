import React from 'react';
import { Box, Typography, Card, CardContent, Grid } from '@mui/material';
import { IconChartBar } from '@tabler/icons-react';

const FuelProductionPage = () => {
    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 2 }}>
                <IconChartBar size={32} /> Proizvodnja Goriva
            </Typography>
            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <Card>
                        <CardContent sx={{ minHeight: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                            <img
                                src="https://cdn-icons-png.flaticon.com/512/2821/2821637.png"
                                alt="Construction"
                                style={{ width: 120, marginBottom: 20, opacity: 0.7 }}
                            />
                            <Typography variant="h6" color="textSecondary">
                                Detaljan pregled proizvodnje je u izradi.
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                                Ovdje će biti prikazani grafovi proizvodnje po rafinerijama i vrstama goriva.
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

export default FuelProductionPage;

import React from 'react';
import { Box, Typography, Card, CardContent, Grid } from '@mui/material';
import { IconBusinessplan } from '@tabler/icons-react';

const CapexAnalysisPage = () => {
    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 2 }}>
                <IconBusinessplan size={32} /> CAPEX Investicije
            </Typography>
            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <Card>
                        <CardContent sx={{ minHeight: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                            <img
                                src="https://cdn-icons-png.flaticon.com/512/2830/2830206.png"
                                alt="Capex"
                                style={{ width: 120, marginBottom: 20, opacity: 0.7 }}
                            />
                            <Typography variant="h6" color="textSecondary">
                                Praćenje investicija (Capital Expenditure).
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

export default CapexAnalysisPage;

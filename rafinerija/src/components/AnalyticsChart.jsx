import React from "react";
import { Bar } from "react-chartjs-2";
import { Card, CardContent, Typography } from "@mui/material";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const AnalyticsChart = () => {
    const data = {
        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
        datasets: [
            {
                label: "Proizvedeno goriva (u tonama)",
                data: [100, 200, 150, 300, 250, 400, 320, 410, 380, 420, 500, 480],
                backgroundColor: "#1976d2",
            },
        ],
    };

    return (
        <Card sx={{ mt: 3 }}>
            <CardContent>
                <Typography variant="h6">Analiza proizvodnje goriva</Typography>
                <Bar data={data} />
            </CardContent>
        </Card>
    );
};

export default AnalyticsChart;

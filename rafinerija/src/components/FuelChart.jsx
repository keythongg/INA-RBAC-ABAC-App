import React from "react";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const FuelChart = ({ data }) => {
    const chartData = {
        labels: data.map((item) => item.type),
        datasets: [
            {
                label: "Količina goriva (L)",
                data: data.map((item) => item.quantity),
                backgroundColor: ["#2196F3", "#4CAF50", "#FFC107", "#FF5722", "#9C27B0"],
            },
        ],
    };

    return <Bar data={chartData} />;
};

export default FuelChart;

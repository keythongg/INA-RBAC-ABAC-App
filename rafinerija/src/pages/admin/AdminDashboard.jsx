import { useEffect, useState } from "react";
import { Grid, Card, CardContent, Typography, MenuItem, Select, FormControl, Box, useTheme } from "@mui/material";
import Chart from "react-apexcharts";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import BeautifulDropdown from '../../components/BeautifulDropdown';
import * as api from '../../services/api'; // ili pravi put do tvog api.js

const DropdownWithIcon = ({ value, onChange, options, label }) => {
    const [open, setOpen] = useState(false);

    return (
        <FormControl fullWidth sx={{ minWidth: 150 }}>
            <Select
                value={value}
                onChange={onChange}
                displayEmpty
                open={open}
                onOpen={() => setOpen(true)}
                onClose={() => setOpen(false)}
                IconComponent={() => open ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            >
                <MenuItem value="">{label}</MenuItem>
                {options.map((option, index) => (
                    <MenuItem key={index} value={option}>{option}</MenuItem>
                ))}
            </Select>
        </FormControl>
    );
};

const AdminDashboard = () => {
    const theme = useTheme();
    const [chartData, setChartData] = useState({ categories: [], series: [] });
    const [fuelType, setFuelType] = useState("");
    const [refinery, setRefinery] = useState("");
    const [year, setYear] = useState("");
    const [fuelTypes, setFuelTypes] = useState([]);
    const [refineries, setRefineries] = useState([]);
    const [years, setYears] = useState([]);
    const [profitabilityData, setProfitabilityData] = useState([]);
    const [expanded, setExpanded] = useState(false);
    const [stats, setStats] = useState({
        totalEarnings: 0,
        totalOrders: 0,
        totalIncome: 0,
    });
    const [revenueByYear, setRevenueByYear] = useState(0);
    const [yearIncome, setYearIncome] = useState("");
    const [yearProduction, setYearProduction] = useState("");
    const [capexByYear, setCapexByYear] = useState(0);
    const [yearCapex, setYearCapex] = useState("Sve");
    const [totalEmployees, setTotalEmployees] = useState(0);

    const formatCurrency = (value) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            maximumFractionDigits: 2,
        }).format(value);
    };

    const formatEuropeanNumber = (number) => {
        if (typeof number !== 'number') return "0,00";
        const fixedNumber = number.toFixed(2);
        const [integerPart, decimalPart] = fixedNumber.split('.');
        const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
        return `${formattedInteger},${decimalPart}`;
    };

    const formatLargeNumber = (num) => {
        if (!num && num !== 0) return "0";

        const number = typeof num === 'string' ? parseFloat(num) : num;

        if (number >= 1000000000) {
            return (number / 1000000000).toFixed(2).replace('.', ',') + ' MLRD';
        } else if (number >= 1000000) {
            return (number / 1000000).toFixed(2).replace('.', ',') + ' MLN';
        } else if (number >= 1000) {
            return (number / 1000).toFixed(1).replace('.', ',') + ' K';
        } else {
            return Math.round(number).toLocaleString('hr-HR');
        }
    };

    // Fetch initial data
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [fuelTypesData, refineriesData, yearsData] = await Promise.all([
                    api.fetchFuelTypes(),
                    api.fetchRefineries(),
                    api.fetchYears()
                ]);

                setFuelTypes(fuelTypesData);
                setRefineries(refineriesData.map(r => r.refinery));
                setYears(yearsData);
            } catch (error) {
                console.error("Error fetching initial data:", error);
            }
        };

        fetchInitialData();
    }, []);

    // Fetch dashboard data when filters change
    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const productionData = await api.fetchFuelProduction(fuelType, refinery, year);

                if (productionData.length === 0) {
                    setChartData({ categories: [], series: [] });
                    return;
                }

                const monthOrder = [
                    "January", "February", "March", "April", "May", "June",
                    "July", "August", "September", "October", "November", "December"
                ];

                const fuelTypesData = {};
                monthOrder.forEach(month => {
                    fuelTypesData[month] = {};
                });

                productionData.forEach((entry) => {
                    if (!fuelTypesData[entry.month][entry.fuel_type]) {
                        fuelTypesData[entry.month][entry.fuel_type] = 0;
                    }
                    fuelTypesData[entry.month][entry.fuel_type] += entry.production_tons;
                });

                const fuelTypes = [...new Set(productionData.map(entry => entry.fuel_type))];
                const seriesData = fuelTypes.map(fuelType => ({
                    name: fuelType,
                    data: monthOrder.map(month => fuelTypesData[month][fuelType] || 0)
                }));

                setChartData({
                    categories: monthOrder,
                    series: seriesData,
                });

                const revenueData = await api.fetchRevenueByYear(year);
                setStats({
                    totalIncome: revenueData.totalIncome || 0,
                    totalOrders: revenueData.totalOrders || 0,
                    totalEarnings: revenueData.totalEarnings || 0,
                });
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            }
        };

        fetchDashboardData();
    }, [fuelType, refinery, year]);

    // Fetch profitability data
    useEffect(() => {
        const fetchProfitability = async () => {
            try {
                const data = await api.fetchFuelProfitability();
                setProfitabilityData(data);
            } catch (error) {
                console.error("Error fetching profitability data:", error);
            }
        };

        fetchProfitability();
    }, []);

    // Fetch years and latest year on mount
    useEffect(() => {
        const fetchYearsAndLatest = async () => {
            try {
                const [yearsData, latestYearData] = await Promise.all([
                    api.fetchYears(),
                    api.fetchLatestYear()
                ]);

                setYears(yearsData);
                const latestYear = latestYearData.latestYear;
                setYearIncome(latestYear);
                setYearProduction(latestYear);
            } catch (error) {
                console.error("Error fetching years data:", error);
            }
        };

        fetchYearsAndLatest();
    }, []);

    // Fetch revenue by year
    useEffect(() => {
        const fetchRevenue = async () => {
            try {
                const data = await api.fetchRevenueByYear(yearIncome);
                setRevenueByYear(data.totalIncome || 0);
            } catch (error) {
                console.error("Error fetching revenue data:", error);
            }
        };

        fetchRevenue();
    }, [yearIncome]);

    // Fetch CAPEX by year
    useEffect(() => {
        const fetchCapex = async () => {
            try {
                const data = await api.fetchCapexByYear(yearCapex);
                setCapexByYear(data.totalCapex || 0);
            } catch (error) {
                console.error("Error fetching CAPEX data:", error);
            }
        };

        fetchCapex();
    }, [yearCapex]);

    // Fetch total employees
    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                const data = await api.fetchTotalEmployees();
                setTotalEmployees(data.totalEmployees || 0);
            } catch (error) {
                console.error("Error fetching employee data:", error);
            }
        };

        fetchEmployees();
    }, []);

    const chartOptions = {
        chart: { type: "bar", height: 350, stacked: true },
        plotOptions: { bar: { horizontal: false, columnWidth: "60%", endingShape: "rounded" } },
        dataLabels: { enabled: false },
        stroke: { show: true, width: 1, colors: ["#fff"] },
        xaxis: {
            categories: chartData.categories,
            labels: { style: { colors: theme.palette.text.secondary } }
        },
        fill: { opacity: 1 },
        tooltip: {
            theme: theme.palette.mode,
            y: {
                formatter: (val) => `${val.toFixed(2)} Tona`
            }
        },
        yaxis: {
            labels: {
                style: { colors: theme.palette.text.secondary },
                formatter: function (val) {
                    return Math.round(val);
                }
            }
        },
        legend: {
            position: "bottom",
            horizontalAlign: "center",
            markers: { width: 12, height: 12, radius: 12 },
            labels: { colors: theme.palette.text.primary }
        },
        colors: ["#90caf9", "#b39ddb", "#69f0ae", "#ffab91", "#f44336", "#ffe57f"],
        states: { hover: { filter: { type: "none" }, opacity: 0.7 } },
        grid: {
            borderColor: theme.palette.divider
        }
    };

    const profitabilityChartOptions = {
        chart: {
            type: 'bar',
            height: 250,
            toolbar: { show: false }
        },
        plotOptions: {
            bar: {
                borderRadius: 6,
                columnWidth: '60%',
            }
        },
        dataLabels: {
            enabled: true,
            formatter: function (val) {
                return "$" + formatLargeNumber(val);
            },
            style: {
                fontSize: '11px',
                fontWeight: 'bold'
            }
        },
        xaxis: {
            categories: profitabilityData.map(item => item.fuel_type),
            labels: {
                style: {
                    fontSize: '11px',
                    colors: theme.palette.text.secondary
                }
            }
        },
        yaxis: {
            title: {
                text: "EUR",
                style: {
                    fontSize: '12px',
                    color: theme.palette.text.secondary
                }
            },
            labels: {
                style: { colors: theme.palette.text.secondary },
                formatter: function (val) {
                    return "$" + formatLargeNumber(val);
                }
            }
        },
        colors: ['#00E396'],
        grid: {
            borderColor: theme.palette.divider,
        },
        tooltip: {
            theme: theme.palette.mode,
            y: {
                formatter: function (val) {
                    return "$" + formatLargeNumber(val);
                }
            }
        }
    };

    const profitabilitySeries = [{
        name: "Ukupni prihod",
        data: profitabilityData.map(item => item.total_revenue)
    }];

    const revenuePerTonSeries = [{
        name: "Prihod po toni",
        data: profitabilityData.map(item => item.revenue_per_ton)
    }];

    return (
        <Grid container spacing={3} sx={{ px: 3, mt: 3, width: "100%" }} elevation={0}>
            {/* Kartice sa statistikama */}
            <Grid container spacing={2} sx={{ alignItems: "stretch" }}>
                {[{
                    title: "Ukupni CAPEX",
                    value: (capexByYear * 1000000),
                    color: "linear-gradient(135deg, #6C5CE7 0%, #8E44AD 100%)",
                    icon: <MonetizationOnIcon sx={{ fontSize: 40, color: "#fff" }} />,
                    dropdown: true,
                    yearState: yearCapex,
                    setYear: setYearCapex
                }, {
                    title: "Ukupno korisnika",
                    value: totalEmployees,
                    color: "linear-gradient(135deg, #0984E3 0%, #00A8FF 100%)",
                    icon: <AccountCircleIcon sx={{ fontSize: 40, color: "#fff" }} />
                }, {
                    title: "Ukupni prihod",
                    value: revenueByYear,
                    color: "linear-gradient(135deg, #00CEC9 0%, #1ABC9C 100%)",
                    icon: <AccountBalanceWalletIcon sx={{ fontSize: 40, color: "#fff" }} />,
                    dropdown: true,
                    yearState: yearIncome,
                    setYear: setYearIncome
                }].map((card, index) => (
                    <Grid key={index} item xs={12} sm={6} md={4} sx={{ display: "flex" }}>
                        <Card sx={{
                            background: card.color,
                            color: "#fff",
                            padding: "28px 24px 24px 24px",
                            borderRadius: "16px",
                            flexGrow: 1,
                            height: "100%",
                            minHeight: "180px",
                            display: "flex",
                            flexDirection: "column",
                            zIndex: 2,
                            justifyContent: "space-between",
                            position: "relative",
                            overflow: "hidden",
                            "&:hover": { transform: "translateY(-5px)", boxShadow: 6 }
                        }} elevation={0}>

                            {card.dropdown && (
                                <Box sx={{
                                    position: "absolute",
                                    top: 16,
                                    right: 16,
                                    zIndex: 10
                                }}>
                                    <BeautifulDropdown
                                        value={card.yearState}
                                        onChange={(e) => card.setYear(e.target.value)}
                                        options={["Sve", ...years]}
                                        hideLabel={true}
                                        sx={{
                                            minWidth: 100,
                                            '& .MuiSelect-select': {
                                                padding: '6px 32px 6px 12px',
                                                fontSize: '13px',
                                                color: '#fff !important'
                                            },
                                            '& .MuiSelect-icon': {
                                                color: 'rgba(255,255,255,0.7) !important'
                                            },
                                            '& .MuiOutlinedInput-notchedOutline': {
                                                borderColor: 'rgba(255,255,255,0.3) !important'
                                            }
                                        }}
                                    />
                                </Box>
                            )}

                            <CardContent sx={{
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "space-between",
                                flexGrow: 1,
                                padding: '0 !important',
                                height: '100%'
                            }}>
                                <Box sx={{ flex: 1, mb: 2 }}>
                                    <Typography variant="h4" sx={{
                                        fontWeight: "bold",
                                        fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
                                        lineHeight: 1.2,
                                        mb: 1,
                                        wordBreak: 'break-word'
                                    }}>
                                        {card.title === "Ukupno korisnika"
                                            ? (typeof card.value === "number"
                                                ? card.value.toLocaleString('hr-HR')
                                                : "0")
                                            : card.title === "Ukupni prihod"
                                                ? `$${(typeof revenueByYear === "number"
                                                    ? formatEuropeanNumber(revenueByYear)
                                                    : "0,00")}`
                                                : card.title === "Ukupni CAPEX"
                                                    ? `$${(typeof capexByYear === "number"
                                                        ? formatEuropeanNumber(capexByYear * 1000000)
                                                        : "0,00")}`
                                                    : `$${(typeof card.value === "number"
                                                        ? formatEuropeanNumber(card.value * 1000000)
                                                        : "0,00")}`}
                                    </Typography>

                                    <Typography variant="body1" sx={{
                                        fontSize: '1rem',
                                        opacity: 0.9,
                                        fontWeight: 500
                                    }}>
                                        {card.title}
                                    </Typography>
                                </Box>

                                <Box sx={{
                                    display: 'flex',
                                    justifyContent: 'flex-end',
                                    alignItems: 'flex-end',
                                    mt: 'auto'
                                }}>
                                    <Box sx={{
                                        background: "rgba(255,255,255,0.2)",
                                        padding: "12px",
                                        borderRadius: "50%",
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        {card.icon}
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            <Grid container spacing={2} sx={{ mt: 2, alignItems: "stretch" }} >
                {/* Glavni grafikon */}
                <Grid item xs={12} md={8}>
                    <Card sx={{
                        padding: "16px",
                        backgroundColor: theme.palette.background.paper,
                        borderRadius: "12px",
                        fontFamily: "Roboto, sans-serif"
                    }} elevation={0}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, pb: 2, fontSize: "18px", color: theme.palette.text.primary }}>
                                Analiza proizvodnje goriva
                            </Typography>
                            <Box display="flex" justifyContent="space-between" mb={2} gap={2}>
                                <DropdownWithIcon value={fuelType} onChange={(e) => setFuelType(e.target.value)} options={fuelTypes} label="Svi tipovi" />
                                <DropdownWithIcon value={refinery} onChange={(e) => setRefinery(e.target.value)} options={refineries} label="Sve rafinerije" />
                                <DropdownWithIcon value={year} onChange={(e) => setYear(e.target.value)} options={years} label="Sve godine" />
                            </Box>
                            <Chart options={chartOptions} series={chartData.series} type="bar" height={350} />
                        </CardContent>
                    </Card>
                </Grid>

                {/* Analiza profitabilnosti goriva */}
                <Grid item xs={12} md={4}>
                    <Card sx={{
                        padding: "20px",
                        backgroundColor: theme.palette.background.paper,
                        borderRadius: "16px",
                        fontFamily: "Roboto, sans-serif",
                        height: "100%",
                        boxShadow: theme.palette.mode === 'dark' ? "0 4px 20px rgba(0,0,0,0.4)" : "0 4px 20px rgba(0,0,0,0.08)",
                        border: `1px solid ${theme.palette.divider}`
                    }} elevation={0}>
                        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
                            {/* HEADER SA IKONOM */}
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                                <Box sx={{
                                    background: "linear-gradient(135deg, #00E396 0%, #00B386 100%)",
                                    borderRadius: "12px",
                                    p: 1.5,
                                    mr: 2,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <MonetizationOnIcon sx={{ fontSize: 24, color: "#fff" }} />
                                </Box>
                                <Box>
                                    <Typography variant="h6" sx={{
                                        fontWeight: 700,
                                        color: theme.palette.text.primary,
                                        fontSize: "18px",
                                        lineHeight: 1.2
                                    }}>
                                        Profitabilnost Goriva
                                    </Typography>
                                    <Typography variant="body2" sx={{
                                        color: theme.palette.text.secondary,
                                        fontSize: "13px",
                                        fontWeight: 500
                                    }}>
                                        Analiza prihoda po vrstama
                                    </Typography>
                                </Box>
                            </Box>

                            {/* GLAVNI GRAFIKON */}
                            <Box sx={{ mb: 3 }}>
                                <Chart
                                    options={{
                                        chart: {
                                            type: 'bar',
                                            height: 200,
                                            toolbar: { show: false },
                                            fontFamily: 'Roboto, sans-serif'
                                        },
                                        plotOptions: {
                                            bar: {
                                                borderRadius: 8,
                                                columnWidth: '55%',
                                                dataLabels: {
                                                    position: 'top'
                                                }
                                            }
                                        },
                                        dataLabels: {
                                            enabled: false,
                                        },
                                        xaxis: {
                                            categories: profitabilityData.map(item => {
                                                const nameMap = {
                                                    'Diesel': 'Diesel',
                                                    'Gasoline': 'Benzin',
                                                    'Kerosene': 'Kerozin',
                                                    'Fuel Oil': 'Lož ulje',
                                                    'LPG': 'LPG',
                                                    'Naphtha': 'Nafta',
                                                    'Other Products': 'Ostalo'
                                                };
                                                return nameMap[item.fuel_type] || item.fuel_type;
                                            }),
                                            labels: {
                                                style: {
                                                    fontSize: '11px',
                                                    fontWeight: '600',
                                                    colors: theme.palette.text.secondary
                                                }
                                            },
                                            axisBorder: {
                                                show: false
                                            },
                                            axisTicks: {
                                                show: false
                                            }
                                        },
                                        yaxis: {
                                            labels: {
                                                formatter: function (val) {
                                                    return "$" + formatLargeNumber(val);
                                                },
                                                style: {
                                                    fontSize: '10px',
                                                    colors: theme.palette.text.secondary
                                                }
                                            },
                                            title: {
                                                text: "Ukupni Prihod",
                                                style: {
                                                    fontSize: '11px',
                                                    fontWeight: '600',
                                                    color: theme.palette.text.secondary
                                                }
                                            }
                                        },
                                        colors: ['#00E396'],
                                        grid: {
                                            borderColor: theme.palette.divider,
                                            strokeDashArray: 4,
                                            padding: {
                                                top: -20,
                                                right: 0,
                                                bottom: 0,
                                                left: 0
                                            }
                                        },
                                        tooltip: {
                                            enabled: true,
                                            theme: 'light',
                                            style: {
                                                fontSize: '12px',
                                                fontFamily: 'Roboto, sans-serif',
                                                color: '#000'
                                            },
                                            custom: function ({ series, seriesIndex, dataPointIndex, w }) {
                                                const fuelType = w.globals.labels[dataPointIndex];
                                                const revenue = series[seriesIndex][dataPointIndex];
                                                const fuelData = profitabilityData.find(item => {
                                                    const nameMap = {
                                                        'Diesel': 'Diesel',
                                                        'Benzin': 'Gasoline',
                                                        'Kerozin': 'Kerosene',
                                                        'Lož ulje': 'Fuel Oil',
                                                        'LPG': 'LPG',
                                                        'Nafta': 'Naphtha',
                                                        'Ostalo': 'Other Products'
                                                    };
                                                    return nameMap[fuelType] === item.fuel_type;
                                                });

                                                return `
                                    <div style="padding: 8px 12px; background: white; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); border: 1px solid #e2e8f0;">
                                        <div style="font-weight: 700; color: #1a1a1a; margin-bottom: 4px;">${fuelType}</div>
                                        <div style="display: flex; justify-content: space-between; align-items: center; gap: 16px;">
                                            <span style="color: #666; font-size: 11px;">Ukupni prihod:</span>
                                            <span style="color: #00E396; font-weight: 800; font-size: 13px;">$${formatLargeNumber(revenue)}</span>
                                        </div>
                                        ${fuelData ? `
                                        <div style="display: flex; justify-content: space-between; align-items: center; gap: 16px; margin-top: 2px;">
                                            <span style="color: #666; font-size: 11px;">Prodano:</span>
                                            <span style="color: #008FFB; font-weight: 600; font-size: 11px;">${formatLargeNumber(fuelData.total_sold)} tona</span>
                                        </div>
                                        <div style="display: flex; justify-content: space-between; align-items: center; gap: 16px; margin-top: 2px;">
                                            <span style="color: #666; font-size: 11px;">Po toni:</span>
                                            <span style="color: #FEB019; font-weight: 600; font-size: 11px;">$${Math.round(fuelData.revenue_per_ton).toLocaleString('hr-HR')}/t</span>
                                        </div>
                                        ` : ''}
                                    </div>
                                `;
                                            }
                                        }
                                    }}
                                    series={profitabilitySeries}
                                    type="bar"
                                    height={200}
                                />
                            </Box>

                            {/* DETALJNA LISTA */}
                            <Box sx={{
                                maxHeight: expanded ? '400px' : '200px',
                                overflow: 'auto',
                                '&::-webkit-scrollbar': {
                                    width: '4px',
                                },
                                '&::-webkit-scrollbar-track': {
                                    background: '#f1f1f1',
                                    borderRadius: '10px',
                                },
                                '&::-webkit-scrollbar-thumb': {
                                    background: '#c1c1c1',
                                    borderRadius: '10px',
                                }
                            }}>
                                {profitabilityData.slice(0, expanded ? profitabilityData.length : 3).map((fuel, index) => (
                                    <Card
                                        key={index}
                                        sx={{
                                            mb: 1.5,
                                            p: 2,
                                            borderRadius: "12px",
                                            border: `1px solid ${theme.palette.divider}`,
                                            backgroundColor: index < 3 ? (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : '#f8fafc') : theme.palette.background.paper,
                                            transition: 'all 0.2s ease',
                                            '&:hover': {
                                                transform: 'translateY(-1px)',
                                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                                borderColor: '#00E396'
                                            }
                                        }}
                                        elevation={0}
                                    >
                                        <Grid container spacing={1} alignItems="center">
                                            {/* GORIVO I KOLIČINA */}
                                            <Grid item xs={7}>
                                                <Typography variant="subtitle1" sx={{
                                                    color: theme.palette.text.primary,
                                                    fontSize: "14px",
                                                    fontWeight: "700",
                                                    mb: 0.5
                                                }}>
                                                    {fuel.fuel_type === 'Gasoline' ? 'Benzin' :
                                                        fuel.fuel_type === 'Kerosene' ? 'Kerozin' :
                                                            fuel.fuel_type === 'Fuel Oil' ? 'Lož ulje' :
                                                                fuel.fuel_type === 'Other Products' ? 'Ostalo' : fuel.fuel_type}
                                                </Typography>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Box sx={{
                                                        width: 8,
                                                        height: 8,
                                                        borderRadius: '50%',
                                                        backgroundColor: index === 0 ? '#00E396' :
                                                            index === 1 ? '#008FFB' :
                                                                index === 2 ? '#FEB019' : '#FF4560'
                                                    }} />
                                                    <Typography variant="caption" sx={{
                                                        color: theme.palette.text.secondary,
                                                        fontSize: "11px",
                                                        fontWeight: "500"
                                                    }}>
                                                        {formatLargeNumber(fuel.total_sold)} tona
                                                    </Typography>
                                                </Box>
                                            </Grid>

                                            {/* PRIHODI */}
                                            <Grid item xs={5} sx={{ textAlign: "right" }}>
                                                <Typography variant="h6" sx={{
                                                    color: "#00E396",
                                                    fontSize: "15px",
                                                    fontWeight: "800",
                                                    lineHeight: 1.2,
                                                    mb: 0.5
                                                }}>
                                                    ${formatLargeNumber(fuel.total_revenue)}
                                                </Typography>
                                                <Typography variant="caption" sx={{
                                                    color: "#008FFB",
                                                    fontSize: "10px",
                                                    fontWeight: "600",
                                                    backgroundColor: '#f0f7ff',
                                                    px: 1,
                                                    py: 0.5,
                                                    borderRadius: '6px'
                                                }}>
                                                    ${Math.round(fuel.revenue_per_ton).toLocaleString('hr-HR')}/t
                                                </Typography>
                                            </Grid>
                                        </Grid>

                                        {/* PROGRESS BAR */}
                                        {profitabilityData.length > 0 && (
                                            <Box sx={{ mt: 1.5 }}>
                                                <Box sx={{
                                                    width: '100%',
                                                    height: 4,
                                                    backgroundColor: theme.palette.action.selected,
                                                    borderRadius: '2px',
                                                    overflow: 'hidden'
                                                }}>
                                                    <Box sx={{
                                                        width: `${(fuel.total_revenue / profitabilityData[0].total_revenue) * 100}%`,
                                                        height: '100%',
                                                        backgroundColor: index === 0 ? '#00E396' :
                                                            index === 1 ? '#008FFB' :
                                                                index === 2 ? '#FEB019' : '#FF4560',
                                                        borderRadius: '2px',
                                                        transition: 'all 0.3s ease'
                                                    }} />
                                                </Box>
                                            </Box>
                                        )}
                                    </Card>
                                ))}
                            </Box>

                            {/* TOGGLE BUTTON */}
                            {profitabilityData.length > 3 && (
                                <Box mt={2} textAlign="center">
                                    <Box
                                        onClick={() => setExpanded(!expanded)}
                                        sx={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: 1,
                                            px: 2,
                                            py: 1,
                                            borderRadius: "8px",
                                            backgroundColor: expanded ? '#f8fafc' : '#f0f7ff',
                                            border: `1px solid ${expanded ? '#e2e8f0' : '#008FFB'}`,
                                            cursor: "pointer",
                                            transition: 'all 0.2s ease',
                                            '&:hover': {
                                                backgroundColor: expanded ? theme.palette.action.hover : '#e6f2ff',
                                                transform: 'translateY(-1px)'
                                            }
                                        }}
                                    >
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                color: expanded ? "#64748b" : "#008FFB",
                                                fontWeight: "700",
                                                fontSize: "12px",
                                                textTransform: "uppercase"
                                            }}
                                        >
                                            {expanded ? "Manje detalja" : "Više detalja"}
                                        </Typography>
                                        {expanded ?
                                            <ExpandLessIcon sx={{ fontSize: 16, color: "#64748b" }} /> :
                                            <ExpandMoreIcon sx={{ fontSize: 16, color: "#008FFB" }} />
                                        }
                                    </Box>
                                </Box>
                            )}

                            {/* FOOTER */}
                            {profitabilityData.length > 0 && (
                                <Box sx={{
                                    mt: 2,
                                    pt: 2,
                                    borderTop: "1px solid #f0f0f0",
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <Typography variant="caption" sx={{ color: "#666", fontWeight: "500" }}>
                                        Ukupno {profitabilityData.length} vrste goriva
                                    </Typography>
                                    <Typography variant="caption" sx={{
                                        color: "#00E396",
                                        fontWeight: "700",
                                        backgroundColor: '#f0faf5',
                                        px: 1.5,
                                        py: 0.5,
                                        borderRadius: '6px'
                                    }}>
                                        ${formatLargeNumber(profitabilityData.reduce((sum, item) => sum + item.total_revenue, 0))}
                                    </Typography>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Grid>
    );
};

export default AdminDashboard;